#!/usr/bin/env bash
# scripts/status.sh
set -Eeuo pipefail

# Always run from repo root if inside a git repo
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

ok(){ printf "✅ %s\n" "$1"; }
no(){ printf "⬜ %s\n" "$1"; }

echo "== Repo status =="
[[ -f README.md ]]                  && ok "README.md"                    || no "README.md"
[[ -f CLAUDE.md ]]                  && ok "CLAUDE.md"                    || no "CLAUDE.md"
[[ -d apps/api ]]                   && ok "apps/api/"                    || no "apps/api/"
[[ -d apps/web ]]                   && ok "apps/web/"                    || no "apps/web/"
[[ -d packages/telemetry ]]         && ok "packages/telemetry/"          || no "packages/telemetry/"
[[ -d infra ]]                      && ok "infra/"                       || no "infra/"
[[ -d external-mocks ]]             && ok "external-mocks/"              || no "external-mocks/"

echo
echo "== External mocks =="
[[ -f external-mocks/jira/server.mjs ]]     && ok "Jira mock: server.mjs"     || no "Jira mock: server.mjs"
[[ -f external-mocks/jira/Dockerfile ]]     && ok "Jira mock: Dockerfile"     || no "Jira mock: Dockerfile"
[[ -f external-mocks/jira/package.json ]]   && ok "Jira mock: package.json"   || no "Jira mock: package.json"
[[ -d external-mocks/jira/logs ]]           && ok "Jira mock: logs/"          || no "Jira mock: logs/"
[[ -d external-mocks/jira/fixtures ]]       && ok "Jira mock: fixtures/"      || no "Jira mock: fixtures/"

echo
echo "== Tests & CI =="
TESTS=$(ls -1 tests/e2e/tests/*.spec.ts 2>/dev/null | wc -l | xargs || echo 0)
[[ -f tests/e2e/playwright.config.ts ]]     && ok "Playwright config"          || no "Playwright config"
[[ "$TESTS" != "0" ]]                       && ok "Playwright tests: $TESTS"   || no "Playwright tests: 0"
[[ -f .github/workflows/ci.yml ]]           && ok "GitHub Actions workflow"    || no "GitHub Actions workflow"

echo
echo "== Runtime checks (local) =="
if curl -fsS http://127.0.0.1:8081/_admin/requests >/dev/null 2>&1; then
  ok "Jira mock is RUNNING on :8081"
else
  no "Jira mock not reachable on :8081"
fi

echo
echo "== Suggested next step =="
if [[ ! -f tests/e2e/playwright.config.ts || "$TESTS" == "0" ]]; then
  echo "Add Playwright config + a simple test (e.g., POST to Jira mock)."
elif [[ ! -f .github/workflows/ci.yml ]]; then
  echo "Add CI workflow to run Playwright in GitHub Actions."
elif ! curl -fsS http://127.0.0.1:8081/_admin/requests >/dev/null 2>&1; then
  echo "Start the Jira mock locally (docker run -p 8081:8081 jira-mock) and run the test."
else
  echo "Proceed to wire web/api + telemetry and write the first real e2e."
fi

