# AGENTS.md - claude-agent-sdk

JavaScript implementation of Casey using the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk) (`@anthropic-ai/claude-agent-sdk`).

See the [root AGENTS.md](../AGENTS.md) for monorepo-wide architecture and shared patterns.

## Setup

```sh
cp .env.sample .env   # Fill in SLACK_BOT_TOKEN, SLACK_APP_TOKEN, ANTHROPIC_API_KEY
npm install
npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SLACK_BOT_TOKEN` | Bot token (`xoxb-`) |
| `SLACK_APP_TOKEN` | App-level token (`xapp-`) for Socket Mode |
| `ANTHROPIC_API_KEY` | Anthropic API key |

## Commands

```sh
npm install          # Install dependencies
npm start            # Start the app
npm run lint         # Biome lint and format check
npm run lint:fix     # Auto-fix lint and format issues
npm run check        # Type check JavaScript with tsc (checkJs)
```

## Folder Structure

```
app.js                            # Entry point — Bolt app setup and start
manifest.json                     # Slack app manifest (Socket Mode)
agent/
  casey.js                        # Agent definition (Claude Agent SDK)
  index.js                        # Agent exports
  tools/                          # Hardcoded IT helpdesk tools
    knowledge-base.js             # 8 KB articles, keyword search
    password-reset.js             # Simulated password reset
    system-status.js              # 9 systems with hardcoded statuses
    ticket.js                     # Random ticket ID generator
    user-permissions.js           # Simulated permission check/grant
thread-context/
  store.js                        # SessionStore — stores session IDs only
listeners/
  events/
    message.js                    # DM and channel thread handler — runs agent, streams response
    app-mentioned.js              # Channel @Casey mention handler
    app-home-opened.js            # Publishes App Home view
    assistant-thread-started.js   # Sets suggested prompts
  actions/
    issue-buttons.js              # Opens issue submission modal
    feedback-buttons.js           # Handles thumbs up/down reactions
  views/
    issue-modal.js                # Modal submission — posts DM with metadata
    app-home-builder.js           # App Home Block Kit view
    issue-modal-builder.js        # Issue modal Block Kit view
    feedback-builder.js           # Feedback buttons (raw Block Kit JSON)
```

## Architecture

### Agent Layer

The agent is defined in `agent/casey.js` using the Claude Agent SDK:

- `query({ prompt, options })` returns an async generator of messages
- Tools are defined with `tool()` from the SDK using Zod v4 schemas
- Tools are wrapped in an in-process MCP server via `createSdkMcpServer()`
- Tools return MCP `CallToolResult` format: `{ content: [{ type: 'text', text }] }`
- `permissionMode: 'bypassPermissions'` since all tools are safe
- Model: `claude-sonnet-4-20250514`

### Conversation Management

`thread-context/store.js` exports a `SessionStore` that stores **session IDs only** (not full message history). The Claude Agent SDK manages conversation history server-side. The store passes `{ resume: sessionId }` on subsequent turns to continue a conversation.

The store uses a `Map` keyed by `${channelId}:${threadTs}` with TTL-based cleanup (1 hour) and a max entry limit (1000).

### Dependency Injection

`runCaseyAgent(text, sessionId, deps)` accepts an optional `deps` object with `{ client, userId, channelId, threadTs, messageTs }`. Tools that need Slack API access (emoji reactions, mark resolved) are created as closures inside `runCaseyAgent()` that capture the `deps` parameter. Static tools (knowledge base, tickets, etc.) remain as module-level exports in `agent/tools/`.

### Tool Definitions

Tools in `agent/tools/` are defined using `tool()` from the Claude Agent SDK:

```js
import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export const myTool = tool(
  'tool_name',
  'Description of what this tool does',
  { query: z.string() },
  async (args) => ({
    content: [{ type: 'text', text: 'result' }],
  })
);
```

### Zod Version

This implementation requires **Zod v4** (`zod@^4.0.0`) as a peer dependency of the Claude Agent SDK.
