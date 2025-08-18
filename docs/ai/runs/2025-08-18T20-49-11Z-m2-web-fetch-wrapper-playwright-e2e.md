---
date: "2025-08-18T20-49-11Z"
tool: "Claude Code"
title: "M2: web fetch wrapper + Playwright E2E"
branch: "feat/playwright-ts-setup"
base_commit: "52358b8"
---

# Prompt
```
Add Milestone 2:

1) apps/web (Vite + React, TypeScript, ESM)
   - Minimal page with "Trigger API error" button.
   - fetch wrapper that generates per-action request_id (crypto.randomUUID fallback),
     sets 'x-request-id' on every request, and on !response.ok POSTs a TelemetryEvent
     to /telemetry with: { ts:Date.now(), level:'error', env:'development', release:'local',
     route, status, request_id, error_code:'API_ERROR', error: <message> }.
   - initTelemetry({ env:'development', release:'local', service:'web' }).
   - After each action, set (window as any).__lastReqId = request_id for tests.

2) apps/api (Express)
   - Add GET /api/fail that responds 500, echoing any incoming x-request-id header.
   - Add GET /debug/last-event that returns the last TelemetryEvent received by POST /telemetry
     (store it in-memory; dev/test only).

3) tests/e2e (Playwright TypeScript)
   - If tests/e2e not present, scaffold package.json (scripts test/test:ui/report), tsconfig.json,
     playwright.config.ts with: html reporter to tests/e2e/playwright-report, trace:'on-first-retry',
     screenshot:'only-on-failure', video:'retain-on-failure', testDir:'tests'.
   - Add tests/e2e/tests/traceability.spec.ts:
     * navigate to the web app (localhost:5173 or vite preview script),
     * click the "Trigger API error" button (expect network fail),
     * read window.__lastReqId,
     * fetch /debug/last-event and assert request_id equals the UI value.

4) Provide pnpm commands to install any missing deps (react, react-dom, vite, @vitejs/plugin-react, @types/node, @playwright/test etc.), and scripts to run web dev/preview, API dev.

5) Keep changes minimal, TypeScript strict, ESM only. Return only the files/diffs to add/edit.
```

# Assistant output (optional)
```

```

# Notes
- [ ] Human-reviewed
- [ ] Tested in CI
