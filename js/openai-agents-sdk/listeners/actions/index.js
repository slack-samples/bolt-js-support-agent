import { handleCategoryButton } from './category-buttons.js';
import { handleFeedback } from './feedback.js';

export function register(app) {
  app.action(/^category_/, handleCategoryButton);
  app.action('feedback', handleFeedback);
}
