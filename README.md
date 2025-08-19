# QA Instrumentation & Traceability Demo

[![CI](https://github.com/majorelk/qa-instrumentation-traceability-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/majorelk/qa-instrumentation-traceability-demo/actions/workflows/ci.yml)

A minimal monorepo demonstrating **application-layer instrumentation** for **bug reportability** and **traceability**, validated with **Playwright** end-to-end tests.

## What this demonstrates

- **Request correlation** with `x-request-id` from Web → API
- **Structured telemetry** with Zod schema validation and data scrubbing
- **Deterministic E2E artifacts** (trace, screenshots, video) on failure
- **End-to-end traceability** proving request correlation works
- **CI-friendly** layout for GitHub Actions

## Architecture

```text
apps/
  api/        # Express 4.x API (correlation middleware, telemetry sink, debug endpoints)
  web/        # Vite 7 + React 18 app (fetch wrapper, telemetry emission)
packages/
  telemetry/  # TypeScript utilities with Zod schema validation and data scrubbing
tests/
  e2e/        # Playwright tests with trace/screenshot/video artifacts
external-mocks/
  jira/       # Mock Jira API for testing
```

## Tech Stack

- **Node.js 20+** with **pnpm 9+** monorepo
- **TypeScript 5.9** strict mode, ESM everywhere
- **React 18** with **Vite 7** (dev server + build)
- **Express 4.x** API server with middleware
- **Playwright** for E2E testing with artifacts
- **Vitest 3** for unit testing

## Quick Start

### Prerequisites

- Node.js 20+ 
- pnpm 9+
- Git

### Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd qa-instrumentation-traceability-demo
pnpm install

# Build all packages
pnpm -r build
```

### Development Workflow

**Option 1: Fast Development (recommended for local development)**
```bash
# Terminal 1: Start API server
pnpm -C apps/api dev

# Terminal 2: Start web app with proxy to API
pnpm -C apps/web dev

# Terminal 3: Run E2E tests (no build needed)
USE_DEV_SERVER=1 pnpm -C tests/e2e test
```

**Option 2: Production-like Testing**
```bash
# Terminal 1: Start API server
pnpm -C apps/api dev

# Terminal 2: Build and run E2E tests (builds web app first)
pnpm -C tests/e2e test
```

### Bootstrap Script (One-shot Setup)

For a complete automated setup including Jira mock and Playwright browsers:

```bash
chmod +x bootstrap.sh
./bootstrap.sh
```

## Key Features

### Request Correlation

Every request gets a unique `x-request-id` that flows through:
1. **Web app** generates UUID for each user action
2. **API server** accepts or assigns request ID via middleware  
3. **Telemetry events** include the request ID for correlation
4. **E2E tests** verify end-to-end traceability

### Automatic Telemetry Beacons

The web app automatically sends telemetry for failed requests:
- **Non-OK HTTP responses** (4xx/5xx) trigger telemetry events
- **Network errors** are captured and reported
- Uses **navigator.sendBeacon** for reliability (fallback to fetch)
- **Non-blocking** - never affects user experience
- **Error categorization** - HTTP_ERROR vs NETWORK_ERROR

### Telemetry Schema

The telemetry package provides **Zod schema validation** and **data scrubbing** for safe logging:

```typescript
// Zod schema for runtime validation
import { TelemetryEventSchema, scrub, type TelemetryEvent } from 'telemetry';

// Type-safe event structure
interface TelemetryEvent {
  ts: number;                    // Timestamp
  level: 'info' | 'warn' | 'error';
  env: string;                   // Environment (development, staging, prod)
  release: string;               // Version/release identifier
  route?: string;                // API endpoint or page route
  status?: number;               // HTTP status code
  request_id?: string;           // Correlation identifier
  error_code?: string;           // Application error code
  error?: string;                // Error message/stack
  details?: Record<string, unknown>; // Additional context
}

// Safe data scrubbing - removes emails, tokens, passwords
const scrubbedData = scrub(sensitiveUserInput);
```

### Vite Proxy Configuration

The web app automatically proxies API calls:
- `/api/*` → `http://localhost:3000`
- `/telemetry` → `http://localhost:3000`
- `/debug/*` → `http://localhost:3000`

This works in both dev and preview modes, eliminating CORS issues.

### Playwright Testing

E2E tests provide comprehensive validation with two focused test scenarios:

**Test 1: End-to-End Request Correlation**
1. **Trigger error** by clicking "Trigger API Error" button
2. **Capture request ID** from `window.__lastReqId`
3. **Verify telemetry** via `/debug/last-event` endpoint
4. **Assert correlation** between UI request and logged telemetry

**Test 2: API Security and Data Scrubbing**
1. **Send realistic sensitive data** to telemetry API
2. **Verify data scrubbing** - emails redacted, tokens removed
3. **Assert normal data preserved** - no over-scrubbing
4. **Validate security contract** - no sensitive data leakage

Test artifacts on failure:
- **Screenshots** of the failing state
- **Video** recording of the test execution
- **Traces** with network requests and DOM interactions

## API Endpoints

### Production Endpoints
- `GET /healthz` - Health check
- `POST /telemetry` - Accept telemetry events
- `GET /api/fail` - Intentional 500 error for testing

### Development/Test Endpoints
- `GET /debug/last-event` - Returns last received telemetry event

## Environment Variables

- `USE_DEV_SERVER=1` - Use Vite dev server instead of preview (faster, no build)
- `NODE_ENV` - Environment name (development, test, production)
- `RELEASE` - Release version identifier
- `PORT` - API server port (default: 3000)

## Testing Commands

```bash
# Unit tests (API)
pnpm -C apps/api test

# Unit tests (telemetry package)
pnpm -C packages/telemetry test

# E2E tests (fast dev mode)
USE_DEV_SERVER=1 pnpm -C tests/e2e test

# E2E tests (production-like)
pnpm -C tests/e2e test

# E2E with UI mode
pnpm -C tests/e2e test:ui

# View test report
pnpm -C tests/e2e report
```

## CI/CD Integration

The setup is optimized for CI environments:
- **Deterministic builds** with locked dependencies
- **Artifact collection** for failed tests
- **Port conflict prevention** with `strictPort: true`
- **Timeout management** for reliable test execution

Example GitHub Actions workflow structure:
```yaml
- name: Install dependencies
  run: pnpm install

- name: Build packages  
  run: pnpm -r build

- name: Run API tests
  run: pnpm -C apps/api test

- name: Run E2E tests
  run: pnpm -C tests/e2e test

- name: Upload Playwright report
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: tests/e2e/playwright-report/
```

## Troubleshooting

### Port Conflicts
If you get `EADDRINUSE` errors:
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Kill processes on port 5173  
lsof -ti:5173 | xargs kill -9
```

### Build Issues
```bash
# Clean and reinstall dependencies
rm -rf node_modules **/node_modules pnpm-lock.yaml
pnpm install

# Rebuild all packages
pnpm -r build
```

### Test Failures
- Check that API server is running on port 3000
- Verify Vite proxy configuration is working
- Ensure Playwright browsers are installed: `pnpm -C tests/e2e exec playwright install --with-deps`

## Contributing

When making changes:
1. Keep diffs small and include/adjust tests
2. Never commit secrets or PII
3. Prefer typed boundaries and narrow interfaces
4. Treat failing E2E tests as product signals
5. Use conventional commit messages

## License

MIT