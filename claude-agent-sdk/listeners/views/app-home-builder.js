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
 * Build the App Home view.
 * @param {string | null} [installUrl] - OAuth install URL shown when MCP is disconnected.
 * @param {boolean} [isConnected] - Whether the Slack MCP Server is connected.
 * @param {string | null} [botUserId] - The bot's user ID for dynamic mentions.
 * @returns {import('@slack/types').HomeView}
 */
export function buildAppHomeView(installUrl = null, isConnected = false, botUserId = null) {
  /** @type {import('@slack/types').KnownBlock[]} */
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: "Hey there :wave: I'm your IT support agent.",
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
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `You can also mention me in any channel${botUserId ? ` with <@${botUserId}>` : ''} or send me a DM.`,
        },
      ],
    },
    { type: 'divider' },
  ];

  if (isConnected) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '\ud83d\udfe2 *Slack MCP Server is connected.*',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'This agent has access to search messages, read channels, and more.',
          },
        ],
      },
    );
  } else if (installUrl) {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\ud83d\udd34 *Slack MCP Server is disconnected.* <${installUrl}|Connect the Slack MCP Server.>`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'The Slack MCP Server enables this agent to search messages, read channels, and more.',
          },
        ],
      },
    );
  } else {
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '\ud83d\udd34 *Slack MCP Server is disconnected.* <https://github.com/slack-samples/bolt-js-support-agent/blob/main/claude-agent-sdk/README.md#slack-mcp-server|Learn how to enable the Slack MCP Server.>',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'The Slack MCP Server enables this agent to search messages, read channels, and more.',
          },
        ],
      },
    );
  }

  return { type: 'home', blocks };
}
