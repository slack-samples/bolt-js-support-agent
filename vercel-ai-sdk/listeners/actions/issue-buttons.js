import { buildIssueModal } from '../views/issue-modal-builder.js';

/**
 * Handle category button clicks from the App Home.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackActionMiddlewareArgs<import('@slack/bolt').BlockButtonAction>} args
 * @returns {Promise<void>}
 */
export async function handleIssueButton({ ack, body, client, logger }) {
  await ack();

  try {
    const category = body.actions[0].value;
    const triggerId = body.trigger_id;
    const modal = buildIssueModal(category);
    await client.views.open({ trigger_id: triggerId, view: modal });
  } catch (e) {
    logger.error(`Failed to open issue modal: ${e}`);
  }
}
