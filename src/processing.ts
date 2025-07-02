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

      // Log helpful info for found public keys (if any)
      if (filteredPublicKeys.length > 0) {
        filteredPublicKeys.forEach(key => {
          core.debug(`Found potential public key: ${key} in ${currentFile}`);
        });
      }

      foundAddresses = getNewKeysMap(filteredPublicKeys, foundAddresses, currentFile);

      // NOTE Regexp for private addresses
      const privateKeysFound = [...line.matchAll(/[1234567890abcdefABCDEF]{64}/g)].flat();
      const filteredPrivateKeys = privateKeysFound.filter(key => !shouldIgnore(key, currentFile, ignoreRules));

      // Log helpful info for found keys
      filteredPrivateKeys.forEach(key => {
        core.info(`Found potential private key: ${key} in ${currentFile}`);
        core.info(`💡 False positive? Add to .checkcryptoignore: ${key} or ${currentFile}`);
      });

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
      // Wrap file paths in backticks to prevent markdown formatting issues
      const wrappedFiles = foundPrivates[key].files.map(file => `\`${file}\``);
      summary += `- Private key \`${key}\` in file/s ${wrappedFiles.join(', ')}  \n`;
    });
    summary += '\n';
  }

  if (reportPublicKeys && publicKeys.length) {
    summary += '⚠️ Possible public keys found: \n';
    publicKeys.forEach(key => {
      // Wrap file paths in backticks to prevent markdown formatting issues
      const wrappedFiles = foundAddresses[key].files.map(file => `\`${file}\``);
      summary += `- Public key \`${key}\` in file/s ${wrappedFiles.join(', ')} \n`;
    });
    summary += '\n';
  }

  // Add comprehensive false positive guidance if any keys were found
  if (privateKeys.length || (reportPublicKeys && publicKeys.length)) {
    summary += '💡 **False positive?** Add the key or file pattern to `.checkcryptoignore` in your repo root:\n';
    summary += '```\n';
    summary += '# Ignore specific keys\n';

    // Add all found keys
    privateKeys.forEach(key => {
      summary += `${key}\n`;
    });
    if (reportPublicKeys) {
      publicKeys.forEach(key => {
        summary += `${key}\n`;
      });
    }

    summary += '\n# Or ignore files/patterns\n';

    // Add all unique file paths
    const allFiles = [
      ...new Set([
        ...privateKeys.flatMap(key => foundPrivates[key].files),
        ...(reportPublicKeys ? publicKeys.flatMap(key => foundAddresses[key].files) : []),
      ]),
    ];
    allFiles.forEach(file => {
      summary += `${file}\n`;
    });

    summary += '\n# Or ignore directories (use trailing slash)\n';
    summary += 'tests/\n';

    summary += '```\n\n';
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
