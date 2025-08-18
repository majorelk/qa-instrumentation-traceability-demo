#!/usr/bin/env bash
# Saves an AI prompt (from stdin or clipboard) to docs/ai/runs/<timestamp>-<slug>.md
set -Eeuo pipefail
AI_TOOL="${AI_TOOL:-${1:-unknown}}"
TITLE="${TITLE:-${2:-untitled}}"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
OUT_DIR="$ROOT/docs/ai/runs"
mkdir -p "$OUT_DIR"

read_from_clipboard() {
  if command -v pbpaste >/dev/null 2>&1; then pbpaste
  elif command -v wl-paste >/dev/null 2>&1; then wl-paste
  elif command -v xclip >/dev/null 2>&1; then xclip -selection clipboard -o
  elif command -v powershell.exe >/dev/null 2>&1; then powershell.exe -Command 'Get-Clipboard' | tr -d $'\r'
  else echo ""; fi
}

CONTENT="$(cat || true)"
if [[ -z "$CONTENT" ]]; then CONTENT="$(read_from_clipboard)"; fi
if [[ -z "$CONTENT" ]]; then
  echo "No prompt found (pipe content or copy to clipboard)." >&2
  exit 1
fi

slug(){ echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g;s/^-+|-+$//g' | cut -c1-60; }
STAMP="$(date -u +'%Y-%m-%dT%H-%M-%SZ')"
FILE="$OUT_DIR/${STAMP}-$(slug "$TITLE").md"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
SHA="$(git rev-parse --short HEAD 2>/dev/null || echo 'none')"

cat > "$FILE" <<EOF
---
date: "$STAMP"
tool: "$AI_TOOL"
title: "$TITLE"
branch: "$BRANCH"
base_commit: "$SHA"
---

# Prompt
\`\`\`
$CONTENT
\`\`\`

# Assistant output (optional)
\`\`\`

\`\`\`

# Notes
- [ ] Human-reviewed
- [ ] Tested in CI
EOF

echo "Saved: $FILE"
