import { run } from '@openai/agents';

import { CaseyDeps, caseyAgent } from '../../agent/index.js';
import { conversationStore } from '../../conversation/index.js';
import { createFeedbackBlock } from './feedback-block.js';

export async function handleIssueSubmission({ ack, body, client, context, logger }) {
  await ack();

  try {
    const teamId = context.teamId;
    const userId = context.userId;
    const values = body.view.state.values;
    const category = values.category_block.category_select.selected_option.value;
    const description = values.description_block.description_input.value;

    const dm = await client.conversations.open({ users: userId });
    const channelId = dm.channel.id;

    const userMessage = `*Category:* ${category}\n*Description:* ${description}`;
    const initial = await client.chat.postMessage({
      channel: channelId,
      text: userMessage,
    });
    const threadTs = initial.ts;

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

    await client.reactions.add({
      channel: channelId,
      timestamp: threadTs,
      name: 'eyes',
    });

    const deps = new CaseyDeps(client, userId, channelId, threadTs);
    const result = await run(caseyAgent, userMessage, { context: deps });

    const streamer = await client.chat.stream({
      channel: channelId,
      recipient_team_id: teamId,
      recipient_user_id: userId,
      thread_ts: threadTs,
    });
    await streamer.append({ markdown_text: result.finalOutput });
    const feedbackBlocks = createFeedbackBlock();
    await streamer.stop({ blocks: feedbackBlocks });

    conversationStore.setHistory(channelId, threadTs, result.toInputList());
  } catch (e) {
    logger.error(`Failed to handle issue submission: ${e}`);
  }
}
