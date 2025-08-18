---
date: "2025-08-18T20-22-57Z"
tool: "Claude Code"
title: "M1: telemetry pkg + API correlation"
branch: "feat/playwright-ts-setup"
base_commit: "b5a1593"
---

# Prompt
```
Create minimal TypeScript code for:
1) packages/telemetry (ESM):
   - index.ts exports:
     - type TelemetryEvent = {
         ts:number; level:'info'|'warn'|'error';
         env:string; release:string; route?:string; status?:number;
         request_id?:string; error_code?:string; error?:string; details?:Record<string,unknown>;
       }
     - function initTelemetry(opts:{env:string;release:string;service:string}): void
     - function emitEvent(evt:TelemetryEvent): void
   - Keep it framework-agnostic, no external deps except types.
   - Add package.json (name:"telemetry", type:"module", main:"dist/index.js", types:"dist/index.d.ts", scripts:{build:"tsc -p ."}), tsconfig.json (strict).
2) apps/api (Express ESM):
   - server.ts with:
     - correlate middleware: read incoming 'x-request-id' or generate UUID, store in res.locals.requestId, set header on response.
     - POST /telemetry: validate basic shape (required: ts, level, env, release), add request_id if missing, log one line JSON including request_id.
     - GET /healthz: 200 ok.
   - package.json (type:"module", scripts:{dev:"tsx watch server.ts", start:"node dist/server.js", build:"tsc -p ."}), tsconfig.json.
   - Use lightweight uuid (e.g. crypto.randomUUID with fallback).
   - No DB; logging to stdout only.
3) tests for API using supertest:
   - test that a request without x-request-id gets one assigned and echoed.
   - test that POST /telemetry with x-request-id is accepted (204/200) and response echoes the same x-request-id.
4) Add minimal README snippets in both folders explaining purpose.
5) Nothing destructive; files only in packages/telemetry and apps/api; no Docker.

Assume monorepo root uses pnpm. Provide any pnpm add commands needed. Keep code small and compile-clean.
```

# Assistant output (optional)
```

```

# Notes
- [ ] Human-reviewed
- [ ] Tested in CI
