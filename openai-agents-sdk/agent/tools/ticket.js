import { tool } from '@openai/agents';
import { z } from 'zod';

/** Support ticket creation tool for the Casey agent. */
export const createSupportTicket = tool({
  name: 'create_support_ticket',
  description:
    'Create a new IT support ticket for issues that require human follow-up. ' +
    "Use this tool when a user's issue cannot be resolved through knowledge base " +
    'articles or automated tools, and needs to be escalated to the IT support team.',
  parameters: z.object({
    title: z.string().describe('A concise title describing the issue.'),
    description: z
      .string()
      .describe('A detailed description of the problem and any troubleshooting already attempted.'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).describe("The ticket priority level — one of 'low', 'medium', 'high', or 'critical'."),
    category: z.enum(['hardware', 'software', 'network', 'access', 'other']).describe("The issue category — one of 'hardware', 'software', 'network', 'access', or 'other'."),
  }),
  execute: async ({ title, priority, category }) => {
    const ticketId = `INC-${Math.floor(100000 + Math.random() * 900000)}`;

    return (
      'Support ticket created successfully.\n' +
      `**Ticket ID:** ${ticketId}\n` +
      `**Title:** ${title}\n` +
      `**Priority:** ${priority}\n` +
      `**Category:** ${category}\n` +
      '**Status:** Open\n' +
      '**Assigned to:** IT Support Queue\n\n' +
      `The IT team will review this ticket and follow up within the SLA for ${priority} priority issues.`
    );
  },
});
