#!/usr/bin/env bash
# purge-history.sh - helper for Unix-like shells to purge .env and env.js via git-filter-repo or BFG
# WARNING: destructive. Use only if you understand consequences.

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo not found. Install it (pip install git-filter-repo) or use BFG Repo-Cleaner." >&2
  exit 1
fi

echo "Removing .env and env.js from history..."

git filter-repo --path .env --path env.js --invert-paths

git reflog expire --expire=now --all
 git gc --prune=now --aggressive

echo "Force push to origin (you will replace remote history)."
read -p "Type PUSH to force-push cleaned history: " ans
if [ "$ans" = "PUSH" ]; then
  git push origin --force --all
  git push origin --force --tags
  echo "Done. Inform collaborators to re-clone."
else
  echo "Skipped push. You can push manually when ready."
fi
