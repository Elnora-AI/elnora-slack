# INSTALL_FOR_AGENTS.md — `elnora-slack` setup

A gated, step-by-step runbook for an AI agent installing `elnora-slack` for a
user. Do the steps **in order**, and **stop at each checkpoint** for the user to
act or confirm — you cannot create a Slack app or read a token on their behalf
without them. Never guess a token, never paste a token into a chat, and never
send a Slack message during setup beyond the `auth test` smoke check.

The runbook has two parts:

- **Part A (Steps 0–6)** — the CLI + Claude Code plugin. This is the one-way
  street: you (the agent) can read and send Slack on the user's behalf from
  the terminal.
- **Part B** — the OPTIONAL **two-way bot**: a deployed AI agent that lives in
  the user's Slack workspace, answers DMs and @-mentions from **anyone in the
  org**, keeps per-thread memory, and connects to their knowledge base,
  Linear, email, and any other tool. **After finishing Part A, ask the user
  whether they want this** — see [Part B](#part-b--the-two-way-bot-optional).

At every step that involves a web page (api.slack.com), **offer to drive the
browser** if you have a browser tool available (Chrome DevTools MCP, Playwright,
etc.): "I can open and walk this page for you, or you can do it and tell me when
it's done." If the user prefers to click themselves, wait for their confirmation
before moving on. If you have no browser tool, give the exact URL and what to
click.

---

## Step 0 — Prerequisites

Confirm Node.js >= 20:

```sh
node --version
```

If it's missing or older, have the user install Node 20+ before continuing.

---

## Step 1 — Install the CLI

```sh
npm install -g @elnora-ai/slack
elnora-slack --version
```

**Checkpoint:** `elnora-slack --version` prints a version. If `command not found`,
the npm global bin dir isn't on PATH. Find it with `npm prefix -g` (`npm bin -g`
was removed in npm 9): the bin dir is `$(npm prefix -g)/bin` on macOS/Linux and the
prefix path itself on Windows. Add that dir to PATH, then retry.

---

## Step 2 — Create the Slack app from the manifest

The user creates **their own** app. Nothing is shared or hosted by Elnora.

