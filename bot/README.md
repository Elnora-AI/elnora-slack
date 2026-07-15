# Two-way Slack AI agent (bot template)

A deployable Next.js app that turns your Slack workspace into a two-way AI
assistant: anyone in the org can DM it or @-mention it in a channel, it
replies in threads with memory, and it uses whatever tools you switch on —
knowledge base (Google Drive), Linear, Gmail, Calendar, web search, Slack
history search.

**Nothing org-specific is hardcoded.** Identity, persona, access, and tools
are all environment variables — the same code serves any org.

## Requirements

Everything the bot needs, in one place. Full env reference: [`.env.example`](.env.example).

**Always needed**

| Dependency | What / how |
|---|---|
| **Vercel account** | Hosts the Next.js app (root directory `bot/`). The webhook runs with `maxDuration=300`, so the project must have **Fluid Compute enabled** (free; default on new projects) or be on **Vercel Pro** — otherwise long agent replies hit the Hobby timeout and cut off. |
| **Vercel CLI** | `npm i -g vercel` (used to deploy and set env vars). |
| **Node.js ≥ 20.9.0** | For the CLI, local build, and tests (`engines` in `package.json`). |
| **An LLM API key** | Anthropic by default → `ANTHROPIC_API_KEY`. To use another provider set `LLM_PROVIDER=openai` (`OPENAI_API_KEY`) or `LLM_PROVIDER=google` (`GOOGLE_GENERATIVE_AI_API_KEY`). Exactly one provider key is required; override the model with `BOT_MODEL`. |
| **A Slack app** | Created from [`app-manifest.json`](app-manifest.json) → gives `SLACK_BOT_TOKEN` (`xoxb-`) + `SLACK_SIGNING_SECRET`. The manifest's `channels:history` / `groups:history` / `im:history` / `mpim:history` scopes are what make live thread/DM memory work — don't remove them. It also registers the events and the `/ask`, `/note`, `/find`, `/botstatus` slash commands. |

**Strongly recommended**

