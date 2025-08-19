---
date: "2025-08-19T00-39-37Z"
tool: "Claude Code"
title: "M3/P2 API /telemetry with validation/scrub + debug endpoint"
branch: "feat/m3-telemetry-schema-scrubber-beacons"
base_commit: "09c911a"
---

# Prompt
```
Task (apps/api)
- In POST /telemetry:
  - Validate body via packages/telemetry TelemetryEventSchema.
  - Ensure request_id from correlation middleware; if missing, set.
  - Scrub details; append one-line JSON to logs/telemetry.ndjson; 204 on success.
  - 400 with a small code + echo x-request-id on validation errors.
- Add GET /debug/telemetry/last returning the last accepted (scrubbed) event from memory.
- Ensure logs/ is gitignored if not already.

Output:
- Diffs for apps/api/** (and .gitignore if needed).
- Any commands for me (none expected).
- Commit message:
  feat(api): /telemetry validates/scrubs/logs; /debug/telemetry/last [AI-assisted-by: Claude Code]
```

# Assistant output (optional)
```

```

# Notes
- [ ] Human-reviewed
- [ ] Tested in CI
