import { buildAppHomeView } from '../views/app-home-builder.js';

/**
 * Handle the app_home_opened event by publishing Casey's home view.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'app_home_opened'>} args
 * @returns {Promise<void>}
 */
export async function handleAppHomeOpened({ client, context, logger }) {
  try {
    const userId = context.userId;
    const view = buildAppHomeView();
    await client.views.publish({ user_id: userId, view });
  } catch (e) {
    logger.error(`Failed to publish App Home: ${e}`);
  }
}
