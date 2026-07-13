#!/usr/bin/env bash
# weekly-digest — DM a rolled-up summary to a Slack user once a week. Point
# DIGEST_CMD at whatever produces your digest body (a script, a query, etc.).
#
# Usage:   weekly-digest.sh              (uses DIGEST_CMD / the placeholder)
# Config:  SLACK_DM_USER — the U… id to DM
#          DIGEST_CMD    — shell command whose stdout becomes the digest body
set -uo pipefail

SLACK_DM_USER="${SLACK_DM_USER:-{{DM_USER_ID}}}"
DIGEST_CMD="${DIGEST_CMD:-{{DIGEST_COMMAND}}}"

body="$(bash -lc "$DIGEST_CMD" 2>&1)"
[ -z "$body" ] && body="(nothing to report)"

im_json="$(elnora-slack conversations open --users "$SLACK_DM_USER" --return-im --compact)"
dm_channel="$(printf '%s' "$im_json" \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).channel.id)}catch{process.exit(1)}})')"

text="$(printf '*Weekly digest* — %s\n\n%s' "$(date +%Y-%m-%d)" "${body:0:3500}")"
elnora-slack chat postMessage --channel "$dm_channel" --text "$text" >/dev/null
