import { tool } from '@openai/agents';
import { z } from 'zod';

/** Mark resolved tool for the Casey agent. */
export const markResolved = tool({
  name: 'mark_resolved',
  description:
    "Mark the user's issue as resolved by adding a green check mark reaction to the parent thread message. " +
    'Call this once when the issue is fully resolved — e.g. password reset complete, ticket created, problem fixed.',
  parameters: z.object({}),
  execute: async (_args, context) => {
    const deps = context.deps;

    try {
      await deps.client.reactions.add({
        channel: deps.channelId,
        timestamp: deps.threadTs,
        name: 'white_check_mark',
      });
      return 'Thread marked as resolved.';
    } catch (e) {
      return `Could not mark resolved: ${e.data?.error || e.message}`;
    }
  },
});
