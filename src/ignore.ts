import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

export interface IgnoreRules {
  filePatterns: string[];
  stringIgnores: Set<string>;
}

const IGNORE_FILE_NAME = '.checkcryptoignore';

/**
 * Check if a file path matches any ignore pattern
 */
function isFileIgnored(filePath: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    let matches = false;

    if (pattern.endsWith('/')) {
      // Directory pattern: matches if file is inside this directory
      const dirPattern = pattern.slice(0, -1); // Remove trailing /
      matches = filePath.startsWith(dirPattern + '/');
    } else {
      // Exact file match
      matches = filePath === pattern || filePath.endsWith('/' + pattern);
    }

    return matches;
  });
}

/**
 * Parse the ignore file and return structured rules
 */
export function parseIgnoreFile(workingDirectory: string = process.cwd()): IgnoreRules {
  const ignoreFilePath = path.join(workingDirectory, IGNORE_FILE_NAME);

  const rules: IgnoreRules = {
    filePatterns: [],
    stringIgnores: new Set(),
  };

  if (!fs.existsSync(ignoreFilePath)) {
    core.debug(`No ignore file found at ${ignoreFilePath}`);
    return rules;
  }

  try {
    const content = fs.readFileSync(ignoreFilePath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Check for hex string (64 characters of hex)
      if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        rules.stringIgnores.add(trimmed.toLowerCase());
        continue;
      }

      // Otherwise, treat as file pattern
      rules.filePatterns.push(trimmed);
    }

    core.debug(
      `Loaded ignore rules: ${rules.filePatterns.length} file patterns, ${rules.stringIgnores.size} string ignores`,
    );
  } catch (error) {
    core.warning(`Failed to read ignore file: ${error instanceof Error ? error.message : error}`);
  }

  return rules;
}

/**
 * Check if a potential crypto finding should be ignored
 */
export function shouldIgnore(foundString: string, filePath: string, rules: IgnoreRules): boolean {
  core.debug(`Checking if should ignore "${foundString}" in file "${filePath}"`);

  // Check if file is ignored by pattern
  if (isFileIgnored(filePath, rules.filePatterns)) {
    core.debug(`Ignoring ${foundString} in ${filePath} - file pattern match`);
    return true;
  }

  // Check if specific string is ignored
  if (rules.stringIgnores.has(foundString.toLowerCase())) {
    core.debug(`Ignoring ${foundString} - string specific ignore`);
    return true;
  }

  core.debug(`NOT ignoring ${foundString} in ${filePath} - no patterns matched`);
  return false;
}
