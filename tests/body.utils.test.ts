import { describe, it, expect } from 'vitest';
import { extractRequestBody, formatRequestBody } from '../lib/utils/body.utils';
import { DEFAULT_OPTIONS } from '../lib/constants/default-options';

describe('body.utils unit tests', () => {
  describe('extractRequestBody', () => {
    it('should return rawStreamBody if present and non-empty', () => {
      const req = { body: { title: 'ignore' } } as any;
      const result = extractRequestBody(req, '{"stream":true}');
      expect(result).toBe('{"stream":true}');
    });

    it('should fallback to req.body when rawStreamBody is empty', () => {
      const req = { body: { title: 'from req.body' } } as any;
      const result = extractRequestBody(req, '');
      expect(result).toEqual({ title: 'from req.body' });
    });

    it('should fallback to req._body or req.rawBody or req.payload', () => {
      expect(extractRequestBody({ _body: 'from _body' } as any, '')).toBe('from _body');
      expect(extractRequestBody({ rawBody: 'from rawBody' } as any, '')).toBe('from rawBody');
      expect(extractRequestBody({ payload: 'from payload' } as any, '')).toBe('from payload');
    });

    it('should return undefined when no body exists anywhere', () => {
      expect(extractRequestBody({} as any, '')).toBeUndefined();
    });
  });

  describe('formatRequestBody', () => {
    it('should return empty string for null, undefined, or empty values', () => {
      expect(formatRequestBody(undefined, DEFAULT_OPTIONS)).toBe('');
      expect(formatRequestBody(null, DEFAULT_OPTIONS)).toBe('');
      expect(formatRequestBody('', DEFAULT_OPTIONS)).toBe('');
    });

    it('should format and redact valid JSON objects', () => {
      const input = {
        name: 'John',
        password: 'my-secret-password',
        token: 'auth-123',
      };
      const formatted = formatRequestBody(input, {
        ...DEFAULT_OPTIONS,
        redactKeys: ['password', 'token'],
      });

      expect(formatted).toContain('"name": "John"');
      expect(formatted).toContain('"password": "[REDACTED]"');
      expect(formatted).toContain('"token": "[REDACTED]"');
      expect(formatted).not.toContain('my-secret-password');
      expect(formatted).not.toContain('auth-123');
    });

    it('should format and redact JSON strings', () => {
      const input = JSON.stringify({
        secret: 'super-secret',
        visible: 'ok',
      });
      const formatted = formatRequestBody(input, {
        ...DEFAULT_OPTIONS,
        redactKeys: ['secret'],
      });

      expect(formatted).toContain('"secret": "[REDACTED]"');
      expect(formatted).toContain('"visible": "ok"');
      expect(formatted).not.toContain('super-secret');
    });

    it('should redact malformed JSON strings using regex', () => {
      const input = '{"secret":"123", invalid}';
      const formatted = formatRequestBody(input, {
        ...DEFAULT_OPTIONS,
        redactKeys: ['secret'],
      });

      expect(formatted).toContain('"secret":"[REDACTED]"');
      expect(formatted).not.toContain('123');
    });

    it('should truncate body exceeding maxBodyLength', () => {
      const input = { longText: 'a'.repeat(200) };
      const formatted = formatRequestBody(input, {
        ...DEFAULT_OPTIONS,
        maxBodyLength: 30,
      });

      expect(formatted).toContain('[truncated]');
      expect(formatted.length).toBeLessThan(100);
    });
  });
});
