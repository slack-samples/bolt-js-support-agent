# Casey: IT Helpdesk Agent

Meet Casey (it/this/that) — an AI-powered IT helpdesk agent that lives in Slack. Casey can troubleshoot common issues, search knowledge base articles, reset passwords, check system status, and create support tickets, all without leaving the conversation.

Built with [Bolt for JavaScript](https://tools.slack.dev/bolt-js/).

## Choose Your Framework

This repo contains the same app built with two different AI agent frameworks. Pick the one that fits your stack:

| App | Directory | Get Started | Framework |
|-----|-----------|-------------|-----------|
| **Claude Agent SDK** | `claude-agent-sdk/` | [View README](./claude-agent-sdk/README.md) | [claude-agent-sdk](https://platform.claude.com/docs/en/agent-sdk/overview) |
| **OpenAI Agents SDK** | `openai-agents-sdk/` | [View README](./openai-agents-sdk/README.md) | [openai-agents](https://openai.github.io/openai-agents-js/) |

All implementations share the same Slack listener layer, the same five simulated IT tools, and the same user experience. The only difference is how the agent is defined and executed under the hood.

## What Casey Can Do

Casey gives your team instant IT support through three entry points:

* **App Home** — Choose from common issue categories. A modal collects details, then Casey starts a DM thread with a resolution.
* **Direct Messages** — Describe any IT issue and Casey responds in-thread, maintaining context across follow-ups.
* **Channel @mentions** — Mention `@Casey` in any channel to get help without leaving the conversation.

Behind the scenes, Casey has access to five simulated tools: knowledge base search, support ticket creation, password reset, system status checks, and user permissions lookup.

> **Note:** All tools return simulated data for demonstration purposes. In a production app, these would connect to your actual IT systems.

### Slack MCP Server

Casey also works with the [Slack MCP Server](https://docs.slack.dev/agents-ai/model-context-protocol), giving it the ability to search messages and files, read channel history and threads, send messages, schedule messages, and create or update Slack canvases. When deployed with OAuth (HTTP mode), Casey automatically connects to the Slack MCP Server using the user's token, unlocking these capabilities on top of the built-in IT tools.

## Local Development

This repo uses a vendored (pre-release) build of `@slack/bolt` from the [bolt-js](https://github.com/slackapi/bolt-js) `main` branch. The `.tgz` file lives in `vendor/` and is referenced by each app's `package.json`.

To update the vendored bolt-js to the latest `main`, run the Claude Code slash command:

```
/project:update-bolt
```
