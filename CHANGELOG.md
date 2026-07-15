# Changelog

## [0.1.4](https://github.com/Elnora-AI/elnora-slack/compare/v0.1.3...v0.1.4) (2026-07-15)


### Features

* **bot:** add linearRecentIssues tool for recency-sorted issue queries ([#27](https://github.com/Elnora-AI/elnora-slack/issues/27)) ([4769a20](https://github.com/Elnora-AI/elnora-slack/commit/4769a20ba56d5056b9e9db955ad1faa7e14002e8))
* **bot:** emoji-reaction actions, per-user attribution, branding setup step ([#24](https://github.com/Elnora-AI/elnora-slack/issues/24)) ([cb4d22f](https://github.com/Elnora-AI/elnora-slack/commit/cb4d22fd456216ba0283c329faabe6a9a227bced))


### Bug Fixes

* **bot:** bump @ai-sdk/openai and @ai-sdk/google to v3 line ([#22](https://github.com/Elnora-AI/elnora-slack/issues/22)) ([8008bb9](https://github.com/Elnora-AI/elnora-slack/commit/8008bb99b40de5d5f4affbb4f3d234549c64ad2e))
* **bot:** produce full-quality notes and stop duplicate writes ([#26](https://github.com/Elnora-AI/elnora-slack/issues/26)) ([fc64f2c](https://github.com/Elnora-AI/elnora-slack/commit/fc64f2cf5cec524d390191bed52733137057ab4e))
* **bot:** rename reserved slash commands + make knowledge base the default install ([#25](https://github.com/Elnora-AI/elnora-slack/issues/25)) ([fb4f53a](https://github.com/Elnora-AI/elnora-slack/commit/fb4f53a3e0c294eeb17bbe259cfcc92507977088))

## [0.1.3](https://github.com/Elnora-AI/elnora-slack/compare/v0.1.2...v0.1.3) (2026-07-14)


### Features

* **bot:** any-LLM provider + Exa/Perplexity/Valyu search ([#19](https://github.com/Elnora-AI/elnora-slack/issues/19)) ([4211a67](https://github.com/Elnora-AI/elnora-slack/commit/4211a677d30a239303ac20486699f0f4bb241273))
* **bot:** slash commands (/ask /note /search /status) ([#20](https://github.com/Elnora-AI/elnora-slack/issues/20)) ([022f5c6](https://github.com/Elnora-AI/elnora-slack/commit/022f5c6a3b2007f43b6ece7481a458efab998279))


### Bug Fixes

* **bot:** correctness — no double-reply + live conversation memory ([#18](https://github.com/Elnora-AI/elnora-slack/issues/18)) ([2905c92](https://github.com/Elnora-AI/elnora-slack/commit/2905c92a0da5c7723614c1d4bbfb639986726ad1))
* **bot:** log only error type in /api/send (js/log-injection [#2](https://github.com/Elnora-AI/elnora-slack/issues/2)) ([#17](https://github.com/Elnora-AI/elnora-slack/issues/17)) ([20ec6a0](https://github.com/Elnora-AI/elnora-slack/commit/20ec6a06a2c8cfaa7c2b3c295362d03f139f1445))
* **bot:** pin chat SDK to 4.32.0 — 4.34.0 breaks Slack signature verify ([#16](https://github.com/Elnora-AI/elnora-slack/issues/16)) ([d0bb350](https://github.com/Elnora-AI/elnora-slack/commit/d0bb3507c507ed2e8f0473f7e567874e15a5947b))
* **bot:** sanitize error detail before logging in /api/send ([#14](https://github.com/Elnora-AI/elnora-slack/issues/14)) ([97650ea](https://github.com/Elnora-AI/elnora-slack/commit/97650ea5c52719b02ec0847a269cc7f05cffa852))
* **bot:** sanitize error detail before logging in /api/send ([#21](https://github.com/Elnora-AI/elnora-slack/issues/21)) ([fdd6cd8](https://github.com/Elnora-AI/elnora-slack/commit/fdd6cd893bf6bcf60c6f34a2780aa391848af7d1))

## [0.1.2](https://github.com/Elnora-AI/elnora-slack/compare/v0.1.1...v0.1.2) (2026-07-14)


### Bug Fixes

* **ci:** build before test in the release workflow ([#11](https://github.com/Elnora-AI/elnora-slack/issues/11)) ([f905c46](https://github.com/Elnora-AI/elnora-slack/commit/f905c4637d42de93d8baee25f761f9eab32eeaab))

## [0.1.1](https://github.com/Elnora-AI/elnora-slack/compare/v0.1.0...v0.1.1) (2026-07-14)


### Features

* **bot:** deployable two-way Slack AI agent template ([#8](https://github.com/Elnora-AI/elnora-slack/issues/8)) ([ce15bf8](https://github.com/Elnora-AI/elnora-slack/commit/ce15bf81ce9ebea834506d75889a335e7d87c4b3))


### Bug Fixes

* **deps:** force postcss &gt;=8.5.10 (CVE-2026-41305) ([#9](https://github.com/Elnora-AI/elnora-slack/issues/9)) ([7b6b0d0](https://github.com/Elnora-AI/elnora-slack/commit/7b6b0d0cbffa337d53cfdc302a28e9d1ed3acc58))

## 0.1.0

Initial release.

### Features

* Complete Slack Web API CLI — 201 methods across 29 command groups, generated from the official OpenAPI spec plus hand-authored coverage for canvases, lists, bookmarks, and functions on `@slack/web-api`.
* Dual-token auth with fail-fast user-token enforcement for `search.*`, format validation, and a strict 3-key `.env` loader (`~/.config/elnora-slack/.env`).
* Agent-friendly output: JSON by default, `--compact`, `--output table|csv`, `--fields`, typed exit codes, and secret redaction on every error path.
* Client-side token-bucket rate limiting with `Retry-After` backoff, cursor pagination, and an SSRF host allow-list.
* Claude Code plugin `slack-workspace`: the `slack-cli` and `slack-messages` skills (draft-and-approve gate before any send), the `/slack-sync` command, and a SessionStart staleness hook for the workspace reference cache.
* `app-manifest.json` to bootstrap your own Slack app, scheduled-job templates (launchd + cron), and a publication guard that keeps tokens, concrete Slack IDs, and populated references out of the repo.
