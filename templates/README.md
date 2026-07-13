# Scheduled-job templates

Generic, copy-paste starting points for the Slack automations worth running on a
schedule. Everything here is placeholder-driven — nothing is specific to any
workspace. Fill in the `{{PLACEHOLDERS}}` (or set the matching env vars) and
point your OS scheduler at the script.

Prerequisites: `elnora-slack` on PATH (`npm install -g @elnora-ai/slack`) and a
bot token in `~/.config/elnora-slack/.env`. `node` is already present (the CLI
needs it) and the scripts use it to parse JSON — no `jq` required.

## Placeholders

| Placeholder | Meaning | Find it with |
|---|---|---|
| `{{REPO_ROOT}}` | Absolute path to your project / working dir | — |
| `{{DM_USER_ID}}` | `U…` id of the person to DM | `elnora-slack users list` |
| `{{CHANNEL_ID}}` | `C…` id of a channel to post to | `elnora-slack conversations list` |
| `{{LOG_FILE}}` | Absolute path to a log file to sweep | — |
| `{{PATTERN}}` | Regex to alert on (e.g. `ERROR|FATAL`) | — |

## The three patterns

- **`notify-on-failure`** — run any command; if it exits non-zero, DM the failure output. Wrap a build, a deploy, a backup.
- **`weekly-digest`** — DM a rolled-up summary once a week. Point it at whatever command produces your digest body.
- **`log-sweep`** — scan a log file for a pattern and post an alert to a channel when it matches.

Each has a `.sh` (macOS/Linux) and a `.ps1` (Windows) form.

## Scheduling

- **macOS — launchd:** edit a plist in [`launchd/`](launchd/), then `launchctl load ~/Library/LaunchAgents/<name>.plist`.
- **Linux — cron:** see [`cron/crontab.example`](cron/crontab.example) (`crontab -e`).
- **Windows — Task Scheduler:**
  ```powershell
  $action  = New-ScheduledTaskAction -Execute 'pwsh' -Argument '-File C:\path\to\weekly-digest.ps1'
  $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9am
  Register-ScheduledTask -TaskName 'SlackWeeklyDigest' -Action $action -Trigger $trigger
  ```

Keep the token out of the plist/crontab — the scripts read it from
`~/.config/elnora-slack/.env`. On macOS a launchd job's environment is minimal;
if `elnora-slack` isn't found, use its absolute path (`which elnora-slack`) or
set `PATH` at the top of the script.
