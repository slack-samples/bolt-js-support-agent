import { run } from '@openai/agents';

import { CaseyDeps, caseyAgent } from '../../agent/index.js';
import { conversationStore } from '../../conversation/index.js';
import { createFeedbackBlock } from './feedback-block.js';

/**
 * Handle issue submission from the modal.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackViewMiddlewareArgs} args
 * @returns {Promise<void>}
 */
export async function handleIssueSubmission({ ack, body, client, context, logger }) {
  await ack();

  try {
    const teamId = context.teamId;
    const userId = context.userId;
    const values = body.view.state.values;
    const category = values.category_block.category_select.selected_option.value;
    const description = values.description_block.description_input.value;

    // Open a DM with the user
    const dm = await client.conversations.open({ users: userId });
    const channelId = dm.channel.id;

    // Post the initial message with category and description
    const userMessage = `*Category:* ${category}\n*Description:* ${description}`;
    const initial = await client.chat.postMessage({
      channel: channelId,
      text: userMessage,
    });
    const threadTs = initial.ts;

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

    // Add eyes reaction
    await client.reactions.add({
      channel: channelId,
      timestamp: threadTs,
      name: 'eyes',
    });

    // Run the agent
    const deps = new CaseyDeps(client, userId, channelId, threadTs);
    const result = await run(caseyAgent, userMessage, { context: deps });

    // Stream the response in thread with feedback buttons
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
  } catch (e) {
    logger.error(`Failed to handle issue submission: ${e}`);
  }
}
