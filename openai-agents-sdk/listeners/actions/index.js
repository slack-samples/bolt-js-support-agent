import { handleCategoryButton } from './category-buttons.js';
import { handleFeedback } from './feedback.js';

/**
 * Register action listeners with the Bolt app.
 * @param {import('@slack/bolt').App} app
 * @returns {void}
 */
export function register(app) {
  app.action(/^category_/, handleCategoryButton);
  app.action('feedback', handleFeedback);
}
