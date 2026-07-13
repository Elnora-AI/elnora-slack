# Changelog

## 0.1.0

Initial release.

### Features

* Complete Slack Web API CLI — 201 methods across 29 command groups, generated from the official OpenAPI spec plus hand-authored coverage for canvases, lists, bookmarks, and functions on `@slack/web-api`.
* Dual-token auth with fail-fast user-token enforcement for `search.*`, format validation, and a strict 3-key `.env` loader (`~/.config/elnora-slack/.env`).
* Agent-friendly output: JSON by default, `--compact`, `--output table|csv`, `--fields`, typed exit codes, and secret redaction on every error path.
* Client-side token-bucket rate limiting with `Retry-After` backoff, cursor pagination, and an SSRF host allow-list.
* Claude Code plugin `slack-workspace`: the `slack-cli` and `slack-messages` skills (draft-and-approve gate before any send), the `/slack-sync` command, and a SessionStart staleness hook for the workspace reference cache.
* `app-manifest.json` to bootstrap your own Slack app, scheduled-job templates (launchd + cron), and a publication guard that keeps tokens, concrete Slack IDs, and populated references out of the repo.
