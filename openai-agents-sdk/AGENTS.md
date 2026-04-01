# AGENTS.md - openai-agents-sdk

JavaScript implementation of Casey using the [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/) (`@openai/agents`).

See the [root AGENTS.md](../AGENTS.md) for monorepo-wide architecture and shared patterns.

## Setup

```sh
cp .env.sample .env   # Fill in SLACK_BOT_TOKEN, SLACK_APP_TOKEN, OPENAI_API_KEY
npm install
npm start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SLACK_BOT_TOKEN` | Bot token (`xoxb-`) |
| `SLACK_APP_TOKEN` | App-level token (`xapp-`) for Socket Mode |
| `OPENAI_API_KEY` | OpenAI API key |

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
  support-agent.js                # Agent definition (OpenAI Agents SDK)
  deps.js                        # CaseyDeps — dependency injection
  index.js                        # Agent exports
  tools/                          # Hardcoded IT helpdesk tools
    add-emoji-reaction.js         # Agent-driven contextual emoji reactions
    knowledge-base.js             # 8 KB articles, keyword search
    mark-resolved.js              # Adds :white_check_mark: to thread parent
    password-reset.js             # Simulated password reset
    system-status.js              # 9 systems with hardcoded statuses
    ticket.js                     # Random ticket ID generator
    user-permissions.js           # Simulated permission check/grant
thread-context/
  store.js                        # ConversationStore — stores full message history
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

The agent is defined in `agent/support-agent.js` using the OpenAI Agents SDK:

- `new Agent({ name, instructions, tools, model })` creates the agent with a system prompt and tools
- `run(agent, input, { context })` executes the agent with conversation history
- Tools are defined with `tool()` from `@openai/agents` using Zod schemas for parameters
- Tools return plain strings (not MCP format)
- Model: `gpt-4.1-mini`

### Conversation Management

`thread-context/store.js` exports a `ConversationStore` that stores **full message history** arrays in a `Map` keyed by `${channelId}:${threadTs}`. The store has TTL-based cleanup (1 hour) and a max entry limit (1000).

After each agent run, `result.history` provides the updated history to store for the next turn.

### Dependency Injection

`agent/deps.js` defines a `CaseyDeps` class that holds `client`, `userId`, `channelId`, `threadTs`, and `messageTs`. This is passed as the `context` parameter to `run()` and is available in tool `execute` functions via `context.deps`.

### Tool Definitions

Tools in `agent/tools/` are defined using `tool()` from `@openai/agents`:

```js
import { tool } from '@openai/agents';
import { z } from 'zod';

export const myTool = tool({
  name: 'tool_name',
  description: '...',
  parameters: z.object({ query: z.string() }),
  execute: async (args, context) => 'result string',
});
```
