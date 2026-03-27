import type { App } from '@slack/bolt';

import { handleCategoryButton } from './category-buttons.js';
import { handleFeedback } from './feedback.js';

export function register(app: App): void {
  app.action(/^category_/, handleCategoryButton);
  app.action('feedback', handleFeedback);
}
