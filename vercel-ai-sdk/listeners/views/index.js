import { handleIssueSubmission } from './issue-modal.js';

/**
 * Register view listeners with the Bolt app.
 * @param {import('@slack/bolt').App} app
 * @returns {void}
 */
export function register(app) {
  app.view('issue_submission', handleIssueSubmission);
}
