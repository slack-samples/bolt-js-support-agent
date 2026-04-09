import { buildAppHomeView } from '../views/app-home-builder.js';

/**
 * Handle the app_home_opened event by publishing Casey's home view.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'app_home_opened'>} args
 * @returns {Promise<void>}
 */
export async function handleAppHomeOpened({ client, context, logger }) {
  try {
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

    const view = buildAppHomeView(installUrl, isConnected);
    await client.views.publish({ user_id: userId, view });
  } catch (e) {
    logger.error(`Failed to publish App Home: ${e}`);
  }
}
