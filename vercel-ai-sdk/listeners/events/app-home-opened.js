import { buildAppHomeView } from '../views/app-home-builder.js';

const SUGGESTED_PROMPTS = [
  { title: 'Reset Password', message: 'I need to reset my password' },
  { title: 'Request Access', message: 'I need access to a system or tool' },
  { title: 'Network Issues', message: "I'm having network connectivity issues" },
];

/**
 * Handle app_home_opened events. Under agent_view, this event fires for both
 * the Home tab and the Messages tab (the agent DM). Branch on event.tab:
 *   - 'messages' → pin suggested prompts to the top of the DM
 *   - 'home'     → publish the App Home Block Kit view
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'app_home_opened'>} args
 * @returns {Promise<void>}
 */
export async function handleAppHomeOpened({ client, event, context, logger }) {
  try {
    if (event.tab === 'messages') {
      await client.assistant.threads.setSuggestedPrompts(
        // Under agent_view, suggested prompts pin to the top of the Messages tab —
        // no thread_ts is required. Cast until @slack/bolt's types catch up.
        /** @type {import('@slack/web-api').AssistantThreadsSetSuggestedPromptsArguments} */ ({
          channel_id: event.channel,
          title: 'How can I help you today?',
          prompts: SUGGESTED_PROMPTS,
        }),
      );
      // TODO(agent-dm-messages-tab): handle app_context_changed once Bolt supports it
      return;
    }

    const userId = /** @type {string} */ (context.userId);

    let installUrl = null;
    let isConnected = false;

    if (process.env.SLACK_CLIENT_ID) {
      if (context.userToken) {
        isConnected = true;
      } else if (process.env.SLACK_REDIRECT_URI) {
        const base = new URL(process.env.SLACK_REDIRECT_URI);
        installUrl = `${base.origin}/slack/install`;
      }
    }

    const view = buildAppHomeView(installUrl, isConnected, context.botUserId);
    await client.views.publish({ user_id: userId, view });
  } catch (e) {
    logger.error(`Failed to handle app_home_opened: ${e}`);
  }
}
