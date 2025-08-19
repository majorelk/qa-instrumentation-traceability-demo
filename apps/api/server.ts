import express, { Request, Response, NextFunction, Express } from 'express';
import { initTelemetry, TelemetryEventSchema, scrub, type TelemetryEvent } from 'telemetry';
import { writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize telemetry
initTelemetry({
  env: process.env.NODE_ENV || 'development',
  release: process.env.RELEASE || 'dev',
  service: 'api'
});

// UUID generation with fallback
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Simple fallback UUID v4-like generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Request correlation middleware
function correlateRequests(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || generateUUID();
  res.locals.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}

app.use(correlateRequests);

// In-memory storage for last telemetry event (dev/test only)
let lastTelemetryEvent: TelemetryEvent | null = null;

// Ensure logs directory exists
function ensureLogsDir(): void {
  const logsDir = join(process.cwd(), 'logs');
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }
}

// Log telemetry event to NDJSON file
function logTelemetryEvent(event: TelemetryEvent): void {
  ensureLogsDir();
  const logPath = join(process.cwd(), 'logs', 'telemetry.ndjson');
  const logLine = JSON.stringify(event) + '\n';
  appendFileSync(logPath, logLine, 'utf8');
}

// Health check endpoint
app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// API fail endpoint
app.get('/api/fail', (req: Request, res: Response) => {
  res.status(500).json({ error: 'Intentional server error for testing' });
});

// Debug endpoint to get last telemetry event (dev/test only)
app.get('/debug/last-event', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (!lastTelemetryEvent) {
    return res.status(404).json({ error: 'No telemetry events received yet' });
  }
  
  res.json(lastTelemetryEvent);
});

// Debug endpoint to get last accepted telemetry event from memory
app.get('/debug/telemetry/last', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (!lastTelemetryEvent) {
    return res.status(404).json({ error: 'No telemetry events received yet' });
  }
  
  res.json(lastTelemetryEvent);
});

// Telemetry endpoint
app.post('/telemetry', (req: Request, res: Response) => {
  const requestId = res.locals.requestId;
  
  try {
    // Validate request body against TelemetryEventSchema
    const validationResult = TelemetryEventSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.setHeader('x-request-id', requestId);
      return res.status(400).json({ 
        error: 'VALIDATION_ERROR',
        message: 'Invalid telemetry event structure',
        details: validationResult.error.issues
      });
    }
    
    let event = validationResult.data;
    
    // Ensure request_id from correlation middleware; set if missing
    if (!event.request_id) {
      event = { ...event, request_id: requestId };
    }
    
    // Scrub sensitive data in details field
    if (event.details) {
      event = { ...event, details: scrub(event.details) as Record<string, unknown> };
    }
    
    // Store last event for debug endpoint (dev/test only)
    if (process.env.NODE_ENV !== 'production') {
      lastTelemetryEvent = event;
    }
    
    // Log to NDJSON file
    logTelemetryEvent(event);
    
    // Also log to console with request_id
    console.log(JSON.stringify(event));
    
    res.status(204).send();
  } catch (error) {
    res.setHeader('x-request-id', requestId);
    return res.status(400).json({ 
      error: 'PROCESSING_ERROR',
      message: 'Failed to process telemetry event'
    });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}

export default app;