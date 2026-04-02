# Casey: IT Helpdesk Agent

Meet Casey (it/this/that) — an AI-powered IT helpdesk agent that lives in Slack. Casey can troubleshoot common issues, search knowledge base articles, reset passwords, check system status, and create support tickets, all without leaving the conversation.

Built with [Bolt for JavaScript](https://tools.slack.dev/bolt-js/).

## Choose Your Framework

This repo contains the same app built with two different AI agent frameworks. Pick the one that fits your stack:

| App | Framework | Get started | Directory |
|-----|-----------|-------------|-----------|
| **Claude Agent SDK** | [claude-agent-sdk](https://docs.anthropic.com/en/docs/agents/claude-agent-sdk) | [View README](./claude-agent-sdk/README.md) | `claude-agent-sdk/` |
| **OpenAI Agents SDK** | [openai-agents](https://openai.github.io/openai-agents-js/) | [View README](./openai-agents-sdk/README.md) | `openai-agents-sdk/` |

All implementations share the same Slack listener layer, the same five simulated IT tools, and the same user experience. The only difference is how the agent is defined and executed under the hood.

## What Casey Can Do

Casey gives your team instant IT support through three entry points:

* **App Home** — Choose from common issue categories. A modal collects details, then Casey starts a DM thread with a resolution.
* **Direct Messages** — Describe any IT issue and Casey responds in-thread, maintaining context across follow-ups.
* **Channel @mentions** — Mention `@Casey` in any channel to get help without leaving the conversation.

Behind the scenes, Casey has access to five simulated tools: knowledge base search, support ticket creation, password reset, system status checks, and user permissions lookup.

> **Note:** All tools return simulated data for demonstration purposes. In a production app, these would connect to your actual IT systems.
