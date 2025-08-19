---
date: "2025-08-19T00-47-53Z"
tool: "Claude Code"
title: "M3/P3 web error beacon via fetch-wrapper"
branch: "feat/m3-telemetry-schema-scrubber-beacons"
base_commit: "0c5e92c"
---

# Prompt
```
Task (apps/web)
- In src/lib/fetch-wrapper.ts:
  - On non-OK responses, construct a TelemetryEvent using the same request_id used on the request, and send to /telemetry.
  - Prefer navigator.sendBeacon(JSON), fallback to fetch POST.
  - Non-blocking, ignore beacon failures.
- Ensure imports from telemetry are type-only where appropriate.

Output:
- Diffs for apps/web/** only.
- Commit message:
  feat(web): send telemetry beacon on non-OK responses [AI-assisted-by: Claude Code]
```

# Assistant output (optional)
```

```

# Notes
- [ ] Human-reviewed
- [ ] Tested in CI
