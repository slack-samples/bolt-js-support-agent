const SUGGESTED_PROMPTS = [
  { title: 'Reset Password', message: 'I need to reset my password' },
  { title: 'Request Access', message: 'I need access to a system or tool' },
  { title: 'Network Issues', message: "I'm having network connectivity issues" },
];

/**
 * Handle assistant_thread_started events by setting suggested prompts.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'assistant_thread_started'>} args
 * @returns {Promise<void>}
 */
export async function handleAssistantThreadStarted({ client, event, logger }) {
  const { channel_id: channelId, thread_ts: threadTs } = event.assistant_thread;

  try {
    await client.assistant.threads.setSuggestedPrompts({
      channel_id: channelId,
      thread_ts: threadTs,
      title: 'How can I help you today?',
      prompts: SUGGESTED_PROMPTS,
    });
  } catch (e) {
    logger.error(`Failed to handle assistant thread started: ${e}`);
  }
}
