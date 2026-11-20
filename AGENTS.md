# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## What This Is

A monorepo with three functionally identical implementations of Casey, an IT support agent for Slack built with Bolt for JavaScript, each self-contained with its own `AGENTS.md`:

- `claude-agent-sdk/`: Claude Agent SDK
- `openai-agents-sdk/`: OpenAI Agents SDK
- `vercel-ai-sdk/`: Vercel AI SDK, deployed to Vercel

Work and run commands inside one of them. Keep the three in parity: a user-facing change to one usually belongs in the others.

The root `biome.json` lints the files at the root, like this one and the README, and skips all three directories. Run `claude-agent-sdk/node_modules/.bin/biome check .` from the root after installing `claude-agent-sdk/`. CI runs the same in `.github/workflows/lint.yml`.

## Slack Plugin

To install the Slack plugin for your coding agent, follow [Claude Code, Codex, Cursor, and Other Coding Agents](./README.md#claude-code-codex-cursor-and-other-coding-agents) in the README.
