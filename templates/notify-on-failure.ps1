# notify-on-failure — run a command; if it exits non-zero, DM the failure to a
# Slack user. Windows / PowerShell form.
#
# Usage:   pwsh -File notify-on-failure.ps1 -- <command> [args...]
# Config:  $env:SLACK_DM_USER — the U… id to DM (or edit the placeholder below).
param([Parameter(ValueFromRemainingArguments = $true)] [string[]] $Command)

$dmUser = if ($env:SLACK_DM_USER) { $env:SLACK_DM_USER } else { '{{DM_USER_ID}}' }

$rest = if ($Command.Count -gt 1) { $Command[1..($Command.Count - 1)] } else { @() }
$output = & $Command[0] @rest 2>&1 | Out-String
$status = $LASTEXITCODE
if ($status -eq 0) { exit 0 }

# Two-step DM: open the IM channel, read its D… id.
$im = elnora-slack conversations open --users $dmUser --return-im --compact | ConvertFrom-Json
$dmChannel = $im.channel.id

$body = $output.Substring(0, [Math]::Min(2500, $output.Length))
# Single-quoted so the three backticks are literal — a double-quoted "```" would
# collapse to one backtick and break the Slack code fence.
$fence = '```'
$text = ":rotating_light: ``$($Command -join ' ')`` failed (exit $status):`n$fence`n$body`n$fence"
elnora-slack chat postMessage --channel $dmChannel --text $text | Out-Null

exit $status
