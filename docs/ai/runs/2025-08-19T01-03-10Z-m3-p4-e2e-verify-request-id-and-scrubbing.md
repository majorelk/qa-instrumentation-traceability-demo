---
date: "2025-08-19T01-03-10Z"
tool: "Claude Code"
title: "M3/P4 E2E: verify request_id and scrubbing"
branch: "feat/m3-telemetry-schema-scrubber-beacons"
base_commit: "aed707a"
---

# Prompt
```
Task (tests/e2e)
- Add/extend a Playwright test that:
  1) Triggers a failing request from the UI (use existing fail action if present; otherwise add the minimal UI trigger and update the test accordingly).
  2) Calls /debug/telemetry/last and asserts:
     - request_id matches the one from the failed request,
     - level === 'error',
     - route/status present,
     - no raw emails/tokens (scrubbed).
- Keep webServer settings (USE_DEV_SERVER toggle) working.

Output:
- Diffs for tests/e2e/** (and minimal UI diff if needed).
- Commit message:
  test(e2e): prove request_id correlation + scrubbing via /debug/telemetry/last [AI-assisted-by: Claude Code]
```

# Assistant output (optional)
```

```

# Notes
- [ ] Human-reviewed
- [ ] Tested in CI
