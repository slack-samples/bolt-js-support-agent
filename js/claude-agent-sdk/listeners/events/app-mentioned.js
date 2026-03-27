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

export async function handleAppMentioned({ client, context, event, logger, say }) {
  try {
    const channelId = context.channelId;
    const teamId = context.teamId;
    const text = event.text || '';
    const threadTs = event.thread_ts || event.ts;
    const userId = context.userId;

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
        'Teaching the hamsters to type faster\u2026',
        'Untangling the internet cables\u2026',
        'Consulting the office goldfish\u2026',
        'Polishing up the response just for you\u2026',
        'Convincing the AI to stop overthinking\u2026',
      ],
    });

    const existingSessionId = sessionStore.getSession(channelId, threadTs);
    const { responseText, sessionId: newSessionId } = await runCaseyAgent(cleanedText, existingSessionId);

    const streamer = client.chatStream({
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

    if (Math.random() < 0.2) {
      const emoji = CONTEXTUAL_EMOJIS[Math.floor(Math.random() * CONTEXTUAL_EMOJIS.length)];
      await client.reactions.add({
        channel: channelId,
        timestamp: event.ts,
        name: emoji,
      });
    }

    const outputLower = responseText.toLowerCase();
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
