#!/usr/bin/env bash
# scripts/status.sh
# Read-only health & readiness checks for the repo.
set -Eeuo pipefail

# Always run from repo root if inside a git repo
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

ok()   { printf "✅ %s\n" "$1"; }
no()   { printf "⬜ %s\n" "$1"; }
warn() { printf "⚠️  %s\n" "$1"; }
info() { printf "ℹ️  %s\n" "$1"; }

hr() { printf "\n"; }

# ---------- TOOLS & VERSIONS ----------
echo "== Tooling =="
if command -v node >/dev/null 2>&1; then
  NV="$(node -v)"
  ok "node $NV"
  MAJOR="$(echo "$NV" | sed -E 's/^v([0-9]+).*/\1/')"
  if [ "${MAJOR:-0}" -lt 18 ]; then
    warn "Node >= 18 recommended (20+ ideal)"
  fi
else
  no "node (install Node 20+)"
fi

if command -v pnpm >/dev/null 2>&1; then
  ok "pnpm $(pnpm -v)"
else
  if command -v corepack >/dev/null 2>&1; then
    warn "pnpm not found; you can enable via: corepack enable && corepack prepare pnpm@9 --activate"
  else
    no "pnpm (install or enable via corepack)"
  fi
fi

if command -v curl >/dev/null 2>&1; then
  ok "curl $(curl --version | head -n1)"
else
  no "curl (required for health checks)"
fi
hr

# ---------- REPO STRUCTURE ----------
echo "== Repo structure =="
[[ -f README.md ]]                   && ok "README.md"                    || no "README.md"
[[ -f CLAUDE.md ]]                   && ok "CLAUDE.md"                    || no "CLAUDE.md"
[[ -f OPENAI.md ]]                   && ok "OPENAI.md"                    || no "OPENAI.md"
[[ -f AI_USAGE.md ]]                 && ok "AI_USAGE.md"                  || no "AI_USAGE.md"
[[ -f bootstrap.sh ]]                && ok "bootstrap.sh"                 || no "bootstrap.sh"
[[ -d apps/api ]]                    && ok "apps/api/"                    || no "apps/api/"
[[ -d apps/web ]]                    && ok "apps/web/"                    || no "apps/web/"
[[ -d packages/telemetry ]]          && ok "packages/telemetry/"          || no "packages/telemetry/"
[[ -d infra ]]                       && ok "infra/"                       || no "infra/"
[[ -d external-mocks ]]              && ok "external-mocks/"              || no "external-mocks/"
hr

# ---------- EXTERNAL MOCKS (Jira) ----------
echo "== External mocks: Jira =="
[[ -f external-mocks/jira/server.mjs ]]     && ok "server.mjs"             || no "server.mjs"
[[ -f external-mocks/jira/package.json ]]   && ok "package.json"           || no "package.json"
[[ -f external-mocks/jira/Dockerfile ]]     && ok "Dockerfile"             || no "Dockerfile"
[[ -d external-mocks/jira/logs ]]           && ok "logs/"                  || no "logs/"
[[ -d external-mocks/jira/fixtures ]]       && ok "fixtures/"              || no "fixtures/"
[[ -d external-mocks/jira/node_modules ]]   && ok "node_modules (installed)" || no "node_modules (run: npm ci in external-mocks/jira)"

# Runtime health + PID hint
JIRA_URL="http://127.0.0.1:8081/_admin/requests"
if curl -fsS "$JIRA_URL" >/dev/null 2>&1; then
  ok "Jira mock is RUNNING on :8081"
else
  no "Jira mock not reachable on :8081"
fi
if [[ -f /tmp/jira_mock.pid ]]; then
  PID="$(cat /tmp/jira_mock.pid || true)"
  if [[ -n "${PID:-}" ]] && ps -p "$PID" >/dev/null 2>&1; then
    info "Found PID file: /tmp/jira_mock.pid (pid=$PID)"
  else
    warn "Stale PID file at /tmp/jira_mock.pid"
  fi
fi
hr

# ---------- TESTS & CI ----------
echo "== Tests & CI =="
TEST_DIR="tests/e2e"
PLAY_CFG="$TEST_DIR/playwright.config.ts"
PLAY_PKG="$TEST_DIR/package.json"
PLAY_TS="$TEST_DIR/tsconfig.json"
REPORT="$TEST_DIR/playwright-report/index.html"

[[ -f "$PLAY_CFG" ]]                 && ok "Playwright config"             || no "Playwright config"
[[ -f "$PLAY_PKG" ]]                 && ok "tests/e2e/package.json"        || no "tests/e2e/package.json"
[[ -f "$PLAY_TS" ]]                  && ok "tests/e2e/tsconfig.json"       || no "tests/e2e/tsconfig.json"

TEST_COUNT=$(ls -1 "$TEST_DIR"/tests/*.spec.ts 2>/dev/null | wc -l | xargs || echo 0)
if [[ "${TEST_COUNT:-0}" != "0" ]]; then
  ok "Playwright tests: $TEST_COUNT"
else
  no "Playwright tests: 0"
fi

# Deps check
if [[ -d "$TEST_DIR/node_modules/@playwright/test" ]]; then
  ok "@playwright/test installed"
else
  no "@playwright/test not installed"
fi

# CLI availability
if command -v pnpm >/dev/null 2>&1 &

