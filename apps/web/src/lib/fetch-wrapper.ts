import type { TelemetryEvent } from 'telemetry';

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

export async function fetchWithCorrelation(url: string, options: RequestInit = {}): Promise<Response> {
  const requestId = generateUUID();
  
  // Set request ID on window for tests
  (window as any).__lastReqId = requestId;
  
  const headers = new Headers(options.headers);
  headers.set('x-request-id', requestId);
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    // Extract route from URL (remove base URL and query params)
    const route = new URL(url, window.location.origin).pathname;
    
    const telemetryEvent: TelemetryEvent = {
      ts: Date.now(),
      level: 'error',
      env: 'development',
      release: 'local',
      route,
      status: response.status,
      request_id: requestId,
      error_code: 'API_ERROR',
      error: `${response.status} ${response.statusText}`,
    };
    
    // Send telemetry event
    try {
      await fetch('/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': generateUUID(), // New request ID for telemetry call
        },
        body: JSON.stringify(telemetryEvent),
      });
    } catch (telemetryError) {
      console.warn('Failed to send telemetry event:', telemetryError);
    }
  }
  
  return response;
}