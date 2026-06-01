# Rewrite HEAD with the same tree/parent but a clean commit message (no Co-authored-by).
$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)

$msg = @"
chore: track staging env example templates in git

Allow backend/.env.staging.example and frontend/.env.staging.example
via gitignore exceptions so operators can copy templates from the repo.

"@

$msgPath = Join-Path $env:TEMP "sikapa-amend-msg.txt"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($msgPath, $msg, $utf8NoBom)

$git = "C:\Program Files\Git\cmd\git.exe"
$tree = & $git rev-parse "HEAD^{tree}"
$parent = & $git rev-parse "HEAD~1"

# Invoke commit-tree via git.exe with explicit subcommand (avoid any shell alias).
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $git
$psi.Arguments = "commit-tree $tree -p $parent -F `"$msgPath`""
$psi.RedirectStandardOutput = $true
$psi.UseShellExecute = $false
$p = [System.Diagnostics.Process]::Start($psi)
$new = $p.StandardOutput.ReadToEnd().Trim()
$p.WaitForExit()
if ($p.ExitCode -ne 0 -or -not $new) {
    Write-Error "commit-tree failed (exit $($p.ExitCode))"
}

& $git reset --hard $new
Remove-Item $msgPath -Force -ErrorAction SilentlyContinue
Write-Host "Amended commit: $new"
& $git log -1 --format=full
