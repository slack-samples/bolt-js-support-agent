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

export async function handleMessage({ client, context, event, logger, say }) {
  // Skip bot messages and message subtypes (edits, deletes, etc.)
  if (event.bot_id || event.subtype) return;

  // Only handle IM channel type
  if (event.channel_type !== 'im') return;

  try {
    const channelId = event.channel;
    const teamId = context.teamId;
    const text = event.text || '';
    const threadTs = event.thread_ts || event.ts;
    const userId = context.userId;

    const existingSessionId = sessionStore.getSession(channelId, threadTs);

    // Add eyes reaction only to the first message in a thread
    if (!existingSessionId) {
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

    // Run the agent
    const { responseText, sessionId: newSessionId } = await runCaseyAgent(text, existingSessionId);

    // Stream response in thread with feedback buttons
    const streamer = client.chatStream({
      channel: channelId,
      recipient_team_id: teamId,
      recipient_user_id: userId,
      thread_ts: threadTs,
    });
    await streamer.append({ markdown_text: responseText });
    const feedbackBlocks = createFeedbackBlock();
    await streamer.stop({ blocks: feedbackBlocks });

    // Store conversation session
    if (newSessionId) {
      sessionStore.setSession(channelId, threadTs, newSessionId);
    }

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
    const outputLower = responseText.toLowerCase();
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
      thread_ts: event.thread_ts || event.ts,
    });
  }
}
