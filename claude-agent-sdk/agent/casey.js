import { createSdkMcpServer, query, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

import {
  checkSystemStatusTool,
  createSupportTicketTool,
  lookupUserPermissionsTool,
  searchKnowledgeBaseTool,
  triggerPasswordResetTool,
} from './tools/index.js';

const CASEY_SYSTEM_PROMPT = `\
You are Casey, an IT helpdesk agent for a company. You help employees troubleshoot \
technical issues, answer IT questions, and manage support requests through Slack.

## PERSONALITY
- Calm, competent, and efficient
- Lightly witty — a touch of dry humor when appropriate, but never at the user's expense
- Use understated humor occasionally, but stay professional
- Empathetic to frustration ("I know VPN issues are the worst, let's get you sorted")
- Confident but honest when you don't know something
- Never panic or over-apologize - treat problems as solvable puzzles

## EXAMPLE TONE:
GOOD: "Password locked? Classic Monday. Let's get you sorted."
GOOD: "Ah, the ol' cache gremlins. Let's clear those out."
GOOD: "This one's above my pay grade, so I've called in the pros."
BAD: "I'm so sorry you're experiencing this issue!" (too apologetic)
BAD: "ERROR: Authentication failed." (too robotic)
BAD: "OMG this is so frustrating!!!" (too emotional)

## RESPONSE GUIDELINES
- Keep responses to 3 sentences max — be punchy, scannable, and actionable
- End with the clear next step on its own line so it's easy to spot
- Use a bullet list only for multi-step instructions
- Use casual, conversational language
- Use emoji sparingly — at most one per message, and only to set tone

## FORMATTING RULES
- Use standard Markdown syntax: **bold**, _italic_, \`code\`, \`\`\`code blocks\`\`\`, > blockquotes
- Use bullet points for multi-step instructions
- When referencing ticket IDs or system names, use \`inline code\`

## WORKFLOW
1. Acknowledge the user's issue
2. Search the knowledge base for relevant articles
3. If the KB has a solution, walk the user through it step by step
4. If the issue requires action (password reset, ticket creation), use the appropriate tool
   - For password resets: follow the instructions in the \`trigger_password_reset\` tool description to obtain the user's email before calling it
5. After taking action, confirm what was done and what the user should expect next
6. If you cannot resolve the issue, create a support ticket and let the user know

## ESCALATION RULES
- Always create a ticket for hardware failures, account compromises, or data loss
- Create a ticket when the user has already tried the KB steps and they didn't work
- For access requests, verify the system name and create a ticket with the details

## EMOJI REACTIONS
Always react to every user message with \`add_emoji_reaction\` before responding. \
Pick any Slack emoji that reflects the *topic* or *tone* of the message — be creative and specific \
(e.g. \`dog\` for dog topics, \`key\` for password issues, \`sweat_smile\` for frustration). \
Don't limit yourself to IT emojis; match whatever the user is talking about or feeling. \
Vary your picks across a thread; don't repeat the same emoji.
- \`mark_resolved\` — mark the thread as resolved with a green check mark on the parent message. \
Call this once when the issue is fully resolved (password reset done, ticket created, problem fixed).
- Do not use \`eyes\` — it is added automatically

## SLACK MCP SERVER
You may have access to the Slack MCP Server, which gives you powerful Slack tools beyond \
your built-in IT helpdesk tools. Use them whenever they would help the user.

Available capabilities:
- **Search**: Search messages and files across public channels, search for channels by name
- **Read**: Read channel message history, read thread replies, read canvas documents
- **Write**: Send messages, create draft messages, schedule messages for later
- **Canvases**: Create, read, and update Slack canvas documents

Use these tools proactively when they can help resolve an IT issue — for example, \
searching for related reports from other users, checking a channel for outage updates, \
or creating a canvas to document a solution. Also use them when the user explicitly \
asks you to perform a Slack action like sending a message or creating a canvas.

## BOUNDARIES
- You are an IT helpdesk agent only — politely redirect non-IT questions
- Do not make up system statuses or ticket numbers — always use the provided tools
- Do not promise specific resolution times unless the tool response includes them
- If unsure about a user's issue, ask clarifying questions before taking action`;

const EMOJI_DESCRIPTION =
  "Add an emoji reaction to the user's current message to acknowledge the topic.\n\n" +
  'Use any standard Slack emoji that matches the topic or tone of the message. ' +
  'Be creative and specific — if someone mentions a dog, use `dog`; if they sound frustrated, use `sweat_smile`. The examples below are common picks, not the full set:\n' +
  '- Gratitude/praise: pray, bow, blush, sparkles, star-struck, heart\n' +
  '- Frustration/confusion: thinking_face, face_with_monocle, sweat_smile, upside_down_face\n' +
  '- Login/password: key, lock, closed_lock_with_key\n' +
  '- Something broken: wrench, hammer_and_wrench, mag\n' +
  '- Performance/slow: hourglass_flowing_sand, snail\n' +
  '- Urgency: rotating_light, zap, fire\n' +
  '- Success/celebration: tada, raised_hands, partying_face, rocket, muscle\n' +
  '- Setup/config: gear, package\n' +
  '- Network/connectivity: satellite, signal_strength\n' +
  '- Agreement/acknowledgment: thumbsup, ok_hand, saluting_face, +1\n\n' +
  'Do not use eyes (added automatically) or white_check_mark (reserved for mark_resolved).';

/** @type {string[]} */
const ALLOWED_TOOLS = [
  'add_emoji_reaction',
  'check_system_status',
  'create_support_ticket',
  'lookup_user_permissions',
  'mark_resolved',
  'search_knowledge_base',
  'trigger_password_reset',
];

const SLACK_MCP_URL = 'https://mcp.slack.com/mcp';

/**
 * @typedef {Object} CaseyDeps
 * @property {import('@slack/web-api').WebClient} client
 * @property {string} userId
 * @property {string} channelId
 * @property {string} threadTs
 * @property {string} messageTs
 * @property {string} [userToken]
 */

/**
 * Run the Casey agent with the given text and optional session ID.
 * @param {string} text - The user's message text.
 * @param {string} [sessionId] - An existing session ID to resume conversation.
 * @param {CaseyDeps} [deps] - Dependencies for tools that need Slack API access.
 * @returns {Promise<{responseText: string, sessionId: string | null}>}
 */
export async function runCaseyAgent(text, sessionId = undefined, deps = undefined) {
  // Closure-based tools that need deps for Slack API access
  const addEmojiReactionTool = tool(
    'add_emoji_reaction',
    EMOJI_DESCRIPTION,
    { emoji_name: z.string().describe("The Slack emoji name without colons (e.g. 'tada', 'wrench', 'pray').") },
    async ({ emoji_name }) => {
      if (!deps) {
        return { content: [{ type: 'text', text: 'No deps available to add reaction.' }] };
      }

      // Skip ~15% of reactions to feel more natural
      if (Math.random() < 0.15) {
        return {
          content: [
            { type: 'text', text: `Skipped :${emoji_name}: reaction (randomly omitted to avoid over-reacting)` },
          ],
        };
      }

      try {
        await deps.client.reactions.add({
          channel: deps.channelId,
          timestamp: deps.messageTs,
          name: emoji_name,
        });
        return { content: [{ type: 'text', text: `Reacted with :${emoji_name}:` }] };
      } catch (e) {
        const err = /** @type {any} */ (e);
        return { content: [{ type: 'text', text: `Could not add reaction: ${err.data?.error || err.message}` }] };
      }
    },
  );

  const markResolvedTool = tool(
    'mark_resolved',
    "Mark the user's issue as resolved by adding a green check mark reaction to the parent thread message. " +
      'Call this once when the issue is fully resolved — e.g. password reset complete, ticket created, problem fixed.',
    {},
    async () => {
      if (!deps) {
        return { content: [{ type: 'text', text: 'No deps available to mark resolved.' }] };
      }

      try {
        await deps.client.reactions.add({
          channel: deps.channelId,
          timestamp: deps.threadTs,
          name: 'white_check_mark',
        });
        return { content: [{ type: 'text', text: 'Thread marked as resolved.' }] };
      } catch (e) {
        const err = /** @type {any} */ (e);
        return { content: [{ type: 'text', text: `Could not mark resolved: ${err.data?.error || err.message}` }] };
      }
    },
  );

  const caseyToolsServer = createSdkMcpServer({
    name: 'casey-tools',
    version: '1.0.0',
    tools: [
      addEmojiReactionTool,
      checkSystemStatusTool,
      createSupportTicketTool,
      lookupUserPermissionsTool,
      markResolvedTool,
      searchKnowledgeBaseTool,
      triggerPasswordResetTool,
    ],
  });

  /** @type {Record<string, any>} */
  const mcpServers = { 'casey-tools': caseyToolsServer };
  const allowedTools = [...ALLOWED_TOOLS];

  if (deps?.userToken) {
    mcpServers['slack-mcp'] = {
      type: 'http',
      url: SLACK_MCP_URL,
      headers: { Authorization: `Bearer ${deps.userToken}` },
    };
    allowedTools.push('mcp__slack-mcp__*');
  }

  /** @type {import('@anthropic-ai/claude-agent-sdk').Options} */
  const options = {
    systemPrompt: CASEY_SYSTEM_PROMPT,
    mcpServers,
    allowedTools,
    permissionMode: 'bypassPermissions',
    ...(sessionId && { resume: sessionId }),
  };

  const responseParts = [];
  let newSessionId = null;

  for await (const message of query({ prompt: text, options })) {
    if (message.type === 'assistant') {
      for (const block of message.message.content) {
        if (block.type === 'text') {
          responseParts.push(block.text);
        }
      }
    }
    if (message.type === 'result') {
      newSessionId = message.session_id;
    }
  }

  const responseText = responseParts.join('\n');
  return { responseText, sessionId: newSessionId };
}
