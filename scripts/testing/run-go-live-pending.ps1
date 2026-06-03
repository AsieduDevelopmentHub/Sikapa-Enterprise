# Runs automated checks that were still open in the nine-phase staging program.
# Manual items (ZAP, live Paystack checkout, Render/Sentry review) are listed at the end.
param(
  [string]$ApiBase = "https://sikapa-backend-staging.onrender.com",
  [switch]$SkipFuzz,
  [switch]$SkipLoad
)

$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $root

Write-Host "== Go-live pending (automated) ==" -ForegroundColor Cyan
Write-Host "API base: $ApiBase`n"

# 1. Staging API runner (smoke / functional / integration / quick fuzz)
$env:API_BASE = $ApiBase
Write-Host "[1/4] Staging API runner..." -ForegroundColor Yellow
python backend/tools/testing/staging_api_runner.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 2. Backend regression
Write-Host "`n[2/4] Backend regression (ci-local -BackendOnly)..." -ForegroundColor Yellow
& "$root\scripts\ci-local.ps1" -BackendOnly
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 3. Security subset
Write-Host "`n[3/4] Security automated..." -ForegroundColor Yellow
& "$root\scripts\testing\run-security.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 4. Full Schemathesis (optional; slow)
if (-not $SkipFuzz) {
  Write-Host "`n[4/4] Schemathesis fuzz..." -ForegroundColor Yellow
  $env:API_BASE = "$ApiBase/api/v1"
  & "$root\scripts\testing\run-fuzz.ps1"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "`n[4/4] Schemathesis skipped (-SkipFuzz)" -ForegroundColor DarkGray
}

if (-not $SkipLoad) {
  Write-Host "`n[optional] k6 smoke load (latency may fail on Render staging)..." -ForegroundColor Yellow
  $env:API_HOST = $ApiBase
  & "$root\scripts\load\k6.ps1" run "$root\scripts\load\smoke-load.js"
}

Write-Host "`n== Automated pass complete ==" -ForegroundColor Green
Write-Host @"

Still manual before production:
  - OWASP ZAP baseline (storefront + API)
  - Full checkout: guest -> Paystack test card -> order confirmed
  - checkout-load.js with dedicated TEST_IDENTIFIER / TEST_PASSWORD on staging
  - Render + Sentry review after stress window
  - Vercel: NEXT_PUBLIC_GA_MEASUREMENT_ID + analytics DebugView smoke
  - Deploy pagination fix if staging fuzz still shows skip=500

See docs/testing/nine-phase-results.md and docs/testing/analytics-tracking.md
"@
