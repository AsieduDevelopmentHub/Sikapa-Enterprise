# Phase 7 — Security (automated slice): pytest auth/RBAC/Paystack + pip-audit.
# Usage:
#   .\scripts\testing\run-security.ps1
#   .\scripts\testing\run-security.ps1 -SkipAudit

param([switch]$SkipAudit)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root

$py = Join-Path $Root "backend\venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
    $py = Join-Path $Root "backend\.venv\Scripts\python.exe"
}
if (-not (Test-Path $py)) {
    throw "Backend venv not found. cd backend; python -m venv venv; pip install -r requirements.txt"
}

Write-Host "==> Security pytest (RBAC, Paystack, auth)" -ForegroundColor Cyan
Set-Location "$Root\backend"
$env:DATABASE_URL = "sqlite:///:memory:"
$env:SECRET_KEY = "security-test-secret-key"
$env:TESTING = "true"
$env:EMAIL_ENABLED = "false"
$env:PAYSTACK_SECRET_KEY = ""

& $py -m pytest tests/test_admin_permissions.py tests/test_paystack_routes.py tests/test_paystack_services.py tests/test_auth_e2e.py tests/test_rate_limiting.py -v --tb=short
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not $SkipAudit) {
    Write-Host "==> pip-audit (dependency CVEs)" -ForegroundColor Cyan
    & $py -m pip install pip-audit -q
    & $py -m pip_audit -r requirements.txt
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Automated security slice passed. Run OWASP ZAP baseline on staging (see docs/testing/nine-phase-runbook.md)." -ForegroundColor Green
