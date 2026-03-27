import type { App } from '@slack/bolt';

import { handleIssueSubmission } from './issue-modal.js';

export function register(app: App): void {
  app.view('issue_submission', handleIssueSubmission);
}
