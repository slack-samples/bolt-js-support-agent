# AGENTS.md - bolt-js-support-agent

## Project Overview

A monorepo containing two parallel implementations of **Casey**, an AI-powered IT helpdesk agent for Slack built with [Bolt for JavaScript](https://github.com/slackapi/bolt-js). Both implementations are functionally identical from the Slack user's perspective but use different AI agent frameworks.

Casey can search a knowledge base, reset passwords, check system status, create tickets, and manage user permissions. All tool data is hardcoded for demo purposes.

## Implementations

| Directory | Agent Framework |
|-----------|-----------------|
| `openai-agents-sdk/` | [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/) |
| `claude-agent-sdk/` | [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk) |

See each implementation's `AGENTS.md` for setup, commands, folder structure, and SDK-specific architecture details.

## Code Style

All implementations use [Biome](https://biomejs.dev/) for linting and formatting:

- 2-space indentation
- 120-character line width
- Single quotes
- LF line endings
- ES modules (`"type": "module"` in `package.json`)
- Kebab-case filenames
- Organized imports (via Biome assist)

## Architecture

### Shared Patterns Across All Implementations

- **Bolt for JavaScript** (`@slack/bolt`) with Socket Mode for all Slack communication
- **Listener registration** — `listeners/index.js` calls sub-registrars for events, actions, and views
- **Streaming responses** — DM and mention handlers use `client.chatStream()` to show typing indicators
- **Emoji reactions** — `:eyes:` on first message, agent-driven contextual emoji via `add_emoji_reaction` tool, `:white_check_mark:` on resolution via `mark_resolved` tool
- **Feedback buttons** — Every agent response includes thumbs up/down buttons via `context_actions` blocks
- **App Home** — 5 category buttons (Hardware, Software, Access, Network, Other) that open an issue submission modal
- **Channel thread replies** — Bot responds to follow-up messages in channel threads where it is already engaged (no re-mention needed)
- **Issue modal delegation** — App Home modal submissions post a DM with metadata; the message handler runs the agent
- **No database** — Conversation state stored in-memory `Map` objects with TTL-based cleanup

### Claude Agent SDK vs OpenAI Agents SDK

| Aspect | Claude Agent SDK | OpenAI Agents SDK |
|--------|-----------------|-------------------|
| Agent file | `agent/casey.js` | `agent/support-agent.js` |
| Execution | `query()` async generator | `run()` async function |
| Tools | MCP tools via `createSdkMcpServer()` | Function tools via `tool()` |
| Tool return format | `{ content: [{ type: 'text', text }] }` | Plain string |
| Conversation | Server-side sessions (store session ID only) | Client-side history (store full message array) |
| Store directory | `thread-context/` | `thread-context/` |
| Store class | `SessionStore` | `ConversationStore` |
| Dependencies | Closure-based deps in `runCaseyAgent()` | `CaseyDeps` class for dependency injection |
| Model | `claude-sonnet-4-20250514` | `gpt-4.1-mini` |

## CI/CD

- **Biome lint** — Runs on push to `main` and all PRs across both implementations
- **Type check** — `npm run check` runs `tsc --checkJs` on JavaScript files
- **Unit tests** — `npm test` runs the Node.js built-in test runner in each implementation
- **Dependabot** — Weekly npm and GitHub Actions updates, auto-merge for minor/patch
