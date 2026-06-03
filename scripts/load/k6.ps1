# Wrapper to run k6 reliably on Windows without global install.
# It will download a portable k6 zip into scripts/load/.tools/k6/ if missing.
#
# Usage:
#   .\scripts\load\k6.ps1 version
#   .\scripts\load\k6.ps1 run scripts/load/smoke-load.js
#
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ToolsDir = Join-Path $PSScriptRoot ".tools"
$K6Dir = Join-Path $ToolsDir "k6"
$K6Exe = Join-Path $K6Dir "k6.exe"

if (-not (Test-Path $K6Exe)) {
    & (Join-Path $PSScriptRoot "get-k6.ps1") | Out-Null
}

if (-not (Test-Path $K6Exe)) {
    throw "k6.exe not found after download. Check scripts/load/get-k6.ps1 output."
}

& $K6Exe @Args
exit $LASTEXITCODE