| Dependency | What / how |
|---|---|
| **Redis** (`REDIS_URL`) | Persists thread subscriptions across serverless cold starts. One-click via the **Vercel Marketplace / Storage** tab (Upstash or Redis Cloud), which injects `REDIS_URL` (plus `KV_URL` / `KV_REST_API_*`) — no secret to copy. Or bring your own from [Upstash](https://upstash.com) (free tier). Without it the bot still answers, but falls back to live participation detection for un-mentioned channel replies. |

**Default tool — knowledge base (Google Drive)** — the bot ships to answer from *your* docs; set this up in the same pass:

| Dependency | What / how |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client (Desktop app). |
| `GOOGLE_REFRESH_TOKEN` | Drive grant. **This same token also enables Gmail + Calendar** once their scopes are on it. (`GOOGLE_DRIVE_REFRESH_TOKEN` is a Drive-*only* alternative that powers the KB but **not** Gmail/Calendar.) |
| `DRIVE_ID` (+ optional `NOTES_FOLDER_ID`) | Which drive holds the docs; the folder for saved notes. Enable the **Google Drive API** on the project. |

**Optional tools** — each lights up on its own env var (source of truth: [`src/lib/tools/index.ts`](src/lib/tools/index.ts)):

| Capability | Env var |
|---|---|
| Linear (create/update/search issues) | `LINEAR_API_KEY` |
| Web search — Tavily | `TAVILY_API_KEY` |
| Web search — Exa (neural) | `EXA_API_KEY` |
| Web search — Perplexity (grounded answers) | `PERPLEXITY_API_KEY` |
| Web search — Valyu (citations-grade research) | `VALYU_API_KEY` |
| Slack message search | `SLACK_USER_TOKEN` (`xoxp-` with `search:read`) |

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
# connect your knowledge base (the default tool — see below):
#   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, DRIVE_ID
# create your Slack app from app-manifest.json (fill in your deployment URL)
# then add SLACK_BOT_TOKEN + SLACK_SIGNING_SECRET and ship:
vercel --prod
```

Or click-first:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FElnora-AI%2Felnora-slack&root-directory=bot&project-name=slack-agent-bot&repository-name=slack-agent-bot&env=ANTHROPIC_API_KEY,SLACK_BOT_TOKEN,SLACK_SIGNING_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GOOGLE_REFRESH_TOKEN,DRIVE_ID)

> **Pasting secrets:** when a terminal prompt (`vercel env add`, a provisioning
> script, or a `.env` step) asks you to paste a token or secret, the terminal
> shows **nothing** as you paste — no characters, no dots. That's hidden input
> working as intended. Paste once, press Enter, trust it landed.

## How it works

- `POST /api/webhooks/slack` receives Slack Events API calls (mentions, DMs,
  thread replies) via the [chat SDK](https://www.npmjs.com/package/chat) and
  answers them with an [AI SDK](https://ai-sdk.dev) tool-loop agent
  (`claude-sonnet-5` by default). The route runs with `maxDuration=300`, so the
  Vercel project needs **Fluid Compute** enabled (or Pro) — otherwise long tool
  chains hit the Hobby timeout and the reply cuts off.
- Conversation memory is read **live from Slack** on every message — the bot
  pulls the thread's replies (or the channel/DM's recent history) each time, so
  it always has the full context. It answers follow-ups in any thread it's part
  of, including replies to messages it posted proactively via `/api/send`.
- **Redis (`REDIS_URL`) is strongly recommended** for the fully-automated
  experience: it persists the thread subscriptions that route channel follow-ups
  across serverless cold starts. Provision it in one click from the Vercel
  Marketplace (Upstash / Redis Cloud) or bring your own from
  [Upstash](https://upstash.com) (free tier). Without it the bot still works but
  relies on live participation detection alone for un-mentioned channel replies.
- Slash commands (`/ask`, `/find`, …) echo your invocation back to the channel
  before answering, so you always see what you asked and the reply — Slack
  otherwise hides the command when the app responds.
- Tool groups switch on purely by env presence — see
  [`src/lib/tools/index.ts`](src/lib/tools/index.ts) and
  [`.env.example`](.env.example).
- `GET /api/health` for uptime monitoring; `POST /api/send` (bearer-gated by
  `SEND_API_SECRET`) lets your own automations post as the bot.
- Every incoming message is attributed to its Slack sender, so in a busy
  thread the agent knows exactly who asked for what and acts on that
  person's behalf.

## Knowledge base (the default connection)

The bot ships to answer from **your** documents, not just its own knowledge — so
connecting a knowledge base is the one tool you set up as part of the standard
install, not an afterthought. It's a Google Drive shared drive (or folder): the
bot gets `kbSearch` (full-text search, with `sort='newest'` and date filters),
`kbRecentNotes` (newest notes first, for "latest note" / date-scoped questions),
`kbReadFile` (read a document by ID), and `kbCreateNote` (save a markdown note
back). Ask for "the newest note" or "notes from this week about X" and it uses
the recency tools instead of an arbitrary keyword match.

Four env vars turn it on:

| Variable | What | Where from |
|---|---|---|
| `GOOGLE_CLIENT_ID` | OAuth app | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth client ID (Desktop app) |
| `GOOGLE_CLIENT_SECRET` | OAuth app | same screen |
| `GOOGLE_REFRESH_TOKEN` | Drive access grant (also enables Gmail + Calendar) | [OAuth Playground](https://developers.google.com/oauthplayground), scope `.../auth/drive`. `GOOGLE_DRIVE_REFRESH_TOKEN` is a Drive-*only* alternative — it powers the KB but **not** Gmail/Calendar. |
| `DRIVE_ID` | which drive holds the docs | the ID in `drive.google.com/drive/folders/<DRIVE_ID>` |

Then optionally `NOTES_FOLDER_ID` (folder where new notes are saved — enables
`kbCreateNote`) and `KB_NAME` (what the bot calls it, e.g. "Acme knowledge
vault"). Enable the **Google Drive API** on the project, `vercel --prod`, and ask
the bot in Slack to "search the knowledge base for X" to confirm. The
`GOOGLE_REFRESH_TOKEN` also lights up Gmail and Calendar once their scopes are on
the token (the Drive-only `GOOGLE_DRIVE_REFRESH_TOKEN` does not). Step-by-step
(with browser-driven walkthrough) is
[INSTALL_FOR_AGENTS.md → B7](../INSTALL_FOR_AGENTS.md#b7--connect-tools).

## Emoji actions

React to any message with a mapped emoji and the agent runs the action on
your behalf — no setup needed:

| Emoji | Action |
|-------|--------|
| ✅ `:white_check_mark:` | Mark done — closes the linked tracker issue (e.g. Linear) if the message references one |
| 🔖 `:bookmark:` | Save the message (or the URL in it) to the knowledge base |
| 👀 `:eyes:` | Summarize the conversation so far |
| ❓ `:question:` | Explain the message in plain terms |

Customize with the `EMOJI_ACTIONS` env var — a JSON object merged over the
defaults. Map any emoji to any instruction, `"off"` to disable one, or set
the whole var to `off` to disable the feature:

```sh
EMOJI_ACTIONS={"rocket":"Deploy what this message describes","eyes":"off"}
```

Unmapped emoji are ignored silently, so normal reaction culture is untouched.

## Give the bot your logo

Slack has no API for app icons, so this is the one manual step — 30 seconds,
once:

1. Open [api.slack.com/apps](https://api.slack.com/apps) → your app →
   **Basic Information** → **Display Information**.
2. Upload your logo as the **App icon** (512–2000 px square PNG) and pick a
   background color.
3. Save. Every message, DM and mention now shows your logo everywhere in
   Slack — no redeploy needed.

The bot's *name* is env-driven: `BOT_NAME` (persona) and the
`display_name` in `app-manifest.json` (the @-handle).

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
