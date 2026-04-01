import { CATEGORIES } from './app-home-builder.js';

/**
 * Build the issue submission modal.
 * @param {string | undefined} category - Pre-selected category, if any.
 * @returns {import('@slack/types').ModalView}
 */
export function buildIssueModal(category) {
  /** @type {import('@slack/types').PlainTextOption[]} */
  const categoryOptions = CATEGORIES.map((cat) => ({
    text: { type: 'plain_text', text: cat.value, emoji: true },
    value: cat.value,
  }));

  const initialOption = categoryOptions.find((opt) => opt.value === category) || categoryOptions[0];

  return {
    type: 'modal',
    callback_id: 'issue_submission',
    title: { type: 'plain_text', text: 'Submit an Issue' },
    submit: { type: 'plain_text', text: 'Submit' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      {
        type: 'input',
        block_id: 'category_block',
        element: {
          type: 'static_select',
          action_id: 'category_select',
          placeholder: { type: 'plain_text', text: 'Select a category' },
          options: categoryOptions,
          initial_option: initialOption,
        },
        label: { type: 'plain_text', text: 'Category' },
      },
      {
        type: 'input',
        block_id: 'description_block',
        element: {
          type: 'plain_text_input',
          action_id: 'description_input',
          multiline: true,
          placeholder: { type: 'plain_text', text: 'Describe your issue in detail…' },
        },
        label: { type: 'plain_text', text: 'Description' },
      },
    ],
  };
}
