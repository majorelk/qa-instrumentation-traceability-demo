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

// Send telemetry event for non-OK responses
function sendTelemetryEvent(event: TelemetryEvent): void {
  try {
    const telemetryPayload = JSON.stringify(event);
    const telemetryUrl = '/telemetry';
    
    // Prefer navigator.sendBeacon for reliability
    if (navigator.sendBeacon) {
      const blob = new Blob([telemetryPayload], { type: 'application/json' });
      navigator.sendBeacon(telemetryUrl, blob);
      return;
    }
    
    // Fallback to fetch POST (non-blocking)
    fetch(telemetryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': event.request_id || '',
      },
      body: telemetryPayload,
    }).catch(() => {
      // Ignore telemetry failures - non-blocking
    });
  } catch {
    // Ignore telemetry failures - non-blocking
  }
}

export async function fetchWithCorrelation(url: string, options: RequestInit = {}): Promise<Response> {
  const requestId = generateUUID();
  
  // Set request ID on window for tests
  (window as any).__lastReqId = requestId;
  
  const headers = new Headers(options.headers);
  headers.set('x-request-id', requestId);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Send telemetry on non-OK responses
    if (!response.ok) {
      // Extract route from URL (remove base URL and query params)
      const route = new URL(url, window.location.origin).pathname;
      
      const telemetryEvent: TelemetryEvent = {
        ts: Date.now(),
        level: response.status >= 500 ? 'error' : 'warn',
        env: 'development', // Could be dynamic: import.meta.env.MODE
        release: 'local',   // Could be dynamic: import.meta.env.VITE_APP_VERSION
        route,
        status: response.status,
        request_id: requestId,
        error_code: 'HTTP_ERROR',
        error: `${response.status} ${response.statusText}`,
      };
      
      // Send telemetry (non-blocking)
      sendTelemetryEvent(telemetryEvent);
    }
    
    return response;
  } catch (error) {
    // Send telemetry for network errors
    const route = new URL(url, window.location.origin).pathname;
    
    const telemetryEvent: TelemetryEvent = {
      ts: Date.now(),
      level: 'error',
      env: 'development', // Could be dynamic: import.meta.env.MODE  
      release: 'local',   // Could be dynamic: import.meta.env.VITE_APP_VERSION
      route,
      request_id: requestId,
      error_code: 'NETWORK_ERROR',
      error: error instanceof Error ? error.message : 'Unknown network error',
    };
    
    // Send telemetry (non-blocking)
    sendTelemetryEvent(telemetryEvent);
    
    throw error;
  }
}