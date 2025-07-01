import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

export interface IgnoreRules {
  filePatterns: string[];
  stringIgnores: Set<string>;
}

const IGNORE_FILE_NAME = '.checkcryptoignore';

/**
 * Convert a glob pattern to a regex
 */
function globToRegex(pattern: string): RegExp {
  const regexPattern = pattern
    .replace(/\*\*/g, '§DOUBLESTAR§') // Temporary placeholder
    .replace(/\*/g, '[^/]*') // Single * matches anything except /
    .replace(/§DOUBLESTAR§/g, '.*') // ** matches anything including /
    .replace(/\?/g, '[^/]'); // ? matches single character except /

  return new RegExp(`^${regexPattern}$`);
}

/**
 * Check if a file path matches any ignore pattern
 */
function isFileIgnored(filePath: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    const regex = globToRegex(pattern);
    return regex.test(filePath);
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

  return false;
}
