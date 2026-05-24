# Run the same checks as .github/workflows before pushing.
# Usage:
#   .\scripts\ci-local.ps1              # backend + mobile (matches main CI jobs)
#   .\scripts\ci-local.ps1 -BackendOnly
#   .\scripts\ci-local.ps1 -MobileOnly
#   .\scripts\ci-local.ps1 -IncludeFrontend
#   .\scripts\ci-local.ps1 -SkipAndroidBuild   # fast: format, analyze, test only

param(
    [switch]$BackendOnly,
    [switch]$MobileOnly,
    [switch]$IncludeFrontend,
    [switch]$SkipAndroidBuild,
    [string]$MobileApiBase = "https://sikapa-backend.onrender.com/api/v1"
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

$runBackend = -not $MobileOnly
$runMobile = -not $BackendOnly
$failed = @()

if ($runBackend) {
    try {
        Invoke-Step "Backend CI (pytest + 50% coverage gate)" {
            Set-Location "$Root\backend"
            $env:DATABASE_URL = "sqlite:///:memory:"
            $env:SECRET_KEY = "ci-secret-key-for-testing-only"
            $env:JWT_SECRET_KEY = "ci-jwt-secret-for-testing"
            $env:JWT_REFRESH_SECRET_KEY = "ci-jwt-refresh-secret"
            $env:RESEND_API_KEY = "test-resend-api-key"
            $env:EMAIL_FROM = "test@example.com"
            $env:FRONTEND_URL = "http://localhost:3000"
            $env:CORS_ORIGINS = "http://localhost:3000"
            $env:EMAIL_ENABLED = "false"
            $env:HTTPS_ENABLED = "false"
            $env:DEBUG = "false"
            $env:TESTING = "true"
            $env:PAYSTACK_SECRET_KEY = ""
            python -m pip install --upgrade pip -q
            python -m pip install -r requirements.txt -q
            python -m pytest tests/ -v --tb=short --cov=app --cov-report=xml
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
        Invoke-Step "Frontend: build" {
            $env:NEXT_PUBLIC_API_URL = "http://localhost:8000/api/v1"
            npm run build
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
