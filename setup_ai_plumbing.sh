#!/usr/bin/env bash
# setup_ai_plumbing.sh
# Repo-level “AI usage” plumbing: folders, policies, prompt logger, commit hook, VS Code task.
# Idempotent: re-runnable. Use FORCE=1 to overwrite existing files.
set -Eeuo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

overwrite() { [[ "${FORCE:-0}" == "1" ]]; }
note() { printf "• %s\n" "$1"; }
ok()   { printf "✅ %s\n" "$1"; }
skip() { printf "⏭️  %s (exists; use FORCE=1 to overwrite)\n" "$1"; }

mkdir -p docs/ai/{prompts,runs} scripts .githooks .vscode

# ---------- OPENAI.md ----------
TARGET="OPENAI.md"
if [[ ! -f "$TARGET" || $(overwrite && echo 1) ]]; then
  cat > "$TARGET" <<'MD'
# Mission
Same as CLAUDE.md: instrument the application layer for reportability & traceability.

# Guardrails for Copilot / OpenAI tools
- Keep diffs small and type-safe (TypeScript) with tests included.
- No secrets/PII. Scrub logs and payloads.
- Prefer minimal, composable utilities; avoid dead code.
- If a change impacts tests/CI, update them in the same PR.

# When generating code
- Include short JSDoc on public functions.
- Use stable interfaces and narrow types.
- Return structured errors (never swallow).
- When significant, add a header comment linking to the prompt log in `docs/ai/runs/`.
MD
  ok "Wrote $TARGET"
else
  skip "Keep $TARGET"
fi

# ---------- AI_USAGE.md ----------
TARGET="AI_USAGE.md"
if [[ ! -f "$TARGET" || $(overwrite && echo 1) ]]; then
  cat > "$TARGET" <<'MD'
# AI Usage in This Repo

We use **Claude Code** for scaffolding/long-form changes and **GitHub Copilot** for small completions/refactors.

## Guardrails
- All AI-assisted changes:
  - go via PR on a feature branch,
  - include tests/CI updates when needed,
  - reference a prompt log in `docs/ai/runs/`.

## Storage
- Planned prompts/specs → `docs/ai/prompts/`
- Actual prompts (and optional outputs) → `docs/ai/runs/`
MD
  ok "Wrote $TARGET"
else
  skip "Keep $TARGET"
fi

# ---------- scripts/ai_log.sh ----------
TARGET="scripts/ai_log.sh"
if [[ ! -f "$TARGET" || $(overwrite && echo 1) ]]; then
  cat > "$TARGET" <<'BASH'
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
BASH
  chmod +x "$TARGET"
  ok "Wrote $TARGET"
else
  skip "Keep $TARGET"
fi

# ---------- .githooks/commit-msg ----------
TARGET=".githooks/commit-msg"
if [[ ! -f "$TARGET" || $(overwrite && echo 1) ]]; then
  cat > "$TARGET" <<'HOOK'
#!/usr/bin/env bash
# Warn if commit mentions AI-assisted but doesn't include a prompt log.
set -Eeuo pipefail
MSG_FILE="$1"
if grep -qi 'AI-assisted' "$MSG_FILE"; then
  if ! git diff --cached --name-only | grep -q '^docs/ai/runs/'; then
    echo "⚠️  Mentioned AI-assisted but no docs/ai/runs/ log in this commit." >&2
    echo "   Tip: AI_TOOL='Claude Code' TITLE='bootstrap' ./scripts/ai_log.sh" >&2
  fi
fi
HOOK
  chmod +x "$TARGET"
  git config core.hooksPath .githooks
  ok "Wrote $TARGET and configured core.hooksPath"
else
  skip "Keep $TARGET"
fi

# ---------- .vscode/tasks.json ----------
TARGET=".vscode/tasks.json"
if [[ ! -f "$TARGET" || $(overwrite && echo 1) ]]; then
  cat > "$TARGET" <<'JSON'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "AI: Save prompt from clipboard",
      "type": "shell",
      "command": "AI_TOOL='Claude Code' TITLE='prompt' ./scripts/ai_log.sh",
      "problemMatcher": []
    }
  ]
}
JSON
  ok "Wrote $TARGET"
else
  skip "Keep $TARGET"
fi

echo
echo "Summary:"
note "Folders ensured: docs/ai/{prompts,runs}, scripts, .githooks, .vscode"
note "Files: OPENAI.md, AI_USAGE.md, scripts/ai_log.sh, .githooks/commit-msg, .vscode/tasks.json"
echo
echo "Next steps:"
echo "  1) Save a prompt log:"
echo "     AI_TOOL='Claude Code' TITLE='bootstrap script' ./scripts/ai_log.sh <<'PROMPT'"
echo "     (your prompt here)"
echo "PROMPT"
echo "  2) Commit with an AI-assisted message:"
echo "     git add -A && git commit -m \"chore(ai-assisted): add AI plumbing\""

