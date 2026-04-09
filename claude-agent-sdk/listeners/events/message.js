import { runCaseyAgent } from '../../agent/index.js';
import { sessionStore } from '../../thread-context/index.js';
import { buildFeedbackBlocks } from '../views/feedback-builder.js';

/**
 * @param {import('@slack/types').MessageEvent} event
 * @returns {event is import('@slack/types').GenericMessageEvent}
 */
function isGenericMessageEvent(event) {
  return !('subtype' in event && event.subtype !== undefined);
}

/**
 * @typedef {{ event_type: 'issue_submission', event_payload: { user_id: string } }} IssueSubmissionMetadata
 */

/**
 * @param {import('@slack/types').GenericMessageEvent} event
 * @returns {IssueSubmissionMetadata | null}
 */
function getIssueMetadata(event) {
  const metadata = /** @type {any} */ (event).metadata;
  return metadata?.event_type === 'issue_submission' ? metadata : null;
}

/**
 * Handle messages sent to Casey via DM or in threads the bot is part of.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'message'>} args
 * @returns {Promise<void>}
 */
export async function handleMessage({ client, context, event, logger, say, sayStream, setStatus }) {
  // Skip message subtypes (edits, deletes, etc.)
  if (!isGenericMessageEvent(event)) return;

  // Issue submissions are posted by the bot with metadata so the message
  // handler can run the agent on behalf of the original user.
  const issueMetadata = getIssueMetadata(event);

  // Skip bot messages that are not issue submissions.
  if (event.bot_id && !issueMetadata) return;

  const isDm = event.channel_type === 'im';
  const isThreadReply = !!event.thread_ts;

  if (isDm) {
    // DMs are always handled
  } else if (isThreadReply) {
    // Channel thread replies are handled only if the bot is already engaged
    const session = sessionStore.getSession(event.channel, event.thread_ts);
    if (session === null) return;
  } else {
    // Top-level channel messages are handled by app_mentioned
    return;
  }

  try {
    const channelId = event.channel;
    const text = event.text || '';
    const threadTs = event.thread_ts || event.ts;

    // For issue submissions the bot posted the message, so the real
    // user_id comes from the metadata rather than the event context.
    const userId = issueMetadata ? issueMetadata.event_payload.user_id : context.userId;

    const existingSessionId = sessionStore.getSession(channelId, threadTs);

    // Add eyes reaction only to the first message (DMs only — channel
    // threads already have the reaction from the initial app_mention)
    if (isDm && !existingSessionId) {
      await client.reactions.add({
        channel: channelId,
        timestamp: event.ts,
        name: 'eyes',
      });
    }

    // Set assistant thread status with loading messages
    await setStatus({
      status: 'Thinking…',
      loading_messages: [
        'Teaching the hamsters to type faster…',
        'Untangling the internet cables…',
        'Consulting the office goldfish…',
        'Polishing up the response just for you…',
        'Convincing the AI to stop overthinking…',
      ],
    });

    // Run the agent with deps for tool access
    const deps = { client, userId, channelId, threadTs, messageTs: event.ts, userToken: context.userToken };
    const { responseText, sessionId: newSessionId } = await runCaseyAgent(text, existingSessionId, deps);

    // Stream response in thread with feedback buttons
    const streamer = sayStream();
    await streamer.append({ markdown_text: responseText });
    const feedbackBlocks = buildFeedbackBlocks();
    await streamer.stop({ blocks: feedbackBlocks });

    // Store conversation session
    if (newSessionId) {
      sessionStore.setSession(channelId, threadTs, newSessionId);
    }
  } catch (e) {
    logger.error(`Failed to handle message: ${e}`);
    await say({
      text: `:warning: Something went wrong! (${e})`,
      thread_ts: event.thread_ts || event.ts,
    });
  }
}
