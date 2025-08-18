import express, { Request, Response, NextFunction, Express } from 'express';
import { initTelemetry, type TelemetryEvent } from 'telemetry';

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

// Health check endpoint
app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Telemetry endpoint
app.post('/telemetry', (req: Request, res: Response) => {
  const event = req.body as Partial<TelemetryEvent>;
  
  // Basic validation
  if (!event.ts || !event.level || !event.env || !event.release) {
    return res.status(400).json({ 
      error: 'Missing required fields: ts, level, env, release' 
    });
  }
  
  // Add request_id if missing
  const telemetryEvent: TelemetryEvent = {
    ...event,
    request_id: event.request_id || res.locals.requestId
  } as TelemetryEvent;
  
  // Log the event with request_id
  const logEntry = {
    ...telemetryEvent,
    request_id: res.locals.requestId
  };
  
  console.log(JSON.stringify(logEntry));
  
  res.status(204).send();
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}

export default app;