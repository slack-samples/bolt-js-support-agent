/**
 * @typedef {Object} Category
 * @property {string} actionId
 * @property {string} text
 * @property {string} value
 */

/** @type {Category[]} */
export const CATEGORIES = [
  {
    actionId: 'category_password_reset',
    text: ':closed_lock_with_key: Password Reset',
    value: 'Password Reset',
  },
  {
    actionId: 'category_access_request',
    text: ':key: Access Request',
    value: 'Access Request',
  },
  {
    actionId: 'category_software_help',
    text: ':computer: Software Help',
    value: 'Software Help',
  },
  {
    actionId: 'category_network_issues',
    text: ':globe_with_meridians: Network Issues',
    value: 'Network Issues',
  },
  {
    actionId: 'category_something_else',
    text: ':speech_balloon: Something Else',
    value: 'Something Else',
  },
];

/**
 * Build the App Home view for Casey.
 * @returns {import('@slack/types').HomeView}
 */
export function buildAppHomeView() {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: "Hey there :wave: I'm Casey, your IT helpdesk agent.",
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          'I can help you troubleshoot technical issues, reset passwords, ' +
          'check system status, and create support tickets.\n\n' +
          '*Choose a category below to get started*, or send me a direct message anytime.',
      },
    },
    { type: 'divider' },
    {
      type: 'actions',
      elements: CATEGORIES.map((cat) => ({
        type: 'button',
        text: {
          type: 'plain_text',
          text: cat.text,
          emoji: true,
        },
        action_id: cat.actionId,
        value: cat.value,
      })),
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'You can also mention me in any channel with `@Casey` or send me a DM.',
        },
      ],
    },
  ];

  return { type: 'home', blocks };
}
