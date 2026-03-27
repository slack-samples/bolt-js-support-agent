# AGENTS.md - bolt-js-support-agent

## Project Overview

A monorepo containing four parallel implementations of **Casey**, an AI-powered IT helpdesk agent for Slack built with [Bolt for JavaScript](https://github.com/slackapi/bolt-js). All implementations are functionally identical from the Slack user's perspective but use different AI agent frameworks and languages.

Casey can search a knowledge base, reset passwords, check system status, create tickets, and manage user permissions. All tool data is hardcoded for demo purposes.

## Implementations

| Directory | Language | Agent Framework |
|-----------|----------|-----------------|
| `js/openai-agents-sdk/` | JavaScript | [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/) |
| `js/claude-agent-sdk/` | JavaScript | [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk) |
| `ts/openai-agents-sdk/` | TypeScript | [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/) |
| `ts/claude-agent-sdk/` | TypeScript | [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk) |

See each implementation's `AGENTS.md` for SDK-specific setup and architecture details.

## Monorepo Structure

```
.github/                          # Shared CI workflows and dependabot config
js/
  openai-agents-sdk/              # JS + OpenAI Agents SDK
  claude-agent-sdk/               # JS + Claude Agent SDK
ts/
  openai-agents-sdk/              # TS + OpenAI Agents SDK
  claude-agent-sdk/               # TS + Claude Agent SDK
```

Each implementation follows the same internal layout:

```
app.{js,ts}                       # Entry point — Bolt app setup and start
manifest.json                     # Slack app manifest (Socket Mode)
agent/
  casey.{js,ts}                   # Agent definition (Claude SDK)
  support-agent.{js,ts}           # Agent definition (OpenAI SDK)
  deps.{js,ts}                    # Dependency injection (OpenAI SDK only)
  tools/                          # Hardcoded IT helpdesk tools
    knowledge-base.{js,ts}        # 8 KB articles, keyword search
    password-reset.{js,ts}        # Simulated password reset
    system-status.{js,ts}         # 9 systems with hardcoded statuses
    ticket.{js,ts}                # Random ticket ID generator
    user-permissions.{js,ts}      # Simulated permission check/grant
conversation/
  store.{js,ts}                   # SessionStore (Claude) or ConversationStore (OpenAI)
listeners/
  events/
    message.{js,ts}               # DM handler — runs agent, streams response
    app-mentioned.{js,ts}         # Channel @Casey mention handler
    app-home-opened.{js,ts}       # Publishes App Home view
    assistant-thread-started.{js,ts} # Sets suggested prompts
  actions/
    category-buttons.{js,ts}      # Opens issue submission modal
    feedback.{js,ts}              # Handles thumbs up/down reactions
  views/
    issue-modal.{js,ts}           # Modal submission handler
    app-home-builder.{js,ts}      # App Home Block Kit view
    modal-builder.{js,ts}         # Issue modal Block Kit view
    feedback-block.{js,ts}        # Feedback buttons (raw Block Kit JSON)
```

## Environment Variables

All implementations require Slack tokens. The AI provider key depends on the SDK:

| Variable | Required By | Description |
|----------|-------------|-------------|
| `SLACK_BOT_TOKEN` | All | Bot token (`xoxb-`) |
| `SLACK_APP_TOKEN` | All | App-level token (`xapp-`) for Socket Mode |
| `OPENAI_API_KEY` | OpenAI implementations | OpenAI API key |
| `ANTHROPIC_API_KEY` | Claude implementations | Anthropic API key |

Copy `.env.sample` in each implementation directory and fill in your values.

## Commands

All commands must be run from within a specific implementation directory (e.g., `js/openai-agents-sdk/`).

```sh
npm install          # Install dependencies
npm start            # Start the app
npm run dev          # Start with file watching (auto-restart)
npm run lint         # Check linting and formatting (Biome)
npm run lint:fix     # Auto-fix linting and formatting issues
npm run build        # Compile TypeScript (ts/ implementations only)
```

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
- **Listener registration** — `listeners/index.{js,ts}` calls sub-registrars for events, actions, and views
- **Streaming responses** — DM and mention handlers use `client.chat.stream()` to show typing indicators
- **Emoji reactions** — `:eyes:` on first message, contextual emoji based on response content, `:white_check_mark:` on completion
- **Feedback buttons** — Every agent response includes thumbs up/down buttons via `context_actions` blocks
- **App Home** — 5 category buttons (Hardware, Software, Access, Network, Other) that open an issue submission modal
- **No database** — Conversation state stored in-memory `Map` objects with TTL-based cleanup

### Claude Agent SDK vs OpenAI Agents SDK

| Aspect | Claude Agent SDK | OpenAI Agents SDK |
|--------|-----------------|-------------------|
| Agent file | `agent/casey.{js,ts}` | `agent/support-agent.{js,ts}` |
| Execution | `query()` async generator | `run()` async function |
| Tools | MCP tools via `createSdkMcpServer()` | Function tools via `tool()` |
| Tool return format | `{ content: [{ type: 'text', text }] }` | Plain string |
| Conversation | Server-side sessions (store session ID only) | Client-side history (store full message array) |
| Store class | `SessionStore` | `ConversationStore` |
| Dependencies | System prompt baked in | `CaseyDeps` class for dependency injection |
| Model | `claude-sonnet-4-20250514` | `gpt-4.1-mini` |

## CI/CD

- **Biome lint** — Runs on push to `main` and all PRs across all 4 implementations
- **TypeScript build** — Compilation check for `ts/` implementations
- **Dependabot** — Weekly npm and GitHub Actions updates, auto-merge for minor/patch
