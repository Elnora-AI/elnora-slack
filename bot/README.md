# Two-way Slack AI agent (bot template)

A deployable Next.js app that turns your Slack workspace into a two-way AI
assistant: anyone in the org can DM it or @-mention it in a channel, it
replies in threads with memory, and it uses whatever tools you switch on —
knowledge base (Google Drive), Linear, Gmail, Calendar, web search, Slack
history search.

**Nothing org-specific is hardcoded.** Identity, persona, access, and tools
are all environment variables — the same code serves any org.

## Quick start

The full guided runbook (built for AI agents to walk you through) is
[Part B of INSTALL_FOR_AGENTS.md](../INSTALL_FOR_AGENTS.md#part-b--the-two-way-bot-optional).
The short version:

```sh
npm install -g vercel && vercel login
git clone https://github.com/Elnora-AI/elnora-slack.git
cd elnora-slack/bot
vercel --yes                      # create the project
# set envs (see .env.example): ANTHROPIC_API_KEY, REDIS_URL, BOT_NAME, …
# create your Slack app from app-manifest.json (fill in your deployment URL)
# then add SLACK_BOT_TOKEN + SLACK_SIGNING_SECRET and ship:
vercel --prod
```

Or click-first:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FElnora-AI%2Felnora-slack&root-directory=bot&project-name=slack-agent-bot&repository-name=slack-agent-bot&env=ANTHROPIC_API_KEY,SLACK_BOT_TOKEN,SLACK_SIGNING_SECRET)

> **Pasting secrets:** when a terminal prompt (`vercel env add`, a provisioning
> script, or a `.env` step) asks you to paste a token or secret, the terminal
> shows **nothing** as you paste — no characters, no dots. That's hidden input
> working as intended. Paste once, press Enter, trust it landed.

## How it works

- `POST /api/webhooks/slack` receives Slack Events API calls (mentions, DMs,
  thread replies) via the [chat SDK](https://www.npmjs.com/package/chat) and
  answers them with an [AI SDK](https://ai-sdk.dev) tool-loop agent
  (`claude-sonnet-5` by default).
- Per-thread conversation memory lives in Redis (`REDIS_URL`, Upstash free
  tier works) — or in-memory if unset.
- Tool groups switch on purely by env presence — see
  [`src/lib/tools/index.ts`](src/lib/tools/index.ts) and
  [`.env.example`](.env.example).
- `GET /api/health` for uptime monitoring; `POST /api/send` (bearer-gated by
  `SEND_API_SECRET`) lets your own automations post as the bot.

## Safety defaults

- **No mass pings** — broadcast tokens (`<!channel>`, `<!here>`,
  `<!everyone>`, `<!subteam^…>`) are stripped from everything the model
  posts.
- **Approval gates** — outbound email sends and calendar invites require
  explicit approval; the baked-in system prompt forbids acting on
  instructions embedded in fetched content.
- **Access control** — workspace-wide by default (your Slack app's signing
  secret is the boundary); restrict with `ALLOWED_SLACK_USER_IDS`.
- **No secret leakage** — the prompt forbids echoing secrets; health and
  status endpoints only ever report configured/not.

## Adding your own tools

Copy the pattern in [`src/lib/tools/linear.ts`](src/lib/tools/linear.ts):
env-gated client, zod schemas, small JSON results. Register the group in
[`src/lib/tools/index.ts`](src/lib/tools/index.ts), add the env var, redeploy.
ClickUp, Monday, Notion, HubSpot — anything with an API fits in ~50 lines.

## Development

```sh
pnpm install          # from the repo root (pnpm workspace)
pnpm --filter slack-bot-template typecheck
pnpm --filter slack-bot-template test
pnpm --filter slack-bot-template build
```
