/**
 * Handle issue submission from the modal.
 *
 * Posts the issue as a DM with metadata so the message event handler
 * picks it up and runs the agent from there.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackViewMiddlewareArgs} args
 * @returns {Promise<void>}
 */
export async function handleIssueSubmission({ ack, body, client, context, logger }) {
  await ack();

  try {
    const userId = context.userId;
    const values = body.view.state.values;
    const category = values.category_block.category_select.selected_option.value;
    const description = values.description_block.description_input.value;

    // Open a DM with the user
    const dm = await client.conversations.open({ users: userId });
    const channelId = dm.channel.id;

    // Post the issue message with metadata so the message handler can
    // identify it and run the agent on behalf of the original user
    const userMessage = `*Category:* ${category}\n*Description:* ${description}`;
    await client.chat.postMessage({
      channel: channelId,
      text: userMessage,
      metadata: {
        event_type: 'issue_submission',
        event_payload: { user_id: userId },
      },
    });
  } catch (e) {
    logger.error(`Failed to handle issue submission: ${e}`);
  }
}
