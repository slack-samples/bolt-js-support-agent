import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';

import { runCaseyAgent } from '../../agent/index.js';
import { sessionStore } from '../../conversation/index.js';
import { createFeedbackBlock } from '../views/feedback-block.js';

const RESOLUTION_PHRASES = [
  'resolved',
  'that should fix',
  "you're all set",
  'should be working now',
  'has been reset',
  'ticket created',
];

const CONTEXTUAL_EMOJIS = ['+1', 'raised_hands', 'rocket', 'tada', 'bulb', 'fire'];

export async function handleMessage({
  client,
  context,
  event,
  logger,
  say,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'message'>): Promise<void> {
  if ((event as any).bot_id || event.subtype) return;
  if ((event as any).channel_type !== 'im') return;

  try {
    const channelId = context.channelId!;
    const teamId = context.teamId!;
    const text = (event as any).text || '';
    const threadTs = (event as any).thread_ts || (event as any).ts;
    const userId = context.userId!;

    const existingSessionId = sessionStore.getSession(channelId, threadTs);

    if (!existingSessionId) {
      await client.reactions.add({
        channel: channelId,
        timestamp: (event as any).ts,
        name: 'eyes',
      });
    }

    await client.assistant.threads.setStatus({
      channel_id: channelId,
      thread_ts: threadTs,
      status: 'Thinking...',
      loading_messages: [
        'Teaching the hamsters to type faster\u2026',
        'Untangling the internet cables\u2026',
        'Consulting the office goldfish\u2026',
        'Polishing up the response just for you\u2026',
        'Convincing the AI to stop overthinking\u2026',
      ],
    });

    const { responseText, sessionId: newSessionId } = await runCaseyAgent(text, existingSessionId ?? undefined);

    const streamer = await (client.chat as any).stream({
      channel: channelId,
      recipient_team_id: teamId,
      recipient_user_id: userId,
      thread_ts: threadTs,
    });
    await streamer.append({ markdown_text: responseText });
    const feedbackBlocks = createFeedbackBlock();
    await streamer.stop({ blocks: feedbackBlocks });

    if (newSessionId) {
      sessionStore.setSession(channelId, threadTs, newSessionId);
    }

    if (Math.random() < 0.3) {
      const emoji = CONTEXTUAL_EMOJIS[Math.floor(Math.random() * CONTEXTUAL_EMOJIS.length)];
      await client.reactions.add({
        channel: channelId,
        timestamp: (event as any).ts,
        name: emoji,
      });
    }

    const outputLower = responseText.toLowerCase();
    if (RESOLUTION_PHRASES.some((phrase) => outputLower.includes(phrase))) {
      await client.reactions.add({
        channel: channelId,
        timestamp: (event as any).ts,
        name: 'white_check_mark',
      });
    }
  } catch (e) {
    logger.error(`Failed to handle DM: ${e}`);
    await say({
      text: `:warning: Something went wrong! (${e})`,
      thread_ts: (event as any).thread_ts || (event as any).ts,
    });
  }
}
