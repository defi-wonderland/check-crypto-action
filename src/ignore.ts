import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

export interface IgnoreRules {
  filePatterns: string[];
  stringIgnores: Set<string>;
}

const IGNORE_FILE_NAME = '.checkcryptoignore';

/**
 * Determines whether a file path matches any of the provided ignore patterns.
 *
 * Patterns ending with '/' are treated as directory patterns and match any file within that directory. Other patterns match exact file names or files within subdirectories.
 *
 * @param filePath - The path of the file to check
 * @param patterns - An array of ignore patterns to match against
 * @returns `true` if the file path matches any pattern; otherwise, `false`
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
 * Parses the `.checkcryptoignore` file in the specified directory and returns ignore rules for files and strings.
 *
 * Ignores empty lines and comments. Lines matching a 64-character hexadecimal string are treated as string ignores; all other lines are treated as file or directory patterns.
 *
 * @param workingDirectory - The directory to search for the `.checkcryptoignore` file. Defaults to the current working directory.
 * @returns An `IgnoreRules` object containing file patterns and string ignores.
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
 * Determines whether a found string in a file should be ignored based on provided ignore rules.
 *
 * Returns `true` if the file path matches any ignore pattern or if the found string is listed in the set of ignored strings; otherwise, returns `false`.
 *
 * @param foundString - The string detected in the file to check for ignoring
 * @param filePath - The path of the file where the string was found
 * @param rules - The ignore rules containing file patterns and string ignores
 * @returns `true` if the finding should be ignored; otherwise, `false`
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
