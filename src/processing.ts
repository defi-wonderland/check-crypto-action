import * as core from '@actions/core';
import { execSync } from 'child_process';

export type Result = {
  passed: boolean;
  summary: string;
};

type AddressObject = { [key: string]: { files: string[] } };

const getSummary = (passed: boolean, foundAddresses: AddressObject, foundPrivates: AddressObject): string => {
  let summary = '';
  Object.keys(foundAddresses).forEach(key => {
    summary += `- Found public address [${key}] in file/s ${foundAddresses[key].files.join(', ')} \n`;
  });
  Object.keys(foundPrivates).forEach(key => {
    summary += `- Found possible private key \`${key}\` in file/s ${foundPrivates[key].files.join(', ')}  \n`;
  });

  if (passed) {
    summary += `Check succeeded, no crypto private addresses found in this diff.`;
  }

  return summary;
};

export const processDiff = (branch = 'main'): Result => {
  core.debug('Fetch branch to compare');
  execSync(`git fetch origin ${branch}`);
  const diff = execSync(`git diff origin/${branch} HEAD`).toString();
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

      // NOTE Regexp for private addresses
      const privateKeysFound = [...line.matchAll(/[1234567890abcdefABCDEF]{64}/g)].flat();

      foundAddresses = searchForKey(publicKeysFound, foundAddresses, currentFile);
      foundPrivates = searchForKey(privateKeysFound, foundPrivates, currentFile);
    }
  });

  const passed = Object.keys(foundPrivates).length == 0;

  return {
    passed,
    summary: getSummary(passed, foundAddresses, foundPrivates),
  };
};

function searchForKey(keysArray: string[], foundKeysMap: AddressObject, currentFile: string): AddressObject {
  keysArray.forEach(address => {
    if (!foundKeysMap[address] || !foundKeysMap[address]?.files) {
      foundKeysMap[address] = { files: [currentFile] };
    } else if (Array.isArray(foundKeysMap[address].files)) {
      if (foundKeysMap[address].files.indexOf(currentFile) === -1) foundKeysMap[address].files.push(currentFile);
    }
  });

  return foundKeysMap;
}
