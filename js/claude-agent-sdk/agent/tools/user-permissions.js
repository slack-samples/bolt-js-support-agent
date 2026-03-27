import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export const lookupUserPermissionsTool = tool(
  'lookup_user_permissions',
  "Look up a user's access permissions and group memberships for a given system. " +
    'Use this tool when a user asks about their access level, group memberships, ' +
    'or whether they have permission to use a specific system or resource.',
  {
    target_user: z.string().describe('The username or email of the user to look up.'),
    system: z.string().describe("The system or resource to check permissions for (e.g., 'github', 'jira', 'aws')."),
  },
  async ({ target_user, system }) => {
    const text =
      `**Permissions for ${target_user} on ${system}:**\n\n` +
      `**Groups:** \`${system}-users\`, \`${system}-readonly\`\n` +
      '**Access Level:** Standard User\n' +
      '**Last Login:** 2 hours ago\n' +
      '**Account Status:** Active\n' +
      '**MFA Enabled:** Yes\n\n' +
      "_To request elevated access, the user's manager must submit an access request " +
      'through the IT portal._';

    return { content: [{ type: 'text', text }] };
  },
);
