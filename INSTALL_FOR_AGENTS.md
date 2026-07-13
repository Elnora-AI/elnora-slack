# INSTALL_FOR_AGENTS.md — `elnora-slack` setup

A gated, step-by-step runbook for an AI agent installing `elnora-slack` for a
user. Do the steps **in order**, and **stop at each checkpoint** for the user to
act or confirm — you cannot create a Slack app or read a token on their behalf
without them. Never guess a token, never paste a token into a chat, and never
send a Slack message during setup beyond the `auth test` smoke check.

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

## Completion checklist

- [ ] `elnora-slack --version` works
- [ ] Slack app created from the manifest, installed to the workspace
- [ ] `SLACK_BOT_TOKEN` saved to `~/.config/elnora-slack/.env` (0600), token never shown in chat
- [ ] `SLACK_USER_TOKEN` saved too **if** `search.*` is needed
- [ ] `elnora-slack auth test` returns `ok: true`
- [ ] (Claude Code only) plugin installed and `/slack-sync` run

## Handoff summary

Report to the user: the bot's identity from `auth test`, which scopes are
active, whether a user token is configured (so `search.*` is available), and — if
in Claude Code — that the reference cache is populated. Remind them that any
message send goes through the `slack-messages` draft-and-approve gate.
