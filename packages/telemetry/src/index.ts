export interface TelemetryEvent {
  ts: number;
  level: 'info' | 'warn' | 'error';
  env: string;
  release: string;
  route?: string;
  status?: number;
  request_id?: string;
  error_code?: string;
  error?: string;
  details?: Record<string, unknown>;
}

interface TelemetryOptions {
  env: string;
  release: string;
  service: string;
}

let telemetryConfig: TelemetryOptions | null = null;

export function initTelemetry(opts: TelemetryOptions): void {
  telemetryConfig = { ...opts };
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