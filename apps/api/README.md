# API Server

Express 4.x server with request correlation middleware and telemetry endpoints for demonstrating end-to-end traceability.

## Features

- **Request Correlation**: Automatically assigns or accepts `x-request-id` headers and echoes them in responses
- **Telemetry Endpoint**: Accepts structured telemetry events with validation
- **Debug Endpoints**: Development/test utilities for inspecting telemetry data
- **Health Check**: Simple health endpoint for monitoring
- **Express 4.x**: Stable production-ready Express version with TypeScript

## Endpoints

### Production Endpoints

#### `GET /healthz`
Health check endpoint that returns `200 OK` with status.

**Response:**
```json
{ "status": "ok" }
```

#### `POST /telemetry`
Accepts structured telemetry events with validation.

**Required fields:**
- `ts` (number): Timestamp
- `level` (string): 'info' | 'warn' | 'error' 
- `env` (string): Environment name
- `release` (string): Release version

**Optional fields:**
- `route` (string): API endpoint or page route
- `status` (number): HTTP status code
- `request_id` (string): Correlation identifier
- `error_code` (string): Application-specific error code
- `error` (string): Error message or stack trace
- `details` (object): Additional context data

**Request example:**
```bash
curl -X POST http://localhost:3000/telemetry \
  -H "Content-Type: application/json" \
  -H "x-request-id: 123e4567-e89b-12d3-a456-426614174000" \
  -d '{
    "ts": 1640995200000,
    "level": "error",
    "env": "production",
    "release": "v1.2.3",
    "route": "/api/users",
    "status": 500,
    "request_id": "123e4567-e89b-12d3-a456-426614174000",
    "error_code": "DB_CONNECTION_FAILED",
    "error": "Database connection timeout"
  }'
```

**Response:** `204 No Content`

**Error Response (400):**
```json
{ "error": "Missing required fields: ts, level, env, release" }
```

#### `GET /api/fail`
Intentional 500 error endpoint for testing error handling and telemetry emission.

**Response:** `500 Internal Server Error`
```json
{ "error": "Intentional server error for testing" }
```

### Development/Test Endpoints

#### `GET /debug/last-event`
Returns the last telemetry event received by the server. Only available in non-production environments.

**Response (200):**
```json
{
  "ts": 1640995200000,
  "level": "error",
  "env": "development",
  "release": "local",
  "route": "/api/fail",
  "status": 500,
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "error_code": "HTTP_ERROR",
  "error": "500 Internal Server Error"
}
```

**Response (404 - No events yet):**
```json
{ "error": "No telemetry events received yet" }
```

**Response (404 - Production environment):**
```json
{ "error": "Not found" }
```

## Request Correlation Middleware

All endpoints automatically handle request correlation:

1. **Incoming requests**: Reads `x-request-id` header or generates a new UUID
2. **Response headers**: Always includes `x-request-id` in the response
3. **Logging context**: All log entries include the request ID when available
4. **Telemetry storage**: Request ID is stored with telemetry events for debugging

## Development

### Prerequisites
- Node.js 20+
- pnpm 9+

### Installation
```bash
# From the API directory
cd apps/api
pnpm install
```

### Scripts

```bash
# Development with hot reload
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Run unit tests
pnpm test

# Run tests in watch mode  
pnpm test --watch
```

### Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment name (development, test, production)
- `RELEASE` - Release version identifier

### Testing

The API includes comprehensive unit tests using Vitest and Supertest:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm vitest server.test.ts

# Run tests with coverage
pnpm vitest --coverage
```

**Test scenarios covered:**
- Request correlation (assignment and echo)
- Telemetry endpoint validation and storage
- Health check functionality
- Error handling and status codes
- Debug endpoint security (production vs development)

### Architecture

```
server.ts                 # Main Express application
├── Middleware
│   ├── express.json()    # JSON body parsing
│   └── correlateRequests # Request ID assignment/echo
├── Routes
│   ├── GET /healthz      # Health check
│   ├── GET /api/fail     # Test error endpoint
│   ├── GET /debug/last-event # Debug telemetry retrieval
│   └── POST /telemetry   # Telemetry ingestion
└── Storage
    └── lastTelemetryEvent # In-memory storage for debugging
```

### Dependencies

**Production:**
- `express` ^4.21.2 - Web framework
- `telemetry` workspace:* - Shared telemetry types

**Development:**
- `@types/express` ^4.17.23 - Express type definitions
- `@types/supertest` ^6.0.3 - Supertest type definitions
- `supertest` ^7.1.4 - HTTP testing library
- `tsx` ^4.20.4 - TypeScript execution and hot reload
- `typescript` ^5.9.2 - TypeScript compiler
- `vitest` ^3.2.4 - Fast unit testing framework

## Integration with Web App

The API server is designed to work seamlessly with the Vite-based web application:

1. **Proxy Configuration**: Web app proxies `/api/*`, `/telemetry`, and `/debug/*` requests to the API server
2. **CORS Handling**: No CORS configuration needed due to proxy setup
3. **Port Isolation**: API runs on port 3000, web on port 5173, preventing conflicts
4. **Request Correlation**: Web app sends `x-request-id` headers that the API processes and echoes back

## Telemetry Flow

1. **Web app** makes API call with `x-request-id` header
2. **API middleware** processes the request ID and sets response header
3. **API endpoint** returns response (success or error)
4. **Web app** detects non-OK response and emits telemetry event
5. **Telemetry endpoint** receives, validates, and stores the event
6. **Debug endpoint** allows retrieval of the last event for verification

This creates a complete audit trail that can be verified end-to-end in tests.

## Production Considerations

- **Logging**: All telemetry events are logged to stdout as JSON
- **Storage**: Currently uses in-memory storage for debug events (dev/test only)
- **Security**: Debug endpoints are disabled in production environments
- **Performance**: Minimal overhead with efficient middleware and JSON parsing
- **Monitoring**: Health check endpoint for load balancer integration

For production deployment, consider:
- Adding persistent telemetry storage (database, message queue)
- Implementing proper logging infrastructure
- Adding authentication/authorization as needed
- Configuring request rate limiting
- Setting up monitoring and alerting