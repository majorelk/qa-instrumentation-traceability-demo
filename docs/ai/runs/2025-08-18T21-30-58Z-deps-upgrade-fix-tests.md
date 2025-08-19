---
date: "2025-08-18T21-30-58Z"
tool: "Claude Code"
title: "Deps upgrade + fix tests"
branch: "chore/deps-upgrade-and-test-fixes"
base_commit: "a053e06"
---

# Prompt
```
Goal: Upgrade workspace dependencies to current stable versions and fix any resulting test/build issues.

Constraints:
- PNPM monorepo; Node 20; ESM everywhere; TS strict.
- Keep React 18 (avoid React 19 preview/RC). Keep Express 4.x.
- Update dev tooling: TypeScript, Vite + @vitejs/plugin-react, Vitest, tsx, @types/*, @playwright/test.
- Ensure Playwright config works locally *and* in CI; eliminate port conflicts.
- No docker changes in this PR.

Required changes:
1) Run a dependency audit across all packages and propose upgrades (respecting stable majors unless release notes are trivial).
   - packages: apps/web, apps/api, tests/e2e, packages/telemetry, external-mocks/jira.
2) Apply upgrades; adjust tsconfigs if needed (no skipLibCheck).
3) Playwright:
   - Keep the “dev vs preview” toggle via USE_DEV_SERVER env var.
   - Default local runs to dev (no build), CI to preview (requires build).
   - Ensure only *one* process owns :5173 and :3000 to avoid EADDRINUSE.
4) Express typing: ensure exported `app: Express` and clean TS build.
5) Telemetry package:
   - Confirm `"exports"` maps to dist and `"types"` are correct.
   - Build script stays `tsc -p .`.
6) tests/e2e:
   - Make `pretest` build web *only when* preview is used.
   - Ensure playwright-report goes to `tests/e2e/playwright-report`.
7) Output: Return only file diffs (no shell commands). Split large changes by area (api/web/e2e/telemetry) in separate commits with clear messages. Note which changes are AI-assisted in commit body.

Acceptance:
- `pnpm install` clean at repo root.
- `pnpm -r build` succeeds.
- Local fast path: `pnpm -C apps/api dev` + `USE_DEV_SERVER=1 pnpm -C tests/e2e test` passes.
- Prod-like path: `pnpm -C apps/web build` + `pnpm -C apps/api dev` + `pnpm -C tests/e2e test` passes.
```

# Assistant output (optional)
```

```

# Notes
- [ ] Human-reviewed
- [ ] Tested in CI
