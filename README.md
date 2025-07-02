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

You can create a `.checkcryptoignore` file in your repository root to ignore false positives. This file supports:

### Directory Patterns

```
# Ignore entire directories (use trailing slash)
tests/
__tests__/
docs/
fixtures/
```

### File Patterns

```
# Ignore specific files (matches anywhere in project)
README.md
package-lock.json
.env
```

### Specific Hex Strings

```
# Ignore specific 64-character hex strings that are not private keys
1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**Example `.checkcryptoignore` file:**

```
# Test directories
tests/
__tests__/

# Documentation
docs/
README.md

# Known false positives
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
