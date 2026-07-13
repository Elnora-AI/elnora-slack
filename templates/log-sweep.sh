#!/usr/bin/env bash
# log-sweep — scan a log file for a pattern and post an alert to a Slack channel
# when it matches. Run it on a schedule to catch errors between sessions.
#
# Config:  LOG_FILE      — absolute path to the log to scan
#          ALERT_CHANNEL — the C… id to post alerts to
#          PATTERN       — extended regex to alert on (default: ERROR|FATAL)
set -uo pipefail

LOG_FILE="${LOG_FILE:-{{LOG_FILE}}}"
ALERT_CHANNEL="${ALERT_CHANNEL:-{{CHANNEL_ID}}}"
PATTERN="${PATTERN:-ERROR|FATAL}"

[ -f "$LOG_FILE" ] || { echo "log-sweep: $LOG_FILE not found" >&2; exit 1; }

matches="$(grep -E "$PATTERN" "$LOG_FILE" | tail -n 20)"
[ -z "$matches" ] && exit 0

text="$(printf ':warning: log-sweep matched \`%s\` in \`%s\`:\n\`\`\`\n%s\n\`\`\`' "$PATTERN" "$LOG_FILE" "${matches:0:2500}")"
elnora-slack chat postMessage --channel "$ALERT_CHANNEL" --text "$text" >/dev/null
