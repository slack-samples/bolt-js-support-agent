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
  // Skip bot messages and message subtypes (edits, deletes, etc.)
  if ((event as any).bot_id || (event as any).subtype) return;

  // Only handle IM channel type
  if ((event as any).channel_type !== 'im') return;

  try {
    const channelId = event.channel;
    const teamId = context.teamId as string;
    const text = (event as any).text || '';
    const threadTs = (event as any).thread_ts || event.ts;
    const userId = context.userId as string;

    // Get conversation history
    const history = conversationStore.getHistory(channelId, threadTs);

    // Add eyes reaction only to the first message in a thread
    if (history === null) {
      await client.reactions.add({
        channel: channelId,
        timestamp: event.ts,
        name: 'eyes',
      });
    }

    // Set assistant thread status with loading messages
    await client.assistant.threads.setStatus({
      channel_id: channelId,
      thread_ts: threadTs,
      status: 'Thinking…',
      loading_messages: [
        'Teaching the hamsters to type faster…',
        'Untangling the internet cables…',
        'Consulting the office goldfish…',
        'Polishing up the response just for you…',
        'Convincing the AI to stop overthinking…',
      ],
    });

    const inputItems: string | AgentInputItem[] = history
      ? [...history, { role: 'user' as const, content: text }]
      : text;

    const deps = new CaseyDeps(client, userId, channelId, threadTs);
    const result = await run(caseyAgent, inputItems, { context: deps });

    // Stream response in thread with feedback buttons
    const streamer = client.chatStream({
      channel: channelId,
      recipient_team_id: teamId,
      recipient_user_id: userId,
      thread_ts: threadTs,
    });
    await streamer.append({ markdown_text: result.finalOutput });
    const feedbackBlocks = createFeedbackBlock();
    await streamer.stop({ blocks: feedbackBlocks });

    // Store conversation history
    conversationStore.setHistory(channelId, threadTs, result.history);

    // ~30% chance contextual emoji
    if (Math.random() < 0.3) {
      const emoji = CONTEXTUAL_EMOJIS[Math.floor(Math.random() * CONTEXTUAL_EMOJIS.length)];
      await client.reactions.add({
        channel: channelId,
        timestamp: event.ts,
        name: emoji,
      });
    }

    // Check for resolution phrases
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
