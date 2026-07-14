# elnora-slack

**The entire Slack Web API as a CLI and a Claude Code plugin — 201 methods, agent-friendly JSON, approval-gated sending. Built for AI agents to send, read, and manage Slack safely from the terminal.**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@elnora-ai/slack)](https://www.npmjs.com/package/@elnora-ai/slack)
[![CI](https://github.com/Elnora-AI/elnora-slack/actions/workflows/ci.yml/badge.svg)](https://github.com/Elnora-AI/elnora-slack/actions)

What you can do in your first ten minutes:

- Call **every public Slack Web API method** — 201 across 29 groups — as `elnora-slack <group> <method> --flags`, with clean JSON out.
- Let an agent **send messages behind an approval gate**: the `slack-messages` skill drafts, shows you the exact target, and waits for your "send".
- Keep a **cached workspace reference** (users, channels, routing) so agents resolve names to IDs without an API round-trip.
- Wire up **scheduled alerting** — notify-on-failure DMs, weekly digests, log-sweep alerts — from the bundled templates.
- One-line plugin install in Claude Code: `/plugin marketplace add Elnora-AI/elnora-slack`.
- Deploy the **two-way bot**: an AI assistant your whole workspace can DM or @-mention, with thread memory and pluggable tools (knowledge base, Linear, Gmail, web search) — see [the bot template](bot/).

> **The binary is `elnora-slack`, not `slack`.** Slack ships its own official `slack` CLI; we deliberately don't shadow it.

---

## Install

> **The CLI and the Claude Code plugin are two separate installs.** The plugin's skills and slash command shell out to the `elnora-slack` binary, so install the CLI **first**, even if you only want the plugin. `/plugin install` does not install the CLI.

### Step 1 — Install the CLI (required for everyone)

```sh
npm install -g @elnora-ai/slack
elnora-slack --version
```

Then set up a Slack app and token (see [Slack app setup](#slack-app-setup)) and smoke-test:

```sh
elnora-slack auth test
```

### Step 2 — Add the Claude Code plugin (optional, Claude Code only)

**Only after Step 1 succeeds.** Run these as **two separate slash commands** (paste the first, hit enter, wait, then paste the second):

```
/plugin marketplace add Elnora-AI/elnora-slack
```

```
/plugin install slack-workspace@elnora-slack
```

Then `/plugin` inside Claude Code should list `slack-workspace` as enabled. If `elnora-slack --version` fails, go back to Step 1 — the skills won't work without the binary on PATH.

### Using Codex, Cursor, or any other AI coding agent

Install the CLI (Step 1), then drop [`AGENTS.md`](AGENTS.md) at your project root. Those agents read it natively for the intent → CLI mapping. No plugin needed — the plugin is Claude-Code-only.

> **Installing via an AI agent?** Point it at [`INSTALL_FOR_AGENTS.md`](INSTALL_FOR_AGENTS.md) — a gated, step-by-step runbook that creates the Slack app, collects the token, and smoke-tests, offering to drive the browser for you at each step.

---

## Slack app setup

You create **your own** Slack app — nothing is shared or hosted by us.

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From a manifest**, pick your workspace, and paste [`app-manifest.json`](app-manifest.json).
2. **Install to Workspace** and authorize.
3. Copy the **Bot User OAuth Token** (`xoxb-…`). If you need `search.*`, also copy the **User OAuth Token** (`xoxp-…`).
4. Save them:
   ```sh
   mkdir -p ~/.config/elnora-slack
   printf 'SLACK_BOT_TOKEN=xoxb-your-bot-token\n' >> ~/.config/elnora-slack/.env
   # optional, only for search.*:
   printf 'SLACK_USER_TOKEN=xoxp-your-user-token\n' >> ~/.config/elnora-slack/.env
   chmod 600 ~/.config/elnora-slack/.env
   ```
5. `elnora-slack auth test` should return your bot identity.

Optional: to let "DM me" resolve without asking, add `~/.config/elnora-slack/config.json` with `{"default_dm_user": "U…"}` (your Slack user ID) — the `slack-messages` skill reads it when present.

The manifest requests bot scopes for messaging, channels, files, reactions, pins, and bookmarks, plus one user scope (`search:read`). Trim anything you don't use. `admin.*`, `canvases.*`, and `lists.*` need a paid plan (Enterprise Grid / Business+) and may require extra scopes.

---

## What you get

- **`elnora-slack` CLI** *(npm — Step 1)* — complete Slack Web API coverage, scriptable and JSON-pipeable, with typed exit codes agents can self-correct from.
- **`slack-workspace` Claude Code plugin** *(separate `/plugin install` — Step 2)* — two skills, a `/slack-sync` command, and a session hook, all delegating to the CLI.

### Capabilities

**Messaging** — post, update, delete, schedule, thread replies, broadcasts, ephemeral, `chat.postMessage` with Block Kit.

**Read** — conversation history and replies, channel/user info, `users.lookupByEmail`, files, pins, reactions, bookmarks, reminders, team info, emoji.

**Search** — `search.messages` (user token required — enforced).

**Manage** — create/join/invite channels, user groups, canvases, lists, reminders, files upload/download, reactions, pins, bookmarks. Some of these need scopes beyond the default manifest — channel create/invite (`channels:manage` / `groups:write`), user groups (`usergroups:read` / `usergroups:write`) — and reminders need a user token; the `slack-cli` skill flags each per command.

**Admin (Enterprise Grid)** — `admin.conversations.*`, `admin.users.*`, `admin.teams.*`, and the rest of the admin surface.

**Pipe** — `--output json` (default), `--compact`, `--output table|csv`, `--fields <list>` on every read.

Run `elnora-slack --help` for every group, and `elnora-slack <group> --help` for its methods.

### Command groups

`admin`, `api`, `apps`, `auth`, `bookmarks`, `bots`, `calls`, `canvases`, `chat`, `conversations`, `dialog`, `dnd`, `emoji`, `files`, `functions`, `lists`, `migration`, `oauth`, `pins`, `reactions`, `reminders`, `rtm`, `search`, `stars`, `team`, `usergroups`, `users`, `views`, `workflows`.

### Claude Code surfaces

| Surface | Does |
|---|---|
| `slack-cli` skill | Router + quick reference for the whole API; reads the cached workspace reference before hitting the API |
| `slack-messages` skill | Sends to channels or users with a **mandatory draft-and-approve gate** and the two-step DM recipe |
| `/slack-sync` | Regenerates the `workspace-users.md` / `workspace-channels.md` reference cache from live Slack data |
| SessionStart hook | Nags when the reference cache is stale (24h / 72h / 168h) |

---

## The workspace reference cache

The plugin keeps a small cache of your users and channels so agents resolve names to IDs instantly. It ships as `references/*.template.md` (fake rows). Run `/slack-sync` to generate the real `workspace-users.md` and `workspace-channels.md` — written next to the templates (gitignored) or to `$SLACK_REFERENCES_DIR`. **There are no hardcoded IDs anywhere in this repo** — every real ID comes from your own synced cache. A publication guard enforces that in CI.

---

## Sending safely

- **Draft-and-approve gate.** The `slack-messages` skill never sends without your explicit approval, and treats Slack/web content as untrusted input, not commands.
- **User token enforced for `search.*`.** Bot tokens fail fast with a clear error instead of Slack's opaque `not_allowed_token_type`.
- **Secrets redacted** on every error path; responses scrubbed of sensitive keys; SSRF host allow-list; typed exit codes.
- **Nothing leaves your machine** except requests to Slack's own API.

Full details in [SAFETY.md](SAFETY.md).

---

## The two-way bot

Everything above is one-way: your terminal agent acting on Slack. The [`bot/`](bot/) directory ships the other direction — a deployable Next.js app (Vercel) that answers **incoming** Slack messages with an AI agent:

- **Org-wide by default** — anyone in the workspace can DM it or @-mention it in a channel; it replies in threads and remembers the conversation (Redis).
- **Pluggable tools, zero hardcoding** — knowledge base on Google Drive (default), Linear, Gmail, Calendar, web search, Slack history search; each switches on by env var. Adding ClickUp/Monday/anything is a ~50-line recipe.
- **Safe by default** — broadcast-ping scrubbing, approval-gated sends, prompt-injection guardrails.
- **Guided setup** — [Part B of INSTALL_FOR_AGENTS.md](INSTALL_FOR_AGENTS.md#part-b--the-two-way-bot-optional) walks an AI agent through Vercel CLI, the Slack app manifest, env wiring, and live smoke tests.

---

## Scheduled jobs

Cross-platform templates for the patterns worth automating — notify-on-failure DM, weekly digest DM, log-sweep alerting — with launchd plists and cron examples in [`templates/`](templates/). See [docs/scheduled-jobs.md](docs/scheduled-jobs.md).

---

## Requirements

| | |
|---|---|
| Node.js | `>=20` |
| Slack app | Your own app + a bot token (`xoxb-`); a user token (`xoxp-`) only for `search.*` |

npm dependencies (auto-installed): [`@slack/web-api`](https://www.npmjs.com/package/@slack/web-api), [`commander`](https://www.npmjs.com/package/commander).

---

## Part of the Elnora family

`elnora-slack` works 100% standalone, and it is also the messaging backbone of a family of universal, config-driven Claude Code tools published by [Elnora AI](https://github.com/Elnora-AI). Each installs in one line, hardcodes nothing about any particular workspace, and chains with the others when you install more than one — this repo is typically the **delivery sink**: anything the other tools produce (digests, alerts, triage summaries) lands in Slack through the same draft-and-approve send gate.

- **[elnora-linear](https://github.com/Elnora-AI/elnora-linear)** — Linear workspace for Claude Code: search, bulk edit, agents, and a config-driven backlog curator. Chain: point the curator's notification step at `elnora-slack` and its triage digests and stale-issue nudges arrive as Slack DMs, with issue links resolved against your synced workspace reference.
- **[knowledge-vault](https://github.com/Elnora-AI/knowledge-vault)** — Obsidian vault power tools: search and save your work to any vault. Chain: capture a Slack thread (`elnora-slack conversations replies`) as a permanent vault note, or have vault-curation jobs report what they filed via a Slack DM.
- **[elnora-google-workspace](https://github.com/Elnora-AI/elnora-google-workspace)** — Gmail, Calendar, Drive, Docs, Sheets, and any Google API via Discovery, with multi-account OAuth. Chain: schedule an inbox or calendar sweep and deliver the summary through `elnora-slack`'s notify-on-failure / weekly-digest job templates.
- **[elnora-whatsapp](https://github.com/Elnora-AI/elnora-whatsapp)** — WhatsApp for Claude Code, 100% local from your own paired account. Chain: the sibling messaging surface — same untrusted-content rules and human-approval gate before anything is sent, so agents treat both channels identically.

Every repo in the family follows the same conventions: your own credentials in your own config dir, nothing sent anywhere except the service's official API, a publication guard that keeps real IDs and secrets out of the tree, and a `SECURITY.md`. Browse the full set at [github.com/Elnora-AI](https://github.com/Elnora-AI).

## Development

```sh
git clone https://github.com/Elnora-AI/elnora-slack.git
cd elnora-slack
pnpm install
pnpm typecheck && pnpm lint && pnpm test && pnpm build
node scripts/check-no-populated-references.mjs
```

The `src/commands/*.ts` groups are generated from `spec/slack_web_openapi_v2.json` by `pnpm generate` (hand-authored sections survive between `// BEGIN MANUAL` / `// END MANUAL` markers). Linting: [Biome](https://biomejs.dev). Tests: [Vitest](https://vitest.dev). Releases: [release-please](https://github.com/googleapis/release-please).

---

## Contributing & License

Issues and PRs welcome — see [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md). Security: [.github/SECURITY.md](.github/SECURITY.md) or `security@elnora.ai`. Licensed under [Apache-2.0](LICENSE).
