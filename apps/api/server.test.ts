import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './server.js';

describe('API Server', () => {
  describe('Request correlation', () => {
    it('assigns x-request-id when not provided', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);
      
      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
      expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]+$/i);
    });

    it('echoes provided x-request-id', async () => {
      const requestId = 'test-request-123';
      
      const response = await request(app)
        .get('/healthz')
        .set('x-request-id', requestId)
        .expect(200);
      
      expect(response.headers['x-request-id']).toBe(requestId);
    });
  });

  describe('POST /telemetry', () => {
    it('accepts valid telemetry event and echoes x-request-id', async () => {
      const requestId = 'telemetry-test-456';
      const telemetryEvent = {
        ts: Date.now(),
        level: 'error' as const,
        env: 'test',
        release: 'v1.0.0',
        route: '/api/test',
        status: 500,
        error_code: 'TEST_ERROR',
        error: 'Test error message'
      };

      const response = await request(app)
        .post('/telemetry')
        .set('x-request-id', requestId)
        .send(telemetryEvent)
        .expect(204);
      
      expect(response.headers['x-request-id']).toBe(requestId);
    });

    it('assigns x-request-id when not provided in telemetry request', async () => {
      const telemetryEvent = {
        ts: Date.now(),
        level: 'info' as const,
        env: 'test',
        release: 'v1.0.0'
      };

      const response = await request(app)
        .post('/telemetry')
        .send(telemetryEvent)
        .expect(204);
      
      expect(response.headers['x-request-id']).toBeDefined();
      expect(typeof response.headers['x-request-id']).toBe('string');
    });

    it('rejects invalid telemetry event', async () => {
      const invalidEvent = {
        level: 'error',
        // Missing required fields: ts, env, release
      };

      await request(app)
        .post('/telemetry')
        .send(invalidEvent)
        .expect(400);
    });
  });

  describe('GET /healthz', () => {
    it('returns 200 ok', async () => {
      const response = await request(app)
        .get('/healthz')
        .expect(200);
      
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});