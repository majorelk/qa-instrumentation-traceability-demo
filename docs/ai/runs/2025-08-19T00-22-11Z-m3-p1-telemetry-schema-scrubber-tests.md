---
date: "2025-08-19T00-22-11Z"
tool: "Claude Code"
title: "M3/P1 telemetry schema + scrubber + tests"
branch: "feat/m3-telemetry-schema-scrubber-beacons"
base_commit: "912e907"
---

# Prompt
```
Task (packages/telemetry only)
- Add "zod" dep; devDeps "vitest", "@types/node" if missing.
- Export TelemetryEventSchema (zod) with fields:
  { ts:number, level:'info'|'warn'|'error', env:string, release:string,
    route?:string, status?:number, request_id?:string,
    error_code?:string, error?:string, details?:Record<string, unknown> }
- Export type TelemetryEvent.
- Implement scrub(value) with:
  - email redaction (***@domain),
  - token-ish redaction ([REDACTED]) for long hex/base64-like,
  - redact values for keys containing password/secret/token/auth/key,
  - truncate long strings >500 chars.
  - handle arrays, circular refs.
- Add vitest tests for scrub().
- Keep TS strict, ESM exports intact.

Output:
- Diffs (unified) for only packages/telemetry/**.
- Commands for me (pnpm add …).
- One commit message:
  feat(telemetry): zod schema + scrubber + tests [AI-assisted-by: Claude Code]
```

# Assistant output (optional)
```

```

# Notes
- [ ] Human-reviewed
- [ ] Tested in CI
