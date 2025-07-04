[![build-test](https://github.com/defi-wonderland/check-crypto-action/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/defi-wonderland/check-crypto-action/actions/workflows/test.yml)
[![tag badge](https://img.shields.io/github/v/tag/defi-wonderland/check-crypto-action)](https://github.com/defi-wonderland/check-crypto-action/tags)
[![license badge](https://img.shields.io/github/license/defi-wonderland/check-crypto-action)](./LICENSE)

# Check Crypto Action

This action checks for crypto private keys in the diff code for the current commit and a specific branch.

## Action Inputs

| Input              | Description                                                                     | Default      |
| ------------------ | ------------------------------------------------------------------------------- | ------------ |
| branch             | Name of branch to compare                                                       | **Required** |
| token              | Your GITHUB_TOKEN, used when sending the notification                           | None         |
| title              | Add a title to the notifications to distinguish between multiple workflows/jobs | None         |
| notify_issue       | Send a notification to the linked issue/pull-request with the summary           | true         |
| notify_check       | Create a check run with the summary                                             | None         |
| report_public_keys | Report public keys into the pr summary                                          | None         |
| only_notify        | Only notify the build without failing                                           | None         |

**Note:**
In order to send issue notifications on Github, you must supply the `token` input

## Required Permissions

The action requires the following permissions (use all of them for simplicity):

### Minimum Required

- `contents: read` - Always required to read repository code and git diffs

### Optional (based on configuration)

- `checks: write` - Only if `notify_check: true` (creates check runs)
- `pull-requests: write` - Only if `notify_issue: true` on pull requests

### Example with explicit permissions:

```yaml
jobs:
  crypto-check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      checks: write
    steps:
      - uses: actions/checkout@v4
      - uses: defi-wonderland/check-crypto-action@v1
        with:
          branch: main
          notify_check: true
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Ignoring False Positives

You can create a `.checkcryptoignore` file in your repository root to ignore false positives. This file supports glob patterns for flexible file matching:

### Glob Patterns

The ignore file supports full glob pattern matching with wildcards and directory traversal.

**Note:** To ignore directories, you must use explicit glob patterns with wildcards (e.g., `**/__tests__/**`). Simple directory names like `__tests__/` will not work as expected.

```
# Ignore all test files anywhere in the project
**/*test*.ts
**/*spec*.js

# Ignore entire directories and their contents
**/fixtures/**        # All fixtures directories anywhere
**/tests/**            # All tests directories anywhere
**/__tests__/**        # All __tests__ directories anywhere
docs/**                # All files in docs directory (from root)

# Ignore specific file types
*.log
*.tmp
*.env*

# Ignore files by exact name
README.md
package-lock.json

# Complex patterns
src/**/temp/**
build/**/*.map
```

### Specific Hex Strings

```
# Ignore specific 64-character hex strings that are not private keys
1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Pattern Examples

| Pattern          | Matches                                        |
| ---------------- | ---------------------------------------------- |
| `*.js`           | All JavaScript files                           |
| `**/*test*.ts`   | Any file containing "test" in TypeScript files |
| `**/fixtures/**` | Any file in fixtures directories               |
| `docs/**`        | All files in docs directory                    |
| `src/**/temp/**` | Temp directories anywhere under src            |
| `build/**/*.map` | All .map files in build directory              |

**Example `.checkcryptoignore` file:**

```
# Test files and directories
**/*test*.ts
**/*spec*.js
**/fixtures/**
**/__tests__/**

# Documentation
docs/**
README.md

# Build artifacts
build/**
dist/**
*.log

# Known false positives (hex strings)
1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

## Action Outputs

| Output | Description                                  |
| ------ | -------------------------------------------- |
| passed | Boolean describing if the test passed or not |

# Usage

## Example

The example below shows how to `notify on a PR and check` if it finds a crypto private key. comparing to the `dev` branch.

```yaml
jobs:
  crypto-check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      checks: write
    steps:
      - uses: actions/checkout@v4
      - name: Check for private keys
        uses: defi-wonderland/check-crypto-action@v1
        with:
          title: Check private key and notify
          branch: dev
          notify_check: true
          token: ${{ secrets.GITHUB_TOKEN }}
```

The example below shows how to `only check without notifying` on a PR if it finds a crypto private key. comparing to the `dev` branch.

```yaml
jobs:
  crypto-check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      checks: write
    steps:
      - uses: actions/checkout@v4
      - name: Check for private keys
        uses: defi-wonderland/check-crypto-action@v1
        with:
          title: Check private key and notify
          branch: dev
          notify_issue: false
          notify_check: true
          token: ${{ secrets.GITHUB_TOKEN }}
```

The example below shows how to `notify without ever failing` on a PR if it finds a crypto private key. comparing to the `dev` branch.

```yaml
jobs:
  crypto-check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      checks: write
    steps:
      - uses: actions/checkout@v4
      - name: Check for private keys
        uses: defi-wonderland/check-crypto-action@v1
        with:
          title: Check private key and notify
          branch: dev
          only_notify: true
          token: ${{ secrets.GITHUB_TOKEN }}
```

# Development

Install the dependencies

```bash
npm install
```

Build the typescript and package it for distribution

```bash
npm run build && npm run package
```

Run the tests :heavy_check_mark:

```bash
npm test
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
