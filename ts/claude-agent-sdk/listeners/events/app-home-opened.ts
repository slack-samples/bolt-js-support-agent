import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';

import { buildAppHomeView } from '../views/app-home-builder.js';

export async function handleAppHomeOpened({
  client,
  context,
  logger,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'app_home_opened'>): Promise<void> {
  try {
    const userId = context.userId;
    const view = buildAppHomeView();
    await client.views.publish({ user_id: userId!, view });
  } catch (e) {
    logger.error(`Failed to publish App Home: ${e}`);
  }
}
