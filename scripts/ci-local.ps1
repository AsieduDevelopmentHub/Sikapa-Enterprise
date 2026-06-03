# Run the same checks as .github/workflows before pushing.
# Usage:
#   .\scripts\ci-local.ps1 -Quick              # dev/develop push (ci-quick.yml)
#   .\scripts\ci-local.ps1 -IncludeFrontend    # full CI frontend (before staging PR)
#   .\scripts\ci-local.ps1                     # backend + mobile (full CI mobile path)
#   .\scripts\ci-local.ps1 -BackendOnly
#   .\scripts\ci-local.ps1 -MobileOnly
#   .\scripts\ci-local.ps1 -SkipAndroidBuild   # fast: format, analyze, test only
#
# Backend uses backend/venv (activate or let script auto-detect venv\Scripts\python.exe).

param(
    [switch]$Quick,
    [switch]$BackendOnly,
    [switch]$MobileOnly,
    [switch]$IncludeFrontend,
    [switch]$SkipAndroidBuild,
    [string]$MobileApiBase = "https://sikapa-backend.onrender.com/api/v1",
    # Backend venv (default: backend/venv per backend/README.md). Use backend/.venv if that is your layout.
    [string]$BackendVenv = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Invoke-Step($name, [scriptblock]$Block) {
    Write-Step $name
    & $Block
    if ($LASTEXITCODE -ne 0) {
        throw "$name failed (exit $LASTEXITCODE)"
    }
}

function Resolve-BackendPython {
    param([string]$Override)
    if ($Override -and (Test-Path $Override)) {
        return (Resolve-Path $Override).Path
    }
    $candidates = @(
        (Join-Path $Root "backend\venv\Scripts\python.exe"),
        (Join-Path $Root "backend\.venv\Scripts\python.exe")
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { return (Resolve-Path $c).Path }
    }
    throw "Backend venv not found. Create one: cd backend; python -m venv venv; .\venv\Scripts\activate; pip install -r requirements.txt"
}

$runBackend = -not $MobileOnly
$runMobile = (-not $BackendOnly) -and (-not $Quick)
if ($Quick) { $IncludeFrontend = $true }
$failed = @()
$BackendPython = $null
if ($runBackend) {
    $BackendPython = Resolve-BackendPython -Override $BackendVenv
    Write-Host "Using backend Python: $BackendPython" -ForegroundColor DarkGray
}

if ($runBackend) {
    try {
        $backendStep = if ($Quick) { "Backend CI Quick (ruff + pytest, no cov)" } else { "Backend CI (pytest + 50% coverage gate)" }
        Invoke-Step $backendStep {
            Set-Location "$Root\backend"
            $env:DATABASE_URL = "sqlite:///:memory:"
            $env:SECRET_KEY = "ci-secret-key-for-testing-only"
            $env:RESEND_API_KEY = "test-resend-api-key"
            $env:EMAIL_FROM = "test@example.com"
            $env:FRONTEND_URL = "http://localhost:3000"
            $env:CORS_ORIGINS = "http://localhost:3000"
            $env:EMAIL_ENABLED = "false"
            $env:HTTPS_ENABLED = "false"
            $env:DEBUG = "false"
            $env:TESTING = "true"
            $env:PAYSTACK_SECRET_KEY = ""
            # Use project venv only — do not install into global Python.
            & $BackendPython -m pip install -r requirements.txt -q
            & $BackendPython -m pip install ruff -q
            & $BackendPython -m ruff check app tests
            Set-Location $Root
            & $BackendPython scripts/check_api_path_sync.py
            Set-Location "$Root\backend"
            if ($Quick) {
                & $BackendPython -m pytest tests/ -q --tb=line --no-cov
            } else {
                & $BackendPython -m pytest tests/ -v --tb=short --cov=app --cov-report=xml
            }
        }
    } catch {
        $failed += "Backend: $_"
    } finally {
        Set-Location $Root
    }
}

if ($runMobile) {
    $mobileDir = "$Root\mobile"
    $defines = @("--dart-define=SIKAPA_API_BASE=$MobileApiBase")
    try {
        Invoke-Step "Mobile: flutter pub get" {
            Set-Location $mobileDir
            flutter pub get
        }
        Invoke-Step "Mobile: dart format (ci.yml)" {
            dart format --output=none --set-exit-if-changed .
        }
        Invoke-Step "Mobile: flutter analyze (ci.yml)" {
            flutter analyze --no-pub
        }
        Invoke-Step "Mobile: flutter test (ci.yml)" {
            flutter test
        }
        if (-not $SkipAndroidBuild) {
            Invoke-Step "Mobile: Android release APK (mobile-build.yml)" {
                flutter build apk --release --build-number=1 @defines
            }
            Invoke-Step "Mobile: Android split APK (mobile-build.yml)" {
                flutter build apk --release --split-per-abi --build-number=1 @defines
            }
            Invoke-Step "Mobile: Android App Bundle (mobile-build.yml)" {
                flutter build appbundle --release --build-number=1 @defines
            }
        }
    } catch {
        $failed += "Mobile: $_"
    } finally {
        Set-Location $Root
    }
}

if ($IncludeFrontend) {
    try {
        Invoke-Step "Frontend: npm ci" {
            Set-Location "$Root\frontend"
            npm ci
        }
        Invoke-Step "Frontend: lint" {
            npm run lint
        }
        if (-not $Quick) {
            Invoke-Step "Frontend: build" {
                $env:NEXT_PUBLIC_API_URL = "http://localhost:8000/api/v1"
                npm run build
            }
        }
        Invoke-Step "Frontend: test" {
            npm test
        }
    } catch {
        $failed += "Frontend: $_"
    } finally {
        Set-Location $Root
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "All requested local CI checks passed." -ForegroundColor Green
    exit 0
}

Write-Host "Local CI failed:" -ForegroundColor Red
$failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
exit 1