1. Open [https://api.slack.com/apps](https://api.slack.com/apps).
   *(Offer to open and drive this page.)*
2. **Create New App** → **From a manifest**.
3. Pick the target workspace.
4. Paste the contents of [`app-manifest.json`](app-manifest.json) (JSON tab),
   review the requested scopes, and create.

The manifest requests bot scopes for messaging, channels, files, reactions,
pins, and bookmarks, plus one user scope (`search:read`). Tell the user they can
remove any scope they won't use, and that `admin.*` / `canvases.*` / `lists.*`
need a paid plan and may need extra scopes added later.

**Checkpoint:** the app exists in the user's workspace. Wait for them to confirm.

---

## Step 3 — Install the app and collect the token(s)

1. In the app settings, open **OAuth & Permissions**.
   *(Offer to drive.)*
2. **Install to Workspace** → **Allow**.
3. Copy the **Bot User OAuth Token** — it starts with `xoxb-`.
4. Only if the user needs `search.*`: also copy the **User OAuth Token**
   (`xoxp-`).

**Do not display or echo the tokens.** Have the user paste each token directly
into the file in Step 4, or set it as an environment variable themselves.

**Checkpoint:** the user has their `xoxb-` token (and optionally `xoxp-`).

---

## Step 4 — Save the token(s)

> **Heads-up for the user:** whenever a terminal prompt asks you to paste a
> token or secret, you will see **nothing** as you paste — no characters, no
> dots. That's hidden input working correctly, not a bug. Paste once and press
> Enter.

Write them to the per-user config file (mode 0600). Have the **user** run this so
the token never passes through the chat — offer the exact commands:

macOS / Linux:

```sh
mkdir -p ~/.config/elnora-slack
umask 077
printf 'SLACK_BOT_TOKEN=%s\n' 'PASTE_YOUR_xoxb_TOKEN' >> ~/.config/elnora-slack/.env
# optional, only for search.*:
printf 'SLACK_USER_TOKEN=%s\n' 'PASTE_YOUR_xoxp_TOKEN' >> ~/.config/elnora-slack/.env
chmod 600 ~/.config/elnora-slack/.env
```

Windows / PowerShell:

```powershell
$dir = "$env:USERPROFILE\.config\elnora-slack"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Add-Content "$dir\.env" "SLACK_BOT_TOKEN=PASTE_YOUR_xoxb_TOKEN"
# optional: Add-Content "$dir\.env" "SLACK_USER_TOKEN=PASTE_YOUR_xoxp_TOKEN"
```

Alternatively, export `SLACK_BOT_TOKEN` (and `SLACK_USER_TOKEN`) as environment
variables — the environment takes precedence over the file.

**Checkpoint:** the `.env` exists and contains at least `SLACK_BOT_TOKEN`. Do not
read the file back into the chat.

Optional: create `~/.config/elnora-slack/config.json` with
`{"default_dm_user": "U…"}` (the user's Slack ID) so that "DM me" resolves to that
user without asking. The `slack-messages` skill reads it when present.

---

## Step 5 — Smoke test

```sh
elnora-slack auth test
```

Expected: JSON with `"ok": true` and the bot's `user_id`, `team`, and `url`.

Failure modes:

- exit `3`, `No Slack token found` → Step 4 didn't take; re-check the `.env` path and key name.
- exit `3`, `invalid_auth` → the token is wrong or was revoked; re-copy from Step 3.
- `missing_scope` on later calls → add the scope in the app config and reinstall.

Then confirm read access:

```sh
elnora-slack conversations list --types public_channel --limit 5 --output json
```

**Checkpoint:** `auth test` returns `ok: true`.

---

## Step 6 — (Optional) Claude Code plugin

Only if the user is in Claude Code. Run as **two separate** slash commands:

```
/plugin marketplace add Elnora-AI/elnora-slack
```

```
/plugin install slack-workspace@elnora-slack
```

Then generate the workspace reference cache so the skills can resolve names to
ids:

```
/slack-sync
```

**Checkpoint:** `/plugin` lists `slack-workspace` as enabled and `/slack-sync`
wrote `workspace-users.md` / `workspace-channels.md`.

---

## Part A completion checklist

- [ ] `elnora-slack --version` works
- [ ] Slack app created from the manifest, installed to the workspace
- [ ] `SLACK_BOT_TOKEN` saved to `~/.config/elnora-slack/.env` (0600), token never shown in chat
- [ ] `SLACK_USER_TOKEN` saved too **if** `search.*` is needed
- [ ] `elnora-slack auth test` returns `ok: true`
- [ ] (Claude Code only) plugin installed and `/slack-sync` run

**Now ask the user:** *"Do you also want the two-way bot — an AI assistant
deployed to Vercel that everyone in your Slack workspace can DM or @-mention,
with thread memory and connections to your knowledge base, Linear, email, and
more?"* If yes, continue to Part B. If no, skip to the Handoff summary.

---

# Part B — the two-way bot (optional)

What Part A gives you is one-way: the agent in the terminal can act on Slack.
Part B deploys the [`bot/`](bot/) template — a Next.js app — to Vercel so the
bot answers **incoming** messages too. After this, anyone in the workspace can
DM the bot or @-mention it in a channel and get an AI reply with tool access.

The bot needs three things no plugin can provide: an always-on public HTTPS
endpoint (Vercel), a Slack app with the Events API pointed at it, and an
Anthropic API key. Everything org-specific — tokens, names, the system prompt,
which tools are on — lives in **environment variables on the user's own Vercel
project**. Nothing is hardcoded; the same code serves any org.

As in Part A: offer to drive every web page with your browser tool (Chrome
DevTools MCP, Playwright, …) if you have one, and never echo a secret into
the chat.

## B1 — Prerequisites

1. Node 20.9+ (`node --version`).
2. A **Vercel account** — free Hobby tier works to start. If the user has
   none, send them to [https://vercel.com/signup](https://vercel.com/signup)
   *(offer to drive)*.
3. The **Vercel CLI**:

   ```sh
   npm install -g vercel
   vercel --version
   vercel login
   ```

   `vercel login` opens a browser confirmation — wait for the user.
4. An **Anthropic API key** from
   [https://console.anthropic.com/](https://console.anthropic.com/) — the user
   creates it and keeps it ready to paste in B3 (not into the chat).
5. Optional but recommended: a browser automation tool (e.g. Chrome DevTools
   MCP) so you can drive the Slack/Vercel/Google dashboards and debug the
   deployment yourself.

**Checkpoint:** `vercel whoami` prints the user's account.

## B2 — Get the template and deploy once

Clone the repo (or use the user's existing clone) and deploy the `bot/`
directory as a NEW Vercel project:

```sh
git clone https://github.com/Elnora-AI/elnora-slack.git
cd elnora-slack/bot
vercel --yes
```

Accept the defaults (framework: Next.js). Pick a clear project name when
prompted (e.g. `acme-slack-bot`). The first deploy will build and give you a
preview URL; envs come next.

*(Alternative for click-first users: the "Deploy with Vercel" button in
[`bot/README.md`](bot/README.md) does the clone + project creation in the
browser. The CLI path above is easier for you to verify.)*

**Checkpoint:** `vercel ls` shows the new project.

## B3 — Set the environment variables

Full reference: [`bot/.env.example`](bot/.env.example). Minimum to boot:

| Variable | What | Where from |
|---|---|---|
| `ANTHROPIC_API_KEY` | pays for the model | console.anthropic.com |
| `SLACK_BOT_TOKEN` | bot identity (`xoxb-…`) | created in B4 — set after |
| `SLACK_SIGNING_SECRET` | verifies events are from Slack | created in B4 — set after |
| `REDIS_URL` | thread memory across invocations | free at upstash.com — strongly recommended |

Strongly recommended identity/behavior: `BOT_NAME`, `ORG_NAME`, and
`SYSTEM_PROMPT_APPEND` for org-specific instructions. Model defaults to
`claude-sonnet-5` (override with `BOT_MODEL`).

Have the **user** paste each value at the prompt (values never enter the
chat):

```sh
vercel env add ANTHROPIC_API_KEY production
vercel env add REDIS_URL production
vercel env add BOT_NAME production
```

> **Tell the user before they paste a secret:** the terminal shows **nothing**
> when you paste a token or secret — no dots, no characters, no cursor
> movement. That is deliberate (hidden input), not a failure. Paste once, press
> Enter, and trust it landed. Do not paste twice (that doubles the value) and
> do not retype it. This applies to `vercel env add`, the `provision*` scripts,
> and the `.env` steps in Part A.

**Access control:** by default **everyone in the workspace** can use the bot —
that's the point of an org bot, and the signing secret guarantees events only
come from the user's own workspace. To restrict it instead, set
`ALLOWED_SLACK_USER_IDS` to a CSV of Slack user IDs.

**Checkpoint:** `vercel env ls` shows the vars (names only — never print values).

## B4 — Create the bot's Slack app

The two-way bot needs event subscriptions, so it uses its **own manifest**:
[`bot/app-manifest.json`](bot/app-manifest.json) (a superset of the Part A
manifest, plus Events API config).

1. Before pasting, edit the manifest copy: set `display_information.name` and
   `features.bot_user.display_name` to what the org should see (e.g. "Acme
   Agent"), and replace both `YOUR-DEPLOYMENT.vercel.app` placeholders with
   the production domain from B2 (`vercel inspect` or the Vercel dashboard
   shows it).
2. Open [https://api.slack.com/apps](https://api.slack.com/apps) *(offer to
   drive)* → **Create New App** → **From a manifest** → pick the workspace →
   paste the edited JSON.
   - Slack validates the `request_url` by sending a challenge — the deployed
     webhook route answers it automatically. If validation runs before your
     deploy finished, retry after B5.
3. **Install to Workspace** → **Allow**.
4. **Brand it** *(offer to drive)*: still in the app config, go to **Basic
   Information → Display Information** and upload the org's logo as the
   **App icon** (512–2000 px square PNG) plus a background color. Slack has
   no API for this — it's the one manual branding step, and every message
   the bot sends will carry the logo from then on. Ask the user for the logo
   file if you don't have it; skipping is fine, it can be added anytime.
5. Collect two values (user pastes them straight into the env prompts, never
   the chat):

   ```sh
   vercel env add SLACK_BOT_TOKEN production        # OAuth & Permissions → Bot User OAuth Token (xoxb-…)
   vercel env add SLACK_SIGNING_SECRET production   # Basic Information → Signing Secret
   ```

> Reusing the Part A app instead of creating a second one also works: add the
> missing scopes + event subscriptions from `bot/app-manifest.json` to it,
> reinstall, and use its token. Two apps (CLI bot + chat bot) is cleaner —
> separate identities, separate blast radius.

**Checkpoint:** app installed; both env vars set.

## B5 — Redeploy to production and verify the webhook

```sh
vercel --prod
```

Then verify, with `<domain>` = the production domain:

```sh
curl -s https://<domain>/api/health
```

Expect `"status":"ok"` with `slack_bot`, `slack_signing`, `anthropic` all
`"ok": true`. In the Slack app config → **Event Subscriptions**, the request
URL must show **Verified** (re-verify now if it didn't in B4).

**Checkpoint:** health is `ok` AND the request URL is Verified. Both matter.

## B6 — Two-way smoke test

Have the user (in Slack):

1. **DM the bot** (find it under Apps): "hello, what can you do?" → it should
   reply in the DM, listing its capabilities.
2. **@-mention it in a channel** (invite it first: `/invite @<bot-name>`):
   "@<bot-name> what's 2+2?" → it should reply in a thread.
3. **Reply in that thread** without mentioning it → it should answer with
   context (thread memory).
4. **React with 👀 (`:eyes:`)** on any message in a channel the bot is in →
   it should post a summary in that message's thread. Emoji actions work out
   of the box (✅ mark done, 🔖 save to knowledge base, 👀 summarize,
   ❓ explain) and are customizable via the `EMOJI_ACTIONS` env var — see
   [`bot/README.md`](bot/README.md#emoji-actions).

If nothing comes back, read the function logs (`vercel logs <domain>`) — the
usual suspects are a wrong signing secret (events rejected silently), a
missing `ANTHROPIC_API_KEY`, or the Events URL pointing at a preview
deployment instead of production. If only the reaction test fails, the app
was created from an older manifest — add the `reaction_added` bot event
under **Event Subscriptions** and reinstall the app.

**Checkpoint:** all four interactions answered. The bot is live both ways.

## B7 — Connect tools

Each tool group lights up when its env vars exist (set them with
`vercel env add … production`, then `vercel --prod` to redeploy — envs are
baked at deploy time). Ask the user which they want; **the knowledge base is
the default** — offer it first.

**Knowledge base (Google Drive) — default.** Gives the bot `kbSearch` /
`kbReadFile` (+ `kbCreateNote` with a notes folder). Needs a Google OAuth
client + refresh token:

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   *(offer to drive)*: create (or reuse) a project → **OAuth client ID** →
   type **Desktop app**. Enable the **Google Drive API** for the project.
2. Mint a refresh token for the Google account that can read the Drive:
   easiest is [OAuth Playground](https://developers.google.com/oauthplayground)
   with "Use your own OAuth credentials" checked, scope
   `https://www.googleapis.com/auth/drive`, then Exchange authorization code →
   copy the **refresh token**.
3. Set: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
   (or `GOOGLE_DRIVE_REFRESH_TOKEN`), and `DRIVE_ID` — the shared-drive ID
   from its URL (`https://drive.google.com/drive/folders/<DRIVE_ID>`).
   Optional: `NOTES_FOLDER_ID` (enables saving notes), `KB_NAME` (what the
   bot calls it).

**Linear** — set `LINEAR_API_KEY` (Linear → Settings → Security & access →
API keys). The bot discovers teams itself via `linearListTeams`.

**Web search** — set `TAVILY_API_KEY` ([tavily.com](https://tavily.com), free
tier).

**Slack history search** — set `SLACK_USER_TOKEN` (the `xoxp-` token from
Part A Step 3).

**Email + Calendar (Gmail)** — reuses `GOOGLE_CLIENT_ID/SECRET` +
`GOOGLE_REFRESH_TOKEN` with Gmail/Calendar scopes added when minting the
token. Drafts are approval-gated by the system prompt; sends need explicit
user approval in-thread.

**Outbound send API (optional, for the user's own automations)** — set
`SEND_API_SECRET` (e.g. `openssl rand -hex 32`); then
`POST /api/send` with `Authorization: Bearer $SEND_API_SECRET` and
`{"channel": "C…", "message": "…"}` posts as the bot.

After each batch of env changes: `vercel --prod`, then ask the bot in Slack to
run a quick check ("search the knowledge base for X", "list my Linear teams")
to confirm the tool actually works.

**Checkpoint:** knowledge base answers a real question from the user's docs.

## B8 — Any other tool (ClickUp, Monday, Notion, …)

The registry is designed for this. To add a tool the user wants:

1. Create `bot/src/lib/tools/<name>.ts` exporting `tool({...})` objects —
   copy the shape of [`linear.ts`](bot/src/lib/tools/linear.ts) (env-gated
   API key, zod input schema, small JSON results, no secrets in output).
2. Register a group for it in
   [`bot/src/lib/tools/index.ts`](bot/src/lib/tools/index.ts) — key, label,
   `promptHint`, `enabled: !!process.env.<NAME>_API_KEY`, tools.
3. `vercel env add <NAME>_API_KEY production && vercel --prod`.

You (the agent) can write these files yourself in the user's clone — that's
expected use. Keep them generic (env-driven, no org hardcoding) and consider
PRing genuinely reusable ones back to
[Elnora-AI/elnora-slack](https://github.com/Elnora-AI/elnora-slack).

## B9 — Troubleshooting

These are the exact traps a real end-to-end setup hit — check them in order:

- **`ANTHROPIC_API_KEY` won't set via `vercel env add`** (silently fails, absent
  from `vercel env ls`) → on teams with Vercel AI Gateway enabled, that name is
  reserved. Add it through the **Vercel dashboard** (Project → Settings →
  Environment Variables → Add), not the CLI. Redeploy after.
- **Request URL shows "Verified" then flips to "didn't respond"** → the
  verification was never **Saved**. On the Event Subscriptions page, after it
  shows Verified, the change must be committed (the manifest editor's Save can
  re-trigger verification and drop it). Verify the deployment itself is fine
  first: `curl -s https://<domain>/api/health` should show `slack_signing: ok`,
  and a correctly-signed challenge returns HTTP 200 echoing the challenge.
- **URL verified but bot still silent** → open the **"Subscribe to bot events"**
  section (it's collapsed by default) and confirm `app_mention`, `message.im`,
  `message.channels/groups/mpim`, `member_joined_channel` are listed. No events
  subscribed = Slack sends nothing.
- **`SLACK_SIGNING_SECRET` / `SLACK_BOT_TOKEN` mispasted** → the signing secret
  is a **32-char hex** (e.g. `43ffdf…`), the bot token starts **`xoxb-`**, the
  user token starts **`xoxp-`**. It's easy to paste the wrong one (terminal
  hidden input shows nothing). If verification fails or replies fail, re-set the
  value from the Slack app's Basic Information / OAuth page via the Vercel
  dashboard and **look at it** before saving.
- **`cannot_dm_bot` / app not in the Apps sidebar** → the bot's **Messages Tab**
  is off. Enable `features.app_home.messages_tab_enabled: true` (the template
  manifest does this) and **Reinstall the app** (Install App → Reinstall).
- **You're testing by posting with a bot token** → a bot ignores bot-authored
  messages (`isBot` guard), so it looks broken. Test with a **real human
  message** (DM the bot, or @-mention it as yourself), not a token-posted one.
- **Two bots answer / the wrong bot answers** → another app in the workspace
  subscribes to `message.channels` and is in the same channel. Test in a channel
  with only your bot, or DM it.
- **Bot never replies (after the above)** → `vercel logs <domain>`; check Events
  URL points at *production*, and the app was reinstalled after any scope change.
- **Replies cut off / first reply works then silence** → function timeout.
  The route asks for `maxDuration: 300`; on the Hobby plan enable fluid
  compute or upgrade — long tool chains need the headroom.
- **"Sorry, I'm not configured to assist you"** → `ALLOWED_SLACK_USER_IDS` is
  set and doesn't include that user. Unset it (or add them) + redeploy.
- **Thread forgets context** → no `REDIS_URL`; in-memory state only survives
  warm starts. Add Upstash (free tier).
- **Tool says "not configured"** → its env var isn't on *production*, or you
  forgot to redeploy after adding it. `vercel env ls` then `vercel --prod`.
- **Slack shows "dispatch_failed"** on events → the deployment is erroring
  before ack; read the logs.

## Part B completion checklist

- [ ] Vercel project deployed to production, `/api/health` returns `ok`
- [ ] Slack app created from `bot/app-manifest.json`, Events URL **Verified**
- [ ] DM answered, channel @-mention answered, thread follow-up remembered
- [ ] 👀 reaction produced a thread summary (emoji actions live)
- [ ] App icon uploaded (or the user explicitly skipped branding)
- [ ] Knowledge base connected and answering from real docs (unless the user
      declined)
- [ ] Any extra tools the user chose are live
- [ ] All secrets went straight from the user into `vercel env add` — never
      through the chat

## Handoff summary

Report to the user: the CLI bot identity from `auth test`, which scopes are
active, whether a user token is configured (so `search.*` is available), and —
if in Claude Code — that the reference cache is populated. Remind them that
any terminal-side message send goes through the `slack-messages`
draft-and-approve gate.

If Part B was done, also report: the bot's Slack name, the production URL,
who can talk to it (workspace-wide or the allowlist), which tool groups are
live (ask the bot to run `systemStatus`), and where to change its persona
(`BOT_NAME`, `ORG_NAME`, `SYSTEM_PROMPT_APPEND` env vars).
