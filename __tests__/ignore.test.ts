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

  test('should parse empty ignore file', () => {
    fs.writeFileSync(ignoreFilePath, '');
    const rules = parseIgnoreFile(testDir);

    expect(rules.filePatterns).toHaveLength(0);
    expect(rules.stringIgnores.size).toBe(0);
  });

  test('should parse file patterns', () => {
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

  test('should parse string ignores', () => {
    const testHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const ignoreContent = `
# Known false positives
${testHash}
`;
    fs.writeFileSync(ignoreFilePath, ignoreContent);
    const rules = parseIgnoreFile(testDir);

    expect(rules.stringIgnores.has(testHash.toLowerCase())).toBe(true);
  });

  test('should ignore files by pattern', () => {
    const ignoreContent = `**/*test*.ts`;
    fs.writeFileSync(ignoreFilePath, ignoreContent);
    const rules = parseIgnoreFile(testDir);

    const shouldIgnoreTest = shouldIgnore('somehash', 'src/utils.test.ts', rules);
    const shouldIgnoreNormal = shouldIgnore('somehash', 'src/utils.ts', rules);

    expect(shouldIgnoreTest).toBe(true);
    expect(shouldIgnoreNormal).toBe(false);
  });

  test('should ignore specific strings', () => {
    const testHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const ignoreContent = testHash;
    fs.writeFileSync(ignoreFilePath, ignoreContent);
    const rules = parseIgnoreFile(testDir);

    const shouldIgnoreHash = shouldIgnore(testHash, 'src/file.ts', rules);
    const shouldIgnoreOther = shouldIgnore('otherhash', 'src/file.ts', rules);

    expect(shouldIgnoreHash).toBe(true);
    expect(shouldIgnoreOther).toBe(false);
  });

  test('should handle non-existent ignore file', () => {
    const rules = parseIgnoreFile(testDir);

    expect(rules.filePatterns).toHaveLength(0);
    expect(rules.stringIgnores.size).toBe(0);
  });

  test('should ignore comments and empty lines', () => {
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

  test('should handle multiple file patterns', () => {
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
});
