<# remove-secrets.ps1
   Safe helper to stop tracking sensitive files and push the change.
   Run from repository root in PowerShell.

   IMPORTANT: This script does NOT purge history. Use purge-history scripts below to scrub history.
#>

param(
    [string]$branch = 'main'
)

git commit -m "Remove sensitive env files from repository and stop tracking" || Write-Host "No changes to commit"
git push origin $branch
function EnsureCleanWorkingTree {
    $status = git status --porcelain
    if ($status) {
        Write-Host "Working tree not clean. Here are the changes:" -ForegroundColor Yellow
        git status --short
        $answer = Read-Host "Type CONTINUE to proceed anyway, or anything else to abort"
        if ($answer -ne 'CONTINUE') {
            Write-Host "Aborted. Please commit or stash your changes and run this script again." -ForegroundColor Yellow
            exit 1
        }
    }
}

EnsureCleanWorkingTree

Write-Host "Stopping tracking of sensitive files (.env, env.js) and committing the change..." -ForegroundColor Cyan

# Ensure .gitignore contains entries (should already)
if (-not (Select-String -Path .gitignore -Pattern '\.env' -Quiet)) {
    Add-Content -Path .gitignore -Value "`n# Local env files`n.env`nenv.js"
    & git add .gitignore
}

# Remove env.js from index if tracked
Write-Host "Attempting to remove env.js from git index (if tracked)..." -ForegroundColor Cyan
& git rm --cached env.js 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "env.js removed from index" -ForegroundColor Green
} else {
    Write-Host "env.js was not tracked or removal failed (ok)" -ForegroundColor Yellow
}

# If .env still exists, remove from index and delete file
if (Test-Path .env) {
    Write-Host "Removing .env from index and deleting local file..." -ForegroundColor Cyan
    & git rm --cached .env 2>$null
    Remove-Item -Force .env
    Write-Host ".env removed from working tree" -ForegroundColor Green
}

# Commit the removal if there are staged changes
& git commit -m "Remove sensitive env files from repository and stop tracking" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "No changes to commit (maybe already removed)" -ForegroundColor Yellow
} else {
    Write-Host "Committed removal of sensitive files" -ForegroundColor Green
}

Write-Host "Pushing to origin/$branch..." -ForegroundColor Cyan
& git push origin $branch
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Done. Next step: rotate your Supabase keys immediately (see DEPLOYMENT.md)." -ForegroundColor Green
    Write-Host "If you want to permanently remove the files from the repo history, run purge-history.ps1 or purge-history.sh (careful: destructive)." -ForegroundColor Yellow
} else {
    Write-Host "Push failed — please check your network/auth and try pushing manually." -ForegroundColor Red
}