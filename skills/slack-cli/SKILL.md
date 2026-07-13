---
name: slack-cli
description: >
  Complete Slack Web API CLI — 201 methods across 29 command groups. Every public endpoint.
  Agent-friendly JSON output. Auto-generated from the official OpenAPI spec + @slack/web-api SDK.
  Use when: sending messages, reading channels, adding reactions, managing files, searching,
  pins, bookmarks, reminders, user groups, canvases, lists, admin, and any Slack operation.
  TRIGGERS: "slack", "slack api", "slack message", "slack reaction", "slack channel",
  "slack search", "slack file", "slack pin", "slack bookmark", "slack reminder",
  "slack user", "slack emoji", "slack canvas", "slack list", "add reaction", "post message"
---

# Slack CLI

The complete Slack Web API from the command line. 201 methods, 29 command groups.

The `elnora-slack` binary must be on your PATH (`npm install -g @elnora-ai/slack`).
Verify with `elnora-slack auth test`. If that fails, see
[INSTALL_FOR_AGENTS.md](../../INSTALL_FOR_AGENTS.md).

> Note: the binary is `elnora-slack`, not `slack` — Slack ships its own official
> `slack` CLI and we don't shadow it.

All commands print JSON to stdout; errors go to stderr with a typed exit code.
Add `--compact` for token-efficient output, `--fields <list>` to select fields,
and `--output table|csv` where a list is returned.

## Workspace reference (cached)

Before looking up users or channels via the API, check the cached reference
files in `$SLACK_REFERENCES_DIR` (or `${CLAUDE_PLUGIN_ROOT}/references/`):

- **Users**: `workspace-users.md` — IDs, usernames, emails, quick-lookup aliases
- **Channels**: `workspace-channels.md` — IDs, names, routing table

Read these first when you need an ID. Only call the API if the cache doesn't
have it. The files ship as `*.template.md` (fake rows) until you run
`/slack-sync` to generate the real ones.

## Auth

Token resolution order: `SLACK_TOKEN` / `SLACK_BOT_TOKEN` / `SLACK_USER_TOKEN`
from the environment, then `~/.config/elnora-slack/.env`, then a `.env` next to
the CLI. `search.*` requires a user token (`SLACK_USER_TOKEN`, `xoxp-`).

## Quick reference

### Messaging
```bash
elnora-slack chat postMessage --channel CHANNEL_ID --text "Hello"
elnora-slack chat update --channel CHANNEL_ID --ts TIMESTAMP --text "Updated"
elnora-slack chat delete --channel CHANNEL_ID --ts TIMESTAMP
elnora-slack chat scheduleMessage --channel CHANNEL_ID --text "Later" --post-at UNIX_TS
```

### Reactions
```bash
elnora-slack reactions add --channel CHANNEL_ID --name white_check_mark --timestamp MSG_TS
elnora-slack reactions remove --channel CHANNEL_ID --name white_check_mark --timestamp MSG_TS
elnora-slack reactions get --channel CHANNEL_ID --timestamp MSG_TS
```

### Channels & conversations
```bash
elnora-slack conversations list [--types public_channel,private_channel,im,mpim] [--limit 100]
elnora-slack conversations history --channel CHANNEL_ID [--limit 100]
elnora-slack conversations info --channel CHANNEL_ID
elnora-slack conversations replies --channel CHANNEL_ID --ts THREAD_TS
elnora-slack conversations create --name "new-channel" [--is-private]
elnora-slack conversations invite --channel CHANNEL_ID --users USER_IDS
```
> `conversations create` / `invite` need extra scopes not in the default
> manifest: `channels:manage` (public channels) or `groups:write` (private).

### Users
```bash
elnora-slack users list [--limit 100]
elnora-slack users info --user USER_ID
elnora-slack users lookupByEmail --email user@example.com
elnora-slack users profile-get --user USER_ID
```

### Search (user token required)
```bash
elnora-slack search messages --query "search terms" [--count 20] [--sort timestamp]
```

### Files
```bash
# upload runs the files.upload v2 flow; --channels is a single channel ID (the
# first is used if you pass a list), --content is inline text, --file is a disk path
elnora-slack files upload --channels CHANNEL_ID --filename name.txt --content "..."
elnora-slack files upload --channels CHANNEL_ID --file ./report.pdf
elnora-slack files list [--channel CHANNEL_ID] [--user USER_ID]
elnora-slack files info --file FILE_ID
```

### Pins & bookmarks
```bash
elnora-slack pins add --channel CHANNEL_ID --timestamp MSG_TS
elnora-slack pins list --channel CHANNEL_ID
elnora-slack bookmarks add --channel-id CHANNEL_ID --title "..." --type link --link URL
```

### Reminders (user token required)
```bash
elnora-slack reminders add --text "Do thing" --time UNIX_TS
elnora-slack reminders list
elnora-slack reminders complete --reminder REMINDER_ID
```
> `reminders.*` requires a user token (`SLACK_USER_TOKEN`, `xoxp-`) with
> `reminders:read` / `reminders:write` — Slack no longer allows bot tokens here.

### User groups
```bash
elnora-slack usergroups list [--include-users]
elnora-slack usergroups create --name "Team" --handle team
elnora-slack usergroups users-update --usergroup UG_ID --users USER_IDS
```
> `usergroups.*` needs `usergroups:read` / `usergroups:write` (add them to your
> app; not in the default manifest) and a Business+ / Enterprise Grid plan.

### Canvases & lists
```bash
elnora-slack canvases create --title "My Canvas"
elnora-slack lists create --title "My List"
elnora-slack lists item-create --list-id LIST_ID --column-values JSON
```

### Admin (Enterprise Grid)
```bash
elnora-slack admin conversations-list [--cursor CURSOR]
elnora-slack admin users-list --team-id TEAM_ID
elnora-slack admin teams-list
```

### Auth & info
```bash
elnora-slack auth test
elnora-slack team info
elnora-slack emoji list
```

## All command groups

admin, api, apps, auth, bookmarks, bots, calls, canvases, chat, conversations,
dialog, dnd, emoji, files, functions, lists, migration, oauth, pins, reactions,
reminders, rtm, search, stars, team, usergroups, users, views, workflows

Run `elnora-slack <group> --help` for every subcommand in a group. Some
`admin.*`, `canvases.*`, and `lists.*` methods require a paid plan (Enterprise
Grid / Business+) and extra scopes.

## Sending messages

To send a message, use the **slack-messages** skill — it enforces a
draft-and-approve gate and handles the two-step DM recipe. Never post to Slack
without explicit user approval.
