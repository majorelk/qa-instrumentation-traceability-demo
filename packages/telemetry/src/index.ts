import { z } from 'zod';

export const TelemetryEventSchema = z.object({
  ts: z.number(),
  level: z.enum(['info', 'warn', 'error']),
  env: z.string(),
  release: z.string(),
  route: z.string().optional(),
  status: z.number().optional(),
  request_id: z.string().optional(),
  error_code: z.string().optional(),
  error: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

interface TelemetryOptions {
  env: string;
  release: string;
  service: string;
}

let telemetryConfig: TelemetryOptions | null = null;

export function initTelemetry(opts: TelemetryOptions): void {
  telemetryConfig = { ...opts };
}

/**
 * Scrubs sensitive data from values for safe logging
 */
export function scrub(value: unknown): unknown {
  const visited = new WeakSet<object>();
  
  function scrubValue(val: unknown, depth = 0): unknown {
    // Prevent infinite recursion
    if (depth > 10) return '[MAX_DEPTH]';
    
    // Handle null/undefined
    if (val === null || val === undefined) return val;
    
    // Handle primitives
    if (typeof val === 'string') {
      // Email redaction: user@domain.com -> ***@domain.com
      let processedVal = val.replace(/\b[\w._%+-]+@([\w.-]+\.[A-Z]{2,})\b/gi, '***@$1');
      
      // Token-like redaction: long hex/base64 strings (but not simple repeated chars)
      if (processedVal.length > 20 && 
          /^[A-Za-z0-9+/=_-]+$/.test(processedVal) &&
          !/^(.)\1*$/.test(processedVal)) { // Not just repeated single character
        return '[REDACTED]';
      }
      
      // Truncate long strings
      if (processedVal.length > 500) {
        return processedVal.substring(0, 497) + '...';
      }
      
      return processedVal;
    }
    
    if (typeof val === 'number' || typeof val === 'boolean') {
      return val;
    }
    
    // Handle arrays
    if (Array.isArray(val)) {
      if (visited.has(val)) return '[CIRCULAR]';
      visited.add(val);
      const result = val.map(item => scrubValue(item, depth + 1));
      visited.delete(val);
      return result;
    }
    
    // Handle objects
    if (typeof val === 'object') {
      if (visited.has(val)) return '[CIRCULAR]';
      visited.add(val);
      
      const result: Record<string, unknown> = {};
      
      for (const [key, objVal] of Object.entries(val)) {
        const lowerKey = key.toLowerCase();
        
        // Redact sensitive keys
        if (lowerKey.includes('password') || 
            lowerKey.includes('secret') || 
            lowerKey.includes('token') || 
            lowerKey.includes('auth') || 
            lowerKey.includes('key')) {
          result[key] = '[REDACTED]';
        } else {
          result[key] = scrubValue(objVal, depth + 1);
        }
      }
      
      visited.delete(val);
      return result;
    }
    
    return val;
  }
  
  return scrubValue(value);
}

export function emitEvent(evt: TelemetryEvent): void {
  if (!telemetryConfig) {
    console.warn('Telemetry not initialized. Call initTelemetry() first.');
    return;
  }

  const event: TelemetryEvent = {
    ...evt,
    ts: evt.ts || Date.now(),
    env: evt.env || telemetryConfig.env,
    release: evt.release || telemetryConfig.release,
  };

  console.log(JSON.stringify(event));
}