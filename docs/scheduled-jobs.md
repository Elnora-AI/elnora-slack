# Scheduled jobs

`elnora-slack` is a single binary, so any OS scheduler can drive it. The
[`templates/`](../templates/) directory ships three ready-to-fill patterns and
the launchd/cron plumbing to run them. This page is the overview; the templates
themselves carry the copy-paste detail.

All of them assume `elnora-slack` is on `PATH` (`npm install -g @elnora-ai/slack`)
and a bot token lives in `~/.config/elnora-slack/.env`. Keep the token there, not
in the plist or crontab.

## The patterns

| Pattern | What it does | Template |
|---|---|---|
| **notify-on-failure** | Wrap any command; on a non-zero exit, DM the failure output to a user | `templates/notify-on-failure.{sh,ps1}` |
| **weekly-digest** | DM a rolled-up summary on a schedule | `templates/weekly-digest.{sh,ps1}` |
| **log-sweep** | Scan a log file for a pattern and post an alert to a channel | `templates/log-sweep.{sh,ps1}` |

Each script parses Slack's JSON with `node` (already installed alongside the
CLI), so there's no `jq` dependency, and each takes its target ids from env vars
or inline `{{PLACEHOLDERS}}` — never a hardcoded workspace id.

## The DM recipe these use

DMing a user is two calls, because `chat.postMessage` to a raw `U…` id fails:

```sh
elnora-slack conversations open --users U0XXXXXXXXX --return-im --compact   # → {"channel":{"id":"D0…"}}
elnora-slack chat postMessage --channel D0XXXXXXXXX --text "…"
```

The scripts do exactly this and extract the `D…` id for you.

## Scheduling

### macOS — launchd

Edit a plist in [`templates/launchd/`](../templates/launchd/), fill the
`{{PLACEHOLDERS}}`, save it to `~/Library/LaunchAgents/`, and load it:

```sh
launchctl load ~/Library/LaunchAgents/com.example.slack-weekly-digest.plist
launchctl unload ~/Library/LaunchAgents/com.example.slack-weekly-digest.plist   # to remove
```

The plists run the script through `/bin/sh`, so the template must be executable.
The committed copies already carry the exec bit, but if you copied or regenerated
one, run `chmod +x templates/*.sh` first.

launchd gives a job a minimal environment. If `elnora-slack` isn't found, set
`PATH` in the plist's `EnvironmentVariables`, or use the absolute path from
`which elnora-slack`.

### Linux — cron

See [`templates/cron/crontab.example`](../templates/cron/crontab.example). Make
the scripts executable (`chmod +x templates/*.sh`) and add the lines via
`crontab -e`. Cron's `PATH` is short — use an absolute path to `elnora-slack` if
needed.

### Windows — Task Scheduler

```powershell
$action  = New-ScheduledTaskAction -Execute 'pwsh' -Argument '-File C:\path\to\weekly-digest.ps1'
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9am
Register-ScheduledTask -TaskName 'SlackWeeklyDigest' -Action $action -Trigger $trigger
```

`notify-on-failure` is a wrapper rather than a standalone schedule — point your
existing scheduled job at it (`notify-on-failure.sh my-nightly-job …`) so a
failure turns into a DM. The [cron example](../templates/cron/crontab.example)
shows this on the last line.
