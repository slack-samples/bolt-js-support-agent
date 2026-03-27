# AGENTS.md - ts/claude-agent-sdk

TypeScript implementation of Casey using the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk) (`@anthropic-ai/claude-agent-sdk`).

See the [root AGENTS.md](../../AGENTS.md) for monorepo-wide architecture and shared patterns.

## Setup

```sh
cp .env.sample .env   # Fill in SLACK_BOT_TOKEN, SLACK_APP_TOKEN, ANTHROPIC_API_KEY
npm install
npm start             # or: npm run dev (with file watching)
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
npm start            # Start the app (uses tsx)
npm run dev          # Start with file watching (uses tsx --watch)
npm run build        # Compile TypeScript
npm run build:watch  # Compile TypeScript in watch mode
npm run lint         # Biome lint and format check
npm run lint:fix     # Auto-fix lint and format issues
```

## Architecture

Same architecture as `js/claude-agent-sdk/` with TypeScript types added. See that implementation's [AGENTS.md](../../js/claude-agent-sdk/AGENTS.md) for detailed architecture documentation.

### TypeScript Specifics

- **Strict mode** with `skipLibCheck: true` (needed for SDK internal type conflicts)
- **Target**: `esnext`, **Module**: `nodenext`
- **Bolt handler types**: `AllMiddlewareArgs & SlackEventMiddlewareArgs<'message'>`, etc.
- **Interfaces**: `StoreEntry`, `KBArticle`, `SystemStatus`
- **`import type`** used for type-only imports
- **Zod v4** (`zod@^4.0.0`) required as a peer dependency of the Claude Agent SDK
