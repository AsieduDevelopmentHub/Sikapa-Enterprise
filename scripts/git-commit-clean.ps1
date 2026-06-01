# Create a commit without Co-authored-by / agent trailers (Cursor-safe).
# Usage: .\scripts\git-commit-clean.ps1 -Message "fix: summary"
param(
  [Parameter(Mandatory = $true)]
  [string]$Message
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

$git = "C:\Program Files\Git\cmd\git.exe"
$staged = & $git diff --cached --quiet 2>$null
if ($LASTEXITCODE -eq 0) {
  $unstaged = & $git diff --quiet 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Error "Nothing staged. Run git add before git-commit-clean.ps1"
  }
}

$msgPath = Join-Path $env:TEMP "sikapa-commit-msg.txt"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msgPath, ($Message.TrimEnd() + "`n"), $utf8NoBom)

$tree = & $git write-tree
$parent = & $git rev-parse "HEAD"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $git
$psi.Arguments = "commit-tree $tree -p $parent -F `"$msgPath`""
$psi.RedirectStandardOutput = $true
$psi.UseShellExecute = $false
$p = [System.Diagnostics.Process]::Start($psi)
$new = $p.StandardOutput.ReadToEnd().Trim()
$p.WaitForExit()
Remove-Item $msgPath -Force -ErrorAction SilentlyContinue

if ($p.ExitCode -ne 0 -or -not $new) {
  Write-Error "commit-tree failed (exit $($p.ExitCode))"
}

& $git reset --hard $new
Write-Host "Created commit $new"
& $git log -1 --oneline
