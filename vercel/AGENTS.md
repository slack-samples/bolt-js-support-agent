# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## What This Is

**Casey**, an IT support agent for Slack built with Bolt for JavaScript and the **Vercel AI SDK**, with models through Vercel AI Gateway. All tool data is hardcoded for demo purposes.

It has two entrypoints: `app.js` runs in Socket Mode for `slack run`, and `app-vercel.js` runs over HTTP with OAuth on Vercel, served by the functions in `api/slack/`.

## Slack Plugin

To install the Slack plugin for your coding agent, follow [Claude Code, Codex, Cursor, and Other Coding Agents](./README.md#claude-code-codex-cursor-and-other-coding-agents) in the README.

## Before you finish

Run `npm run lint`, `npm run check`, and `npm test`. CI runs the same on every PR.

## Code Style

- JSDoc + TypeScript validation (`npm run check`)
- Kebab-case filenames
- No code comments. Make the code explain itself with clear names, tests, or types. Put the reason for a change in the PR description.
