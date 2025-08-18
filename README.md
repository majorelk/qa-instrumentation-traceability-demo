# QA Instrumentation & Traceability Demo
[![CI](https://github.com/majorelk/qa-instrumentation-traceability-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/majorelk/qa-instrumentation-traceability-demo/actions/workflows/ci.yml)

A minimal monorepo showing how to **instrument the application layer** for **bug reportability** and **traceability**, validated with **Playwright** end-to-end tests.

## What this demonstrates
- **Request correlation** with `x-request-id` from Web → API.
- **Structured telemetry** (small `telemetry` package) with a consistent error/event schema.
- **Deterministic E2E artifacts** (trace, screenshots, video) on failure.
- CI-friendly layout you can drop into GitHub Actions.

## Repo layout
```text
apps/
  api/        # Express API (correlation id, telemetry sink)
  web/        # Vite/React app (client-side reporting)
packages/
  telemetry/  # TS utils to emit structured error/trace events
tests/
  e2e/        # Playwright tests + config
infra/        # docker-compose, env, etc.
```
Quick start (local)

Requires: Docker Desktop (WSL2 integration), Node 20+, pnpm 9+, git.
```

# optional bootstrap (if you’re using the one-shot script)
# FORCE_CLEAN=1 PARENT_DIR=~/portfolio ./bootstrap_verbose.sh

# or wire things up step-by-step as you build the demo
```

This repo shows where to instrument (client + server), which fields matter (`request_id`, endpoint/route, status, env, release, error code/stack), and how to make failures actionable via Playwright artifacts that link back to correlated logs.
