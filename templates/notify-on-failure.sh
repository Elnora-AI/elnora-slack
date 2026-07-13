#!/usr/bin/env bash
# notify-on-failure — run a command; if it exits non-zero, DM the failure to a
# Slack user. Wrap a build, deploy, backup, or any scheduled job.
#
# Usage:   notify-on-failure.sh <command> [args...]
# Config:  SLACK_DM_USER — the U… id to DM (or edit the placeholder below).
set -uo pipefail

SLACK_DM_USER="${SLACK_DM_USER:-{{DM_USER_ID}}}"

output="$("$@" 2>&1)"
status=$?
[ "$status" -eq 0 ] && exit 0

# Two-step DM: open the IM channel, extract its D… id (node is always present).
im_json="$(elnora-slack conversations open --users "$SLACK_DM_USER" --return-im --compact)"
dm_channel="$(printf '%s' "$im_json" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).channel.id)}catch{process.exit(1)}})')"

text="$(printf ':rotating_light: \`%s\` failed (exit %s):\n\`\`\`\n%s\n\`\`\`' "$*" "$status" "${output:0:2500}")"
elnora-slack chat postMessage --channel "$dm_channel" --text "$text" >/dev/null

exit "$status"
