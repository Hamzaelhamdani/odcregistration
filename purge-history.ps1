<# purge-history.ps1
  Script to purge `.env` and env.js from git history using git-filter-repo.
  This rewrites history and is destructive. All collaborators must re-clone after.
  Run this from PowerShell in the repo root.

  Requirements: git-filter-repo must be installed and available on PATH.
  On Windows you can install it via pip: pip install git-filter-repo
#>

param(
    [string]$remote = 'origin'
)

Write-Host "*** This will rewrite repository history. Make sure you have a backup or you understand the consequences. ***" -ForegroundColor Red
$confirm = Read-Host "Type YES to continue"
if ($confirm -ne 'YES') { Write-Host 'Aborted'; exit 1 }

# Ensure a clean working tree
$st = git status --porcelain
if ($st) { Write-Host "Working tree not clean - commit/stash first"; exit 1 }

# Run git-filter-repo to remove paths
git filter-repo --path .env --path env.js --invert-paths

# Housekeeping
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host "Force-pushing cleaned history to $remote (this will replace remote history)." -ForegroundColor Yellow
Write-Host "All collaborators will need to re-clone after this." -ForegroundColor Yellow
$pushConfirm = Read-Host "Type PUSH to force-push cleaned history to $remote"
if ($pushConfirm -eq 'PUSH') {
    git push $remote --force --all
    git push $remote --force --tags
    Write-Host "✅ History purged and pushed. Inform collaborators to re-clone." -ForegroundColor Green
} else {
    Write-Host "Skipped push. You can push manually when ready." -ForegroundColor Yellow
}
