import { run } from '@openai/agents';

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

export async function handleAppMentioned({ client, context, event, logger, say }) {
  try {
    const channelId = event.channel;
    const teamId = context.teamId;
    const text = event.text || '';
    const threadTs = event.thread_ts || event.ts;
    const userId = context.userId;

    // Strip the bot mention from the text
    const cleanedText = text.replace(/<@[A-Z0-9]+>/g, '').trim();

    if (!cleanedText) {
      await say({
        text: "Hey there! How can I help you? Describe your IT issue and I'll do my best to assist.",
        thread_ts: threadTs,
      });
      return;
    }

    // Add eyes reaction only to the first message (not threaded replies)
    await client.reactions.add({
      channel: channelId,
      timestamp: event.ts,
      name: 'eyes',
    });

    // Set assistant thread status with loading messages
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

    // Get conversation history
    const history = conversationStore.getHistory(channelId, threadTs);
    const inputItems = history ? [...history, { role: 'user', content: cleanedText }] : cleanedText;

    // Run the agent
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

    // ~20% chance contextual emoji (lower than DM to be less noisy)
    if (Math.random() < 0.2) {
      const emoji = CONTEXTUAL_EMOJIS[Math.floor(Math.random() * CONTEXTUAL_EMOJIS.length)];
      await client.reactions.add({
        channel: channelId,
        timestamp: event.ts,
        name: emoji,
      });
    }

    // Check for resolution phrases
    const outputLower = result.finalOutput.toLowerCase();
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
