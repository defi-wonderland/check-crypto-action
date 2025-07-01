import * as core from '@actions/core';
import { execSync } from 'child_process';
import clone from 'just-clone';
import { parseIgnoreFile, shouldIgnore, IgnoreRules } from './ignore';

export type Result = {
  passed: boolean;
  foundAddresses: AddressObject;
  foundPrivates: AddressObject;
};

type AddressObject = { [key: string]: { files: string[] } };

export const fetchDiff = (branch = 'main'): string => {
  // NOTE We set the max node buffer to +-50mb to account for large diffs
  const MAX_BUFFER = 1000 * 1000 * 50;

  core.debug('Fetch branch to compare');
  execSync(`git fetch origin ${branch}`, { maxBuffer: MAX_BUFFER });
  return execSync(`git diff origin/${branch} HEAD`, { maxBuffer: MAX_BUFFER }).toString();
};

export const processDiff = (diff: string): Result => {
  // Load ignore rules
  const ignoreRules = parseIgnoreFile();

  let currentFile = '';
  let foundAddresses: AddressObject = {};
  let foundPrivates: AddressObject = {};

  // NOTE Split diff line by line
  diff.split('\n').forEach(line => {
    // NOTE New file
    if (line.includes('diff --git a')) {
      currentFile = line.split(' b/')[1];
    }
    if ((line && line[0] === '-') || line[0] === '+') {
      // NOTE Regexp for public addresses
      const publicKeysFound = [...line.matchAll(/0x[a-fA-F0-9]{40}/g)].flat();
      const filteredPublicKeys = publicKeysFound.filter(key => !shouldIgnore(key, currentFile, ignoreRules));
      foundAddresses = getNewKeysMap(filteredPublicKeys, foundAddresses, currentFile);

      // NOTE Regexp for private addresses
      const privateKeysFound = [...line.matchAll(/[1234567890abcdefABCDEF]{64}/g)].flat();
      const filteredPrivateKeys = privateKeysFound.filter(key => !shouldIgnore(key, currentFile, ignoreRules));
      foundPrivates = getNewKeysMap(filteredPrivateKeys, foundPrivates, currentFile);
    }
  });

  const passed = Object.keys(foundPrivates).length == 0;

  return {
    passed,
    foundAddresses,
    foundPrivates,
  };
};

export const getSummary = (
  passed: boolean,
  foundAddresses: AddressObject,
  foundPrivates: AddressObject,
  reportPublicKeys?: boolean,
): string => {
  let summary = '';

  const privateKeys = Object.keys(foundPrivates);
  const publicKeys = Object.keys(foundAddresses);

  if (privateKeys.length) {
    summary += '🚨 Possible private keys found: \n';

    privateKeys.forEach(key => {
      summary += `- Private key \`${key}\` in file/s ${foundPrivates[key].files.join(', ')}  \n`;
    });
    summary += '\n';
  }

  if (reportPublicKeys && publicKeys.length) {
    summary += '⚠️ Possible public keys found: \n';
    publicKeys.forEach(key => {
      summary += `- Public key \`${key}\` in file/s ${foundAddresses[key].files.join(', ')} \n`;
    });
    summary += '\n';
  }

  if (passed) {
    summary += `✅ Check succeeded, no crypto private addresses found in this diff.`;
  }

  return summary;
};

function getNewKeysMap(keysArray: string[], foundKeysMap: AddressObject, currentFile: string): AddressObject {
  const newKeysMap = clone(foundKeysMap);

  keysArray.forEach(address => {
    if (!newKeysMap[address] || !newKeysMap[address]?.files) {
      newKeysMap[address] = { files: [currentFile] };
    } else if (Array.isArray(newKeysMap[address].files)) {
      if (newKeysMap[address].files.indexOf(currentFile) === -1) newKeysMap[address].files.push(currentFile);
    }
  });

  return newKeysMap;
}
