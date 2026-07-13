# log-sweep — scan a log file for a pattern and post an alert to a Slack channel
# when it matches. Windows / PowerShell form.
#
# Config:  $env:LOG_FILE      — path to the log to scan
#          $env:ALERT_CHANNEL — the C… id to post alerts to
#          $env:PATTERN       — regex to alert on (default: ERROR|FATAL)
$logFile = if ($env:LOG_FILE) { $env:LOG_FILE } else { '{{LOG_FILE}}' }
$alertChannel = if ($env:ALERT_CHANNEL) { $env:ALERT_CHANNEL } else { '{{CHANNEL_ID}}' }
$pattern = if ($env:PATTERN) { $env:PATTERN } else { 'ERROR|FATAL' }

if (-not (Test-Path $logFile)) { Write-Error "log-sweep: $logFile not found"; exit 1 }

$matches = (Select-String -Path $logFile -Pattern $pattern | Select-Object -Last 20 | ForEach-Object { $_.Line }) -join "`n"
if (-not $matches) { exit 0 }

$body = $matches.Substring(0, [Math]::Min(2500, $matches.Length))
# Single-quoted so the three backticks are literal — a double-quoted "```" would
# collapse to one backtick and break the Slack code fence.
$fence = '```'
$text = ":warning: log-sweep matched ``$pattern`` in ``$logFile``:`n$fence`n$body`n$fence"
elnora-slack chat postMessage --channel $alertChannel --text $text | Out-Null
