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

export async function handleAppMentioned({
  client,
  context,
  event,
  logger,
  say,
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<'app_mention'>): Promise<void> {
  try {
    const channelId = event.channel as string;
    const teamId = context.teamId as string;
    const text = event.text || '';
    const threadTs = event.thread_ts || event.ts;
    const userId = context.userId as string;

    const cleanedText = text.replace(/<@[A-Z0-9]+>/g, '').trim();

    if (!cleanedText) {
      await say({
        text: "Hey there! How can I help you? Describe your IT issue and I'll do my best to assist.",
        thread_ts: threadTs,
      });
      return;
    }

    await client.reactions.add({
      channel: channelId,
      timestamp: event.ts,
      name: 'eyes',
    });

    await client.assistant.threads.setStatus({
      channel_id: channelId,
      thread_ts: threadTs,
      status: 'Thinking...',
      loading_messages: [
        'Teaching the hamsters to type faster...',
        'Untangling the internet cables...',
        'Consulting the office goldfish...',
        'Polishing up the response just for you...',
        'Convincing the AI to stop overthinking...',
      ],
    });

    const history = conversationStore.getHistory(channelId, threadTs);
    const inputItems: string | AgentInputItem[] = history
      ? [...history, { role: 'user' as const, content: cleanedText }]
      : cleanedText;

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

    conversationStore.setHistory(channelId, threadTs, result.history);

    if (Math.random() < 0.2) {
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
    logger.error(`Failed to handle app mention: ${e}`);
    await say({
      text: `:warning: Something went wrong! (${e})`,
      thread_ts: event.thread_ts || event.ts,
    });
  }
}
