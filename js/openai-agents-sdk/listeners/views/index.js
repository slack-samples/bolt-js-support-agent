import { handleIssueSubmission } from './issue-modal.js';

export function register(app) {
  app.view('issue_submission', handleIssueSubmission);
}
