import * as core from '@actions/core';
import * as github from '@actions/github';
import { parseInputs } from './inputs';
import { processDiff } from './processing';
import { createRun, createComment } from './notifications';

async function run(): Promise<void> {
  try {
    core.debug(`Parsing inputs`);
    const inputs = parseInputs(core.getInput);

    core.debug(`Calculating result`);
    const result = processDiff(inputs.branch);

    if (inputs.notifications) {
      core.debug(`Setting up OctoKit`);
      const octokit = new github.GitHub(inputs.notifications.token);

      if (inputs.notifications.check) {
        core.debug(`Notification: Check Run`);
        await createRun(octokit, github.context, result, inputs.notifications.label);
      }
      if (inputs.notifications.issue && !result.passed) {
        core.debug(`Notification: Issue`);
        const issueId = github.context.issue.number;
        if (issueId || issueId === 0) {
          await createComment(octokit, github.context, result, inputs.notifications.label);
        } else {
          core.debug(`Notification: no issue id`);
        }
      }
    }

    if (!inputs.onlyNotify && !result.passed) {
      core.setFailed(result.summary);
    }
    core.info(result.summary);

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
