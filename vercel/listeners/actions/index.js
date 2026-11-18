import { handleFeedbackButton } from './feedback-buttons.js';
import { handleIssueButton } from './issue-buttons.js';

/**
 * Register action listeners with the Bolt app.
 * @param {import('@slack/bolt').App} app
 * @returns {void}
 */
export function register(app) {
  app.action(/^category_/, handleIssueButton);
  app.action('feedback', handleFeedbackButton);
}
