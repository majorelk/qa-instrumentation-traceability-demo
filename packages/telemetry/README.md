# Telemetry

Framework-agnostic telemetry utilities for structured event emission.

## Usage

```typescript
import { initTelemetry, emitEvent, type TelemetryEvent } from 'telemetry';

// Initialize once
initTelemetry({
  env: 'development',
  release: 'v1.0.0',
  service: 'my-service'
});

// Emit events
emitEvent({
  ts: Date.now(),
  level: 'error',
  env: 'development',
  release: 'v1.0.0',
  route: '/api/users',
  status: 500,
  request_id: 'req-123',
  error_code: 'DB_CONNECTION_FAILED',
  error: 'Database connection timeout'
});
```

## Build

```bash
pnpm build
```