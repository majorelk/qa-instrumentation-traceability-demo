# Telemetry Package

Framework-agnostic TypeScript utilities for structured event emission and telemetry management. Designed for use in monorepos with consistent telemetry schemas across frontend and backend applications.

## Features

- **Framework-agnostic**: Works with any JavaScript/TypeScript runtime
- **ESM-first**: Modern ES modules with proper exports mapping
- **Type-safe**: Full TypeScript support with strict typing
- **Zero dependencies**: Lightweight with no external runtime dependencies
- **Structured schema**: Consistent event format across applications
- **Request correlation**: Built-in support for request ID tracking

## Installation

```bash
# In a pnpm workspace
pnpm add telemetry@workspace:*

# Or as a standalone package
pnpm add telemetry
```

## Usage

### Basic Setup

```typescript
import { initTelemetry, emitEvent, type TelemetryEvent } from 'telemetry';

// Initialize once at application startup
initTelemetry({
  env: 'production',
  release: 'v1.2.3',
  service: 'my-service'
});

// Emit telemetry events
emitEvent({
  ts: Date.now(),
  level: 'error',
  env: 'production',
  release: 'v1.2.3',
  route: '/api/users',
  status: 500,
  request_id: 'req-123',
  error_code: 'DB_CONNECTION_FAILED',
  error: 'Database connection timeout'
});
```

### Web Application Example

```typescript
// In your main.tsx or app entry point
import { initTelemetry } from 'telemetry';

initTelemetry({
  env: process.env.NODE_ENV || 'development',
  release: process.env.REACT_APP_VERSION || 'local',
  service: 'web-app'
});

// In your fetch wrapper or error handler
import { emitEvent } from 'telemetry';

async function apiCall(url: string, requestId: string) {
  try {
    const response = await fetch(url, {
      headers: { 'x-request-id': requestId }
    });
    
    if (!response.ok) {
      emitEvent({
        ts: Date.now(),
        level: 'error',
        env: 'production',
        release: 'v1.2.3',
        route: new URL(url).pathname,
        status: response.status,
        request_id: requestId,
        error_code: 'API_ERROR',
        error: `${response.status} ${response.statusText}`
      });
    }
    
    return response;
  } catch (error) {
    emitEvent({
      ts: Date.now(),
      level: 'error',
      env: 'production',
      release: 'v1.2.3',
      route: new URL(url).pathname,
      request_id: requestId,
      error_code: 'NETWORK_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
```

### Server Application Example

```typescript
// In your server setup
import { initTelemetry, emitEvent } from 'telemetry';

initTelemetry({
  env: process.env.NODE_ENV || 'development',
  release: process.env.RELEASE || 'dev',
  service: 'api-server'
});

// In your Express middleware or request handlers
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || generateUUID();
  
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      emitEvent({
        ts: Date.now(),
        level: res.statusCode >= 500 ? 'error' : 'warn',
        env: process.env.NODE_ENV || 'development',
        release: process.env.RELEASE || 'dev',
        route: req.path,
        status: res.statusCode,
        request_id: requestId,
        error_code: res.statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
        details: {
          method: req.method,
          userAgent: req.headers['user-agent']
        }
      });
    }
  });
  
  next();
});
```

## API Reference

### Types

#### `TelemetryEvent`

The core telemetry event interface:

```typescript
interface TelemetryEvent {
  ts: number;                           // Unix timestamp in milliseconds
  level: 'info' | 'warn' | 'error';    // Event severity level
  env: string;                          // Environment (development, staging, production)
  release: string;                      // Version or release identifier
  route?: string;                       // API endpoint or page route
  status?: number;                      // HTTP status code
  request_id?: string;                  // Correlation identifier (UUID recommended)
  error_code?: string;                  // Application-specific error code
  error?: string;                       // Error message or stack trace
  details?: Record<string, unknown>;    // Additional context data
}
```

#### `TelemetryOptions`

Configuration for telemetry initialization:

```typescript
interface TelemetryOptions {
  env: string;     // Environment name
  release: string; // Release version
  service: string; // Service name identifier
}
```

### Functions

#### `initTelemetry(options: TelemetryOptions): void`

Initialize the telemetry system with default configuration. This should be called once at application startup.

**Parameters:**
- `options.env` - Environment name (e.g., 'development', 'staging', 'production')
- `options.release` - Release version (e.g., 'v1.2.3', git SHA, or 'local')
- `options.service` - Service identifier (e.g., 'web-app', 'api-server', 'worker')

**Example:**
```typescript
initTelemetry({
  env: 'production',
  release: 'v1.2.3',
  service: 'user-service'
});
```

