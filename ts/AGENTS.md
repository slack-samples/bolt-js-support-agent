# AGENTS.md - bolt-js-support-agent/ts

TypeScript implementations of Casey. See the [root AGENTS.md](../AGENTS.md) for monorepo-wide architecture and comparison.

Two implementations exist in this directory:

- `claude-agent-sdk/` — Uses the Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- `openai-agents-sdk/` — Uses the OpenAI Agents SDK (`@openai/agents`)

TypeScript implementations add strict type annotations, interfaces for data structures, and Bolt handler types. They compile with `tsc` (target `esnext`, module `nodenext`, strict mode). Run `npm run build` to check compilation.

See each implementation's `AGENTS.md` for SDK-specific details.
