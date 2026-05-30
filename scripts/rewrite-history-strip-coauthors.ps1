# Rewrite all commit messages: strip Co-authored-by / Cursor agent trailers.
# Requires: Python 3 + pip install git-filter-repo
#
# After running, re-add origin and force-push (history changes every SHA):
#   git remote add origin https://github.com/AsieduDevelopmentHub/Sikapa-Enterprise.git
#   git branch -f main dev/develop   # if main ref lags after filter-repo
#   git push origin main dev/develop --force-with-lease
#   git push origin --tags --force

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$python = $null
foreach ($cmd in @("py -3", "python3", "python")) {
    try {
        & ($cmd.Split(" ")[0]) ($cmd.Split(" ")[1..99]) -m git_filter_repo --version | Out-Null
        $python = $cmd
        break
    } catch { }
}
if (-not $python) {
    throw "Python 3 with git-filter-repo is required (pip install git-filter-repo)."
}

Write-Host "Rewriting history (strip agent co-author trailers)..."
& ($python.Split(" ")[0]) ($python.Split(" ").Skip(1)) -m git_filter_repo --force `
    --message-callback scripts/filter_repo_message_callback.py

Write-Host "Done. Verify:"
Write-Host '  git log --all --format=%B | Select-String cursoragent'
Write-Host "Then align main with dev/develop if needed and force-push both branches."
