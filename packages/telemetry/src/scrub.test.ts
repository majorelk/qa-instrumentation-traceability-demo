import { describe, it, expect } from 'vitest';
import { scrub } from './index.js';

describe('scrub', () => {
  describe('email redaction', () => {
    it('should redact email addresses', () => {
      expect(scrub('user@example.com')).toBe('***@example.com');
      expect(scrub('test.email+tag@domain.co.uk')).toBe('***@domain.co.uk');
      expect(scrub('Contact us at support@company.com for help')).toBe('Contact us at ***@company.com for help');
    });
  });

  describe('token-like redaction', () => {
    it('should redact long hex/base64-like strings', () => {
      const longHex = 'a1b2c3d4e5f67890abcdef1234567890abcdef12';
      expect(scrub(longHex)).toBe('[REDACTED]');
      
      const base64Token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      expect(scrub(base64Token)).toBe('[REDACTED]');
      
      const apiKey = 'sk-1234567890abcdef1234567890abcdef';
      expect(scrub(apiKey)).toBe('[REDACTED]');
    });

    it('should not redact short strings', () => {
      expect(scrub('short123')).toBe('short123');
      expect(scrub('abc')).toBe('abc');
    });
  });

  describe('sensitive key redaction', () => {
    it('should redact values for keys containing password/secret/token/auth/key', () => {
      const obj = {
        password: 'secret123',
        apiKey: 'abc123',
        authToken: 'xyz789',
        user_secret: 'hidden',
        normalField: 'visible',
        PASSWORD: 'case-insensitive',
      };

      const result = scrub(obj) as Record<string, unknown>;
      expect(result.password).toBe('[REDACTED]');
      expect(result.apiKey).toBe('[REDACTED]');
      expect(result.authToken).toBe('[REDACTED]');
      expect(result.user_secret).toBe('[REDACTED]');
      expect(result.normalField).toBe('visible');
      expect(result.PASSWORD).toBe('[REDACTED]');
    });
  });

  describe('string truncation', () => {
    it('should truncate strings longer than 500 characters', () => {
      const longString = 'a'.repeat(600);
      const result = scrub(longString) as string;
      expect(result).toBe('a'.repeat(497) + '...');
      expect(result.length).toBe(500);
    });

    it('should not truncate strings 500 characters or less', () => {
      const okString = 'a'.repeat(500);
      expect(scrub(okString)).toBe(okString);
    });
  });

  describe('array handling', () => {
    it('should scrub array elements', () => {
      const arr = ['user@example.com', { password: 'secret' }, 'normal'];
      const result = scrub(arr) as unknown[];
      
      expect(result[0]).toBe('***@example.com');
      expect((result[1] as Record<string, unknown>).password).toBe('[REDACTED]');
      expect(result[2]).toBe('normal');
    });
  });

  describe('circular reference handling', () => {
    it('should handle circular references', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj;
      
      const result = scrub(obj) as Record<string, unknown>;
      expect(result.name).toBe('test');
      expect(result.self).toBe('[CIRCULAR]');
    });
  });

  describe('depth limiting', () => {
    it('should limit recursion depth', () => {
      let deepObj: Record<string, unknown> = { value: 'deep' };
      
      // Create object 15 levels deep
      for (let i = 0; i < 15; i++) {
        deepObj = { nested: deepObj };
      }
      
      const result = scrub(deepObj);
      // Should not throw and should contain MAX_DEPTH somewhere in the structure
      expect(JSON.stringify(result)).toContain('[MAX_DEPTH]');
    });
  });

  describe('primitive values', () => {
    it('should handle null and undefined', () => {
      expect(scrub(null)).toBe(null);
      expect(scrub(undefined)).toBe(undefined);
    });

    it('should handle numbers and booleans', () => {
      expect(scrub(42)).toBe(42);
      expect(scrub(true)).toBe(true);
      expect(scrub(false)).toBe(false);
    });
  });

  describe('complex scenarios', () => {
    it('should handle nested objects with mixed sensitive data', () => {
      const complex = {
        user: {
          email: 'user@example.com',
          password: 'secret123',
          profile: {
            name: 'John Doe',
            apiKey: 'sk-1234567890abcdef1234567890abcdef',
            preferences: {
              theme: 'dark',
              authToken: 'bearer-xyz789'
            }
          }
        },
        logs: ['info: user logged in', 'error: failed login for admin@company.com']
      };

      const result = scrub(complex) as any;
      
      expect(result.user.email).toBe('***@example.com');
      expect(result.user.password).toBe('[REDACTED]');
      expect(result.user.profile.name).toBe('John Doe');
      expect(result.user.profile.apiKey).toBe('[REDACTED]');
      expect(result.user.profile.preferences.theme).toBe('dark');
      expect(result.user.profile.preferences.authToken).toBe('[REDACTED]');
      expect(result.logs[0]).toBe('info: user logged in');
      expect(result.logs[1]).toBe('error: failed login for ***@company.com');
    });
  });
});