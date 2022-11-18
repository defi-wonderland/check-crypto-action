import * as core from '@actions/core';
import * as github from '@actions/github';
import { parseInputs } from './inputs';
import { fetchDiff, processDiff, getSummary } from './processing';
import { createRun, createComment } from './notifications';

async function run(): Promise<void> {
  try {
    core.debug(`Parsing inputs`);
    const inputs = parseInputs(core.getInput);

    core.debug(`Calculating result`);
    const diff = fetchDiff(inputs.branch);
    const result = processDiff(diff);
    const summary = getSummary(result.passed, result.foundAddresses, result.foundPrivates, inputs.reportPublicKeys);

    if (inputs.notifications) {
      core.debug(`Setting up OctoKit`);
      const octokit = new github.GitHub(inputs.notifications.token);

      const notifyPublicAddresses = inputs.reportPublicKeys && Object.keys(result.foundAddresses).length;
      const notifyIssue = inputs.notifications.issue && (!result.passed || notifyPublicAddresses);

      if (inputs.notifications.check) {
        core.debug(`Notification: Check Run`);
        await createRun(octokit, github.context, result, summary, inputs.notifications.label);
      }
      if (notifyIssue) {
        core.debug(`Notification: Issue`);
        const issueId = github.context.issue.number;
        if (issueId || issueId === 0) {
          await createComment(octokit, github.context, result, summary, inputs.notifications.label);
        } else {
          core.debug(`Notification: no issue id`);
        }
      }
    }

    if (!inputs.onlyNotify && !result.passed) {
      core.setFailed(summary);
    }
    core.info(summary);

    core.debug(`Setting outputs`);
    core.setOutput('passed', result.passed ? 'true' : 'false');

    core.debug(`Done`);
  } catch (e) {
    const error = e as Error;
    const message = error.message ?? error;
    core.debug(`Error: ${message}`);
    core.setFailed(message);
  }
}

void run();
