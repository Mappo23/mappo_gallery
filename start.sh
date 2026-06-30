#!/usr/bin/env bash
# Sit down to work: pull the latest, then serve locally.
set -e
cd "$(dirname "$0")"

echo "↓ pulling latest…"
git pull --rebase --autostash

echo "▶ serving on http://localhost:${PORT:-8000}  (Ctrl+C to stop)"
python3 serve.py
