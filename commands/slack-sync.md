---
name: slack-sync
description: Refresh the Slack workspace reference cache (users, channels) with current data from the Slack API
user_invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob
---

# Slack Workspace Sync

Regenerate the workspace reference cache from live Slack data. The cache lets the
`slack-messages` skill resolve names to IDs without an API round-trip.

## Prerequisites

The `elnora-slack` CLI must be on your PATH (`npm install -g @elnora-ai/slack`)
and a bot token must be configured (`elnora-slack auth test` should succeed). If
not, see [INSTALL_FOR_AGENTS.md](../INSTALL_FOR_AGENTS.md).

## Reference cache location

Write the generated files to the first of these that resolves:

1. `$SLACK_REFERENCES_DIR`
2. `${CLAUDE_PLUGIN_ROOT}/references/`

The committed `*.template.md` files are examples only — never overwrite them.
Write `workspace-users.md` and `workspace-channels.md` (gitignored) alongside.

## Step 1: Fetch live data (2 parallel Bash calls)

```bash
elnora-slack users list --compact
elnora-slack conversations list --types public_channel --compact
```

## Step 2: Read the current cache

Read both in parallel (fall back to the `.template.md` for the expected shape if
the generated file doesn't exist yet):

- `workspace-users.md`
- `workspace-channels.md`

## Step 3: Diff and update

### 3a. `workspace-users.md` — team members

From the users response, keep real humans only:

- Exclude bots (`is_bot: true`)
- Exclude Slackbot (`id: USLACKBOT`)
- Exclude deleted/deactivated users (`deleted: true`, or name starting with `deactivateduser`)

Build the table with: ID, username, real_name, email (from profile). Keep a
**Quick Lookup** section mapping first name → ID and username — this is what the
agent uses for fast resolution.

### 3b. `workspace-channels.md` — channels

From the conversations response, drop archived channels. Split into:

- **Active Channels** — internal channels (sorted by name)
- **External Channels** — channels whose name starts with `ext-`
- **Routing** — map topics to channel names for quick agent routing

Update the `*Generated: YYYY-MM-DD*` line.

## Step 4: Report changes

```
## Slack Sync Complete

**Updated:** YYYY-MM-DD

### Changes detected
- X new users (names)
- Y users removed (names)
- Z new channels (names)
- N channels archived (names)

### Files updated
- [ ] workspace-users.md
- [ ] workspace-channels.md
```

If nothing changed, report "All reference files are up to date."
