import { expect, test, describe } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { parseIgnoreFile, shouldIgnore } from '../src/ignore';

describe('Ignore functionality tests', () => {
  const testDir = path.join(__dirname, 'temp-ignore-test');
  const ignoreFilePath = path.join(testDir, '.checkcryptoignore');

  beforeEach(() => {
    // Create temp directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('parses empty ignore file returning no rules', () => {
    fs.writeFileSync(ignoreFilePath, '');
    const rules = parseIgnoreFile(testDir);

    expect(rules.filePatterns).toHaveLength(0);
    expect(rules.stringIgnores.size).toBe(0);
  });

  test('parses file patterns from ignore content', () => {
    const ignoreContent = `
# Test files
**/*test*.ts
**/fixtures/**
docs/**
`;
    fs.writeFileSync(ignoreFilePath, ignoreContent);
    const rules = parseIgnoreFile(testDir);

    expect(rules.filePatterns).toContain('**/*test*.ts');
    expect(rules.filePatterns).toContain('**/fixtures/**');
    expect(rules.filePatterns).toContain('docs/**');
  });

  test('parses 64-character hex strings as string ignores', () => {
    const testHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const ignoreContent = `
# Known false positives
${testHash}
`;
    fs.writeFileSync(ignoreFilePath, ignoreContent);
    const rules = parseIgnoreFile(testDir);

    expect(rules.stringIgnores.has(testHash.toLowerCase())).toBe(true);
  });

  test('ignores files matching configured patterns', () => {
    const ignoreContent = `utils.test.ts`;
    fs.writeFileSync(ignoreFilePath, ignoreContent);
    const rules = parseIgnoreFile(testDir);

    const shouldIgnoreTest = shouldIgnore('somehash', 'src/utils.test.ts', rules);
    const shouldIgnoreNormal = shouldIgnore('somehash', 'src/utils.ts', rules);

    expect(shouldIgnoreTest).toBe(true);
    expect(shouldIgnoreNormal).toBe(false);
  });

  test('ignores specific hex strings from ignore list', () => {
    const testHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const ignoreContent = testHash;
    fs.writeFileSync(ignoreFilePath, ignoreContent);
    const rules = parseIgnoreFile(testDir);

    const shouldIgnoreHash = shouldIgnore(testHash, 'src/file.ts', rules);
    const shouldIgnoreOther = shouldIgnore('otherhash', 'src/file.ts', rules);

    expect(shouldIgnoreHash).toBe(true);
    expect(shouldIgnoreOther).toBe(false);
  });

  test('returns empty rules when ignore file does not exist', () => {
    const rules = parseIgnoreFile(testDir);

    expect(rules.filePatterns).toHaveLength(0);
    expect(rules.stringIgnores.size).toBe(0);
  });

  test('skips comments and empty lines when parsing ignore file', () => {
    const ignoreContent = `
# This is a comment
    # This is also a comment

**/*test*.ts
# Another comment
1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

`;
    fs.writeFileSync(ignoreFilePath, ignoreContent);
    const rules = parseIgnoreFile(testDir);

    expect(rules.filePatterns).toHaveLength(1);
    expect(rules.filePatterns).toContain('**/*test*.ts');
    expect(rules.stringIgnores.size).toBe(1);
  });

  test('parses multiple file patterns correctly', () => {
    const ignoreContent = `
**/*test*.ts
**/*spec*.js
**/fixtures/**
docs/**
README.md
`;
    fs.writeFileSync(ignoreFilePath, ignoreContent);
    const rules = parseIgnoreFile(testDir);

    expect(rules.filePatterns).toHaveLength(5);
    expect(rules.filePatterns).toContain('**/*test*.ts');
    expect(rules.filePatterns).toContain('**/*spec*.js');
    expect(rules.filePatterns).toContain('**/fixtures/**');
    expect(rules.filePatterns).toContain('docs/**');
    expect(rules.filePatterns).toContain('README.md');
  });

  test('supports complex glob patterns with wildcards and directory matching', () => {
    const ignoreContent = `
**/*test*.ts
**/fixtures/**
docs/**
*.log
src/**/temp/**
`;
    fs.writeFileSync(ignoreFilePath, ignoreContent);
    const rules = parseIgnoreFile(testDir);

    // Test various glob patterns
    expect(shouldIgnore('hash', 'src/utils.test.ts', rules)).toBe(true); // **/*test*.ts
    expect(shouldIgnore('hash', 'deep/nested/file.test.ts', rules)).toBe(true); // **/*test*.ts
    expect(shouldIgnore('hash', 'src/fixtures/data.json', rules)).toBe(true); // **/fixtures/**
    expect(shouldIgnore('hash', 'docs/readme.md', rules)).toBe(true); // docs/**
    expect(shouldIgnore('hash', 'debug.log', rules)).toBe(true); // *.log
    expect(shouldIgnore('hash', 'src/utils/temp/file.txt', rules)).toBe(true); // src/**/temp/**

    // Test files that should NOT be ignored
    expect(shouldIgnore('hash', 'src/utils.ts', rules)).toBe(false); // No pattern matches
    expect(shouldIgnore('hash', 'src/component.jsx', rules)).toBe(false); // No pattern matches
    expect(shouldIgnore('hash', 'other/readme.md', rules)).toBe(false); // docs/** doesn't match
  });
});