#### `emitEvent(event: TelemetryEvent): void`

Emit a telemetry event. The event will be enriched with default values from initialization if not provided.

**Parameters:**
- `event` - Telemetry event object (see `TelemetryEvent` interface)

**Behavior:**
- Validates that telemetry has been initialized
- Fills in missing `ts`, `env`, and `release` fields from initialization
- Outputs the event as JSON to console.log
- Warns if telemetry hasn't been initialized

**Example:**
```typescript
emitEvent({
  ts: Date.now(),
  level: 'error',
  env: 'production',
  release: 'v1.2.3',
  error_code: 'VALIDATION_FAILED',
  error: 'Invalid user input',
  details: { field: 'email', value: 'invalid-email' }
});
```

## Event Schema Guidelines

### Required Fields

Always provide these fields for consistent telemetry:
- `ts` - Timestamp for event ordering and analysis
- `level` - Severity for filtering and alerting
- `env` - Environment for deployment-specific analysis
- `release` - Version for release correlation

### Optional but Recommended

- `request_id` - Essential for request correlation and debugging
- `route` - Important for endpoint-specific analysis
- `status` - HTTP status codes for API monitoring
- `error_code` - Application-specific error categorization

### Best Practices

1. **Request Correlation**: Always include `request_id` when available
2. **Error Codes**: Use consistent, documented error codes across services
3. **Structured Details**: Use the `details` field for additional context, not for core fields
4. **Timestamp Precision**: Use `Date.now()` for millisecond precision
5. **Environment Consistency**: Use the same environment names across all services

### Example Event Patterns

**API Error:**
```typescript
{
  ts: Date.now(),
  level: 'error',
  env: 'production',
  release: 'v1.2.3',
  route: '/api/users/123',
  status: 404,
  request_id: 'req-abc123',
  error_code: 'USER_NOT_FOUND',
  error: 'User with ID 123 not found'
}
```

**Client-side Error:**
```typescript
{
  ts: Date.now(),
  level: 'error',
  env: 'production',
  release: 'v1.2.3',
  route: '/dashboard',
  request_id: 'req-def456',
  error_code: 'RENDER_ERROR',
  error: 'Component failed to render',
  details: {
    component: 'UserDashboard',
    props: { userId: 123 }
  }
}
```

**Performance Warning:**
```typescript
{
  ts: Date.now(),
  level: 'warn',
  env: 'production',
  release: 'v1.2.3',
  route: '/api/search',
  status: 200,
  request_id: 'req-ghi789',
  error_code: 'SLOW_RESPONSE',
  details: {
    duration: 2500,
    threshold: 1000
  }
}
```

## Build and Development

### Building

```bash
# Build the package
pnpm build

# Watch mode for development
pnpm dev
```

### Package Structure

```
packages/telemetry/
├── src/
│   └── index.ts          # Main implementation
├── dist/                 # Built output (generated)
│   ├── index.js          # Compiled JavaScript
│   └── index.d.ts        # Type definitions
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### ESM Exports

The package uses modern ES modules with proper exports mapping:

```json
{
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

This ensures compatibility with:
- Modern bundlers (Vite, Webpack 5+, Rollup)
- Node.js ES modules
- TypeScript projects with proper type resolution

## Integration Examples

### Vite + React

```typescript
// vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: string
}

// main.tsx
import { initTelemetry } from 'telemetry';

initTelemetry({
  env: import.meta.env.VITE_APP_ENV || 'development',
  release: import.meta.env.VITE_APP_VERSION || 'local',
  service: 'web-app'
});
```

### Express + TypeScript

```typescript
// server.ts
import express from 'express';
import { initTelemetry, emitEvent } from 'telemetry';

const app = express();

initTelemetry({
  env: process.env.NODE_ENV || 'development',
  release: process.env.RELEASE || 'dev',
  service: 'api-server'
});

// Telemetry endpoint for receiving events from clients
app.post('/telemetry', (req, res) => {
  const event = req.body;
  console.log(JSON.stringify(event)); // Forward to logging system
  res.status(204).send();
});
```

### Testing

The telemetry package is designed to be easily testable:

```typescript
// Mock console.log to capture telemetry events in tests
const mockLog = jest.spyOn(console, 'log').mockImplementation();

initTelemetry({
  env: 'test',
  release: 'test',
  service: 'test-service'
});

emitEvent({
  ts: Date.now(),
  level: 'error',
  env: 'test',
  release: 'test',
  error: 'Test error'
});

expect(mockLog).toHaveBeenCalledWith(
  expect.stringContaining('"error":"Test error"')
);
```

## License

MIT