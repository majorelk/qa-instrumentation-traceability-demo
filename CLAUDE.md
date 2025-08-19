# Mission

Demonstrate app-layer instrumentation & traceability:

Correlate requests with `x-request-id` end-to-end (web → api).

Emit structured error/event telemetry with a stable schema.

Produce reliable Playwright artifacts (trace, screenshot, video) on failures.

# Rules of engagement

Keep diffs small and include/adjust tests with every change.

Never commit secrets/PII; scrub sensitive data in logs/payloads.

Prefer typed boundaries (TypeScript) and narrow interfaces.

Treat failing E2E as a product signal: fix or document flakiness with a ticket.

# Telemetry/Event schema (minimum)
```json
{
  "ts": 0,
  "level": "error",
  "env": "development",
  "release": "git_sha_or_version",
  "request_id": "uuid-optional",
  "route": "/client/route-or-api/endpoint",
  "status": 500,
  "error_code": "HTTP_ERROR",
  "error": "message or scrubbed stack"
}
```
# Web (React)
- On non-OK fetch: `reportError(err, { endpoint, status, request_id })`.
- Generate a `request_id` per UI action; send as `x-request-id`.
- Prefer `navigator.sendBeacon` (fallback to `fetch`).

# API (Express)

- Middleware: accept or assign `x-request-id`; echo back in response.
- `/telemetry` accepts structured events; validate, log, and (in prod) persist.
- Log lines MUST include `request_id` when present.

# Testing (Playwright)

- `trace: "on-first-retry"`, `screenshot: "only-on-failure"`, `video: "retain-on-failure"`.
- Each failing test must produce artifacts and (when applicable) expose a `request_id`.
- Add HAR selectively when diagnosing network issues.

# CI expectations
- Lint, typecheck, unit, and Playwright E2E jobs.
- Upload Playwright report + traces as build artifacts.
- Optionally auto-file issues on consistent failures with artifact links.

# Definition of done
- Request correlation verified across web/api logs.
- Telemetry emitted with required fields.
- E2E proves artifacts exist on failure and can be tied back via `request_id`.
