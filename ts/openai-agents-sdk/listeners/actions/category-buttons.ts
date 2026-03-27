import type { AllMiddlewareArgs, SlackActionMiddlewareArgs } from '@slack/bolt';

import { buildIssueModal } from '../views/modal-builder.js';

export async function handleCategoryButton({
  ack,
  body,
  client,
  logger,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs): Promise<void> {
  await ack();

  try {
    const category = (body as any).actions[0].value;
    const triggerId = (body as any).trigger_id;
    const modal = buildIssueModal(category);
    await client.views.open({ trigger_id: triggerId, view: modal });
  } catch (e) {
    logger.error(`Failed to open issue modal: ${e}`);
  }
}
