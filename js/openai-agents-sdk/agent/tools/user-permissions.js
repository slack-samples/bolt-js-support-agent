import { tool } from '@openai/agents';
import { z } from 'zod';

export const lookupUserPermissions = tool({
  name: 'lookup_user_permissions',
  description:
    "Look up a user's access permissions and group memberships for a given system. " +
    'Use this tool when a user asks about their access level, group memberships, ' +
    'or whether they have permission to use a specific system or resource.',
  parameters: z.object({
    target_user: z.string().describe('The username or email of the user to look up.'),
    system: z.string().describe("The system or resource to check permissions for (e.g., 'github', 'jira', 'aws')."),
  }),
  execute: async ({ target_user, system }) => {
    return (
      `**Permissions for ${target_user} on ${system}:**\n\n` +
      `**Groups:** \`${system}-users\`, \`${system}-readonly\`\n` +
      '**Access Level:** Standard User\n' +
      '**Last Login:** 2 hours ago\n' +
      '**Account Status:** Active\n' +
      '**MFA Enabled:** Yes\n\n' +
      "_To request elevated access, the user's manager must submit an access request " +
      'through the IT portal._'
    );
  },
});
