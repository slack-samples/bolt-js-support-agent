# AGENTS.md - claude-agent-sdk

JavaScript implementation of Casey using the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) (`@anthropic-ai/claude-agent-sdk`).

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

## Testing

Tests use the Node.js built-in test runner (`node:test`) and assertion module (`node:assert`).

```sh
npm test             # Run all tests
```

### Conventions

- Test files live in `tests/` and mirror the source directory structure
- File naming: `<source-file>.test.js` (not `.spec.js`)
- Use `describe()` / `it()` / `beforeEach()` blocks from `node:test`
- Use `mock.fn()` from `node:test` for mocking — no external mock libraries
- Assertions use `node:assert` (`strictEqual`, `ok`, `deepStrictEqual`)
- Mock Slack client methods as `mock.fn()` objects with the needed nested structure
- Test files use ES module `import` statements (`"type": "module"`)

### What to Test

- **View builders** — pure functions, test structure and data correctness
- **Listener handlers** — mock `ack`, `client`, `context`, `logger`; verify API calls and error handling
- **SessionStore** — instantiate directly, test CRUD, TTL expiry, and eviction

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
