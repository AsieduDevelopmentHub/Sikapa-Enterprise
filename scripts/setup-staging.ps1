# Create and push dev/staging branch for hosted staging (Render + Vercel).
# Run from repo root: .\scripts\setup-staging.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

Write-Host "Sikapa — staging branch setup" -ForegroundColor Cyan
Write-Host ""

git fetch origin 2>$null

$exists = git show-ref --verify --quiet refs/heads/dev/staging 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Branch dev/staging already exists locally." -ForegroundColor Yellow
    git checkout dev/staging
    git pull origin dev/staging 2>$null
} else {
    $base = "dev/develop"
    if (-not (git show-ref --verify --quiet "refs/heads/$base" 2>$null)) {
        $base = "main"
    }
    Write-Host "Creating dev/staging from $base ..."
    git checkout $base
    git pull origin $base 2>$null
    git checkout -b dev/staging
}

Write-Host ""
Write-Host "Next steps (one-time):" -ForegroundColor Green
Write-Host "  1. git push -u origin dev/staging"
Write-Host "  2. Follow docs/deployment/staging-environment.md"
Write-Host "     - Supabase staging DB"
Write-Host "     - Render: backend/render.staging.yaml"
Write-Host "     - Vercel: second project, branch dev/staging"
Write-Host "  3. Copy backend/.env.staging.example and frontend/.env.staging.example into host dashboards"
Write-Host ""

$push = Read-Host "Push dev/staging to origin now? (y/N)"
if ($push -match '^[yY]') {
    git push -u origin dev/staging
    Write-Host "Pushed. Configure Render + Vercel per staging-environment.md" -ForegroundColor Green
}
