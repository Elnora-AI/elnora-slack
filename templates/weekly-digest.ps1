# weekly-digest — DM a rolled-up summary to a Slack user once a week. Windows /
# PowerShell form. Set $env:DIGEST_CMD to whatever produces your digest body.
#
# Config:  $env:SLACK_DM_USER — the U… id to DM
#          $env:DIGEST_CMD    — command whose stdout becomes the digest body
$dmUser = if ($env:SLACK_DM_USER) { $env:SLACK_DM_USER } else { '{{DM_USER_ID}}' }
$digestCmd = if ($env:DIGEST_CMD) { $env:DIGEST_CMD } else { '{{DIGEST_COMMAND}}' }

$body = (Invoke-Expression $digestCmd 2>&1 | Out-String).Trim()
if (-not $body) { $body = '(nothing to report)' }
$body = $body.Substring(0, [Math]::Min(3500, $body.Length))

$im = elnora-slack conversations open --users $dmUser --return-im --compact | ConvertFrom-Json
$dmChannel = $im.channel.id

$text = "*Weekly digest* — $(Get-Date -Format yyyy-MM-dd)`n`n$body"
elnora-slack chat postMessage --channel $dmChannel --text $text | Out-Null
