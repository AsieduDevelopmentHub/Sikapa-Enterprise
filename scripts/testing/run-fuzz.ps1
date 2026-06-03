# Phase 9 — Fuzz (Schemathesis against staging OpenAPI).
# Install once: pip install schemathesis
#
# Usage:
#   .\scripts\testing\run-fuzz.ps1
#   .\scripts\testing\run-fuzz.ps1 -ApiHost https://sikapa-backend-staging.onrender.com

param(
    [string]$ApiHost = "https://sikapa-backend-staging.onrender.com",
    [int]$MaxExamples = 50
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$py = Join-Path $Root "backend\venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
    $py = Join-Path $Root "backend\.venv\Scripts\python.exe"
}
if (-not (Test-Path $py)) { throw "Backend venv not found." }

$hostUrl = $ApiHost.TrimEnd("/")
$openApi = "$hostUrl/openapi.json"

Write-Host "==> Schemathesis on $openApi (staging only)" -ForegroundColor Cyan
& $py -m pip install schemathesis -q

$st = Join-Path (Split-Path $py -Parent) "schemathesis.exe"
if (-not (Test-Path $st)) {
    throw "schemathesis.exe not found in venv after pip install."
}

Set-Location $Root
& $st run $openApi `
    --url=$hostUrl `
    --checks all `
    --max-examples=$MaxExamples

if ($LASTEXITCODE -ne 0) {
    Write-Host "Fuzz run reported failures. Review 5xx and leaked stack traces; stop if Paystack/email rate limits trigger." -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host "Schemathesis run finished." -ForegroundColor Green
