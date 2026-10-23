# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## What This Is

**Casey**, an IT support agent for Slack built with Bolt for JavaScript and the **OpenAI Agents SDK**. All tool data is hardcoded for demo purposes.

## Slack Plugin

To install the Slack plugin for your coding agent, follow [Claude Code, Codex, Cursor, and Other Coding Agents](./README.md#claude-code-codex-cursor-and-other-coding-agents) in the README.

## Before you finish

Run `npm run lint`, `npm run check`, and `npm test`. CI runs the same on every PR.

## Code Style

- JSDoc + TypeScript validation (`npm run check`)
- Kebab-case filenames
- No code comments. Make the code explain itself with clear names, tests, or types. Put the reason for a change in the PR description.
