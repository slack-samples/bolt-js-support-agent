import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/** Password reset tool for the Casey agent. */
export const triggerPasswordResetTool = tool(
  'trigger_password_reset',
  'Trigger a password reset for a specified user account. ' +
    'Use this tool when a user requests a password reset for their own account ' +
    'or reports being locked out. The reset link will be sent to their registered email address.',
  { target_user: z.string().describe('The username or email of the user whose password should be reset.') },
  async ({ target_user }) => {
    const text =
      `Password reset initiated for **${target_user}**.\n\n` +
      'A reset link has been sent to the email address on file. ' +
      'The link will expire in 30 minutes.\n\n' +
      "_If the user doesn't receive the email within 5 minutes, " +
      'ask them to check their spam folder or verify their registered email address._';

    return { content: [{ type: 'text', text }] };
  },
);
