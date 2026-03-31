import { run } from '@openai/agents';
import type { AllMiddlewareArgs, SlackViewMiddlewareArgs } from '@slack/bolt';

import { CaseyDeps, caseyAgent } from '../../agent/index.js';
import { conversationStore } from '../../conversation/index.js';
import { createFeedbackBlock } from './feedback-block.js';

export async function handleIssueSubmission({
  ack,
  body,
  client,
  context,
  logger,
}: AllMiddlewareArgs & SlackViewMiddlewareArgs): Promise<void> {
  await ack();

  try {
    const teamId = context.teamId as string;
    const userId = context.userId as string;
    const values = body.view.state.values;
    const category = (values as any).category_block.category_select.selected_option.value;
    const description = (values as any).description_block.description_input.value;

    const dm = await client.conversations.open({ users: userId });
    const channelId = (dm.channel as any).id;

    const userMessage = `*Category:* ${category}\n*Description:* ${description}`;
    const initial = await client.chat.postMessage({
      channel: channelId,
      text: userMessage,
    });
    const threadTs = initial.ts as string;

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

    await client.reactions.add({
      channel: channelId,
      timestamp: threadTs,
      name: 'eyes',
    });

    const deps = new CaseyDeps(client, userId, channelId, threadTs);
    const result = await run(caseyAgent, userMessage, { context: deps });

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
  } catch (e) {
    logger.error(`Failed to handle issue submission: ${e}`);
  }
}
