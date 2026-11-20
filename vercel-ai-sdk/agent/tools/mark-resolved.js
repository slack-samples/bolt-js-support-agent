import { tool } from 'ai';
import { z } from 'zod';

import { CaseyDeps } from '../deps.js';

/** Mark resolved tool for the Casey agent. */
export const markResolved = tool({
  description:
    "Mark the user's issue as resolved by adding a green check mark reaction to the parent thread message. " +
    'Call this once when the issue is fully resolved — e.g. password reset complete, ticket created, problem fixed.',
  inputSchema: z.object({}),
  contextSchema: z.object({ deps: z.instanceof(CaseyDeps) }),
  execute: async (_args, { context: { deps } }) => {
    try {
      await deps.client.reactions.add({
        channel: deps.channelId,
        timestamp: deps.threadTs,
        name: 'white_check_mark',
      });
      return 'Thread marked as resolved.';
    } catch (e) {
      const err = /** @type {any} */ (e);
      return `Could not mark resolved: ${err.data?.error || err.message}`;
    }
  },
});
