# API Server

Express server with request correlation and telemetry endpoints.

## Features

- **Request Correlation**: Automatically assigns or accepts `x-request-id` headers
- **Telemetry Endpoint**: Accepts structured telemetry events with validation
- **Health Check**: Simple health endpoint at `/healthz`

## Endpoints

### GET /healthz
Returns `200 OK` with status.

### POST /telemetry
Accepts telemetry events with required fields:
- `ts` (number): Timestamp
- `level` (string): 'info' | 'warn' | 'error' 
- `env` (string): Environment name
- `release` (string): Release version

Optional fields: `route`, `status`, `request_id`, `error_code`, `error`, `details`

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment name
- `RELEASE` - Release version