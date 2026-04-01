import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

/** Support ticket creation tool for the Casey agent. */
export const createSupportTicketTool = tool(
  'create_support_ticket',
  'Create a new IT support ticket for issues that require human follow-up. ' +
    "Use this tool when a user's issue cannot be resolved through knowledge base " +
    'articles or automated tools, and needs to be escalated to the IT support team.',
  {
    title: z.string().describe('A concise title describing the issue.'),
    description: z
      .string()
      .describe('A detailed description of the problem and any troubleshooting already attempted.'),
    priority: z.string().describe("The ticket priority level — one of 'low', 'medium', 'high', or 'critical'."),
    category: z
      .string()
      .describe("The issue category — one of 'hardware', 'software', 'network', 'access', or 'other'."),
  },
  async ({ title, priority, category }) => {
    const ticketId = `INC-${Math.floor(100000 + Math.random() * 900000)}`;

    const text =
      'Support ticket created successfully.\n' +
      `**Ticket ID:** ${ticketId}\n` +
      `**Title:** ${title}\n` +
      `**Priority:** ${priority}\n` +
      `**Category:** ${category}\n` +
      '**Status:** Open\n' +
      '**Assigned to:** IT Support Queue\n\n' +
      `The IT team will review this ticket and follow up within the SLA for ${priority} priority issues.`;

    return { content: [{ type: 'text', text }] };
  },
);
