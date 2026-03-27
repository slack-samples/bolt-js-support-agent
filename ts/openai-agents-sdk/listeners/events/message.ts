import type { AgentInputItem } from '@openai/agents';
import { run } from '@openai/agents';
import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';

import { CaseyDeps, caseyAgent } from '../../agent/index.js';
import { conversationStore } from '../../conversation/index.js';
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
  if ((event as any).bot_id || (event as any).subtype) return;
  if ((event as any).channel_type !== 'im') return;

  try {
    const channelId = context.channelId as string;
    const teamId = context.teamId as string;
    const text = (event as any).text || '';
    const threadTs = (event as any).thread_ts || event.ts;
    const userId = context.userId as string;

    const history = conversationStore.getHistory(channelId, threadTs);

    if (history === null) {
      await client.reactions.add({
        channel: channelId,
        timestamp: event.ts,
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

    const inputItems: string | AgentInputItem[] = history
      ? [...history, { role: 'user' as const, content: text }]
      : text;

    const deps = new CaseyDeps(client, userId, channelId, threadTs);
    const result = await run(caseyAgent, inputItems, { context: deps });

    const streamer = client.chatStream({
      channel: channelId,
      recipient_team_id: teamId,
      recipient_user_id: userId,
      thread_ts: threadTs,
    });
    await streamer.append({ markdown_text: result.finalOutput });
    const feedbackBlocks = createFeedbackBlock();
    await streamer.stop({ blocks: feedbackBlocks });

    conversationStore.setHistory(channelId, threadTs, (result as any).toInputList());

    if (Math.random() < 0.3) {
      const emoji = CONTEXTUAL_EMOJIS[Math.floor(Math.random() * CONTEXTUAL_EMOJIS.length)];
      await client.reactions.add({
        channel: channelId,
        timestamp: event.ts,
        name: emoji,
      });
    }

    const outputLower = (result.finalOutput ?? '').toLowerCase();
    if (RESOLUTION_PHRASES.some((phrase) => outputLower.includes(phrase))) {
      await client.reactions.add({
        channel: channelId,
        timestamp: event.ts,
        name: 'white_check_mark',
      });
    }
  } catch (e) {
    logger.error(`Failed to handle DM: ${e}`);
    await say({
      text: `:warning: Something went wrong! (${e})`,
      thread_ts: (event as any).thread_ts || event.ts,
    });
  }
}
