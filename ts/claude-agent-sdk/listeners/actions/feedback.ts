import type { AllMiddlewareArgs, SlackActionMiddlewareArgs } from '@slack/bolt';

export async function handleFeedback({
  ack,
  body,
  client,
  logger,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs): Promise<void> {
  await ack();

  try {
    const channelId = (body as any).channel?.id as string;
    const userId = (body as any).user.id;
    const messageTs = (body as any).message?.ts;
    const feedbackValue = (body as any).actions[0].value;

    if (feedbackValue === 'good-feedback') {
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        thread_ts: messageTs,
        text: 'Glad that was helpful! :tada:',
      });
    } else {
      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        thread_ts: messageTs,
        text: "Sorry that wasn't helpful. :slightly_frowning_face: Try rephrasing your question or I can create a support ticket for you.",
      });
    }

    logger.debug(`Feedback received: value=${feedbackValue}, message_ts=${messageTs}`);
  } catch (e) {
    logger.error(`Failed to handle feedback: ${e}`);
  }
}
