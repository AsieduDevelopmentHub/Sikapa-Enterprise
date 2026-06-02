# Download a portable k6 binary for Windows into scripts/load/.tools/k6.
#
# This avoids MSI/winget interactive installs (common in CI shells / locked-down machines).
#
# Usage:
#   .\scripts\load\get-k6.ps1
#
param(
    [string]$Version = "2.0.0"
)

$ErrorActionPreference = "Stop"

$ToolsDir = Join-Path $PSScriptRoot ".tools"
$K6Dir = Join-Path $ToolsDir "k6"
$K6Exe = Join-Path $K6Dir "k6.exe"

if (Test-Path $K6Exe) {
    Write-Host "k6 already present: $K6Exe" -ForegroundColor DarkGray
    exit 0
}

New-Item -ItemType Directory -Force -Path $K6Dir | Out-Null

$zipName = "k6-v$Version-windows-amd64.zip"
$url = "https://github.com/grafana/k6/releases/download/v$Version/$zipName"
$zipPath = Join-Path $K6Dir $zipName

Write-Host "Downloading $url" -ForegroundColor Cyan
Invoke-WebRequest -Uri $url -OutFile $zipPath

$extractDir = Join-Path $K6Dir "_extract"
if (Test-Path $extractDir) { Remove-Item -Recurse -Force $extractDir }
New-Item -ItemType Directory -Force -Path $extractDir | Out-Null

Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force

$exe = Get-ChildItem -Path $extractDir -Recurse -Filter "k6.exe" | Select-Object -First 1
if (-not $exe) {
    throw "k6.exe not found inside downloaded zip ($zipPath)."
}

Copy-Item -Force -Path $exe.FullName -Destination $K6Exe
Remove-Item -Force $zipPath
Remove-Item -Recurse -Force $extractDir

Write-Host "Installed portable k6: $K6Exe" -ForegroundColor Green
& $K6Exe "version"

