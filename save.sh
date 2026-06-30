#!/usr/bin/env bash
# Before you leave a device: commit & push everything.
set -e
cd "$(dirname "$0")"

git add -A
if git diff --cached --quiet; then
  echo "nothing to save — working tree is clean"
  exit 0
fi

git commit -m "${1:-wip $(date '+%Y-%m-%d %H:%M')}"
git push
echo "✓ saved & pushed"
