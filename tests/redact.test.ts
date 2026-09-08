/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from 'vitest';
import viteRequestLogger from '../lib/index';
import { redact, redactWithRegex } from '../lib/utils/redact';

describe('Redaction & Body / Header Processing', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('unit tests for redact function', () => {
    it('should redact sensitive keys case-insensitively', () => {
      const input = {
        password: '123',
        TOKEN: 'secret-token',
        nested: {
          Secret: 'nested-secret',
          safeField: 'hello',
        },
        arr: [{ token: 'abc' }, { safe: 'world' }],
      };

      const result = redact(input, ['password', 'token', 'secret']);
      expect(result).toEqual({
        password: '[REDACTED]',
        TOKEN: '[REDACTED]',
        nested: {
          Secret: '[REDACTED]',
          safeField: 'hello',
        },
        arr: [{ token: '[REDACTED]' }, { safe: 'world' }],
      });
    });

    it('should safely return primitive and null inputs', () => {
      expect(redact(null, ['key'])).toBeNull();
      expect(redact('string', ['key'])).toBe('string');
      expect(redact(123, ['key'])).toBe(123);
    });

    it('should redact malformed JSON using redactWithRegex', () => {
      const rawText = '{"secret": "my-secret-key", "token":"abc", malformed}';
      const result = redactWithRegex(rawText, ['secret', 'token']);
      expect(result).toContain('"secret": "[REDACTED]"');
      expect(result).toContain('"token":"[REDACTED]"');
      expect(result).not.toContain('my-secret-key');
      expect(result).not.toContain('abc');
    });
  });

  describe('integration tests with request logger', () => {
    it('should redact sensitive keys in request body', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const plugin = viteRequestLogger({
        prefix: '/api',
        logBody: true,
        redactKeys: ['password', 'secret', 'token'],
        colors: false,
      });
      let middleware: any;
      const mockServer = {
        middlewares: {
          use: (fn: any) => {
            middleware = fn;
          },
        },
      } as any;

      (plugin.configureServer as (server: any) => void)(mockServer);

      const bodyData = JSON.stringify({ password: '123', token: 'xyz', safe: 'hello' });
      const req = {
        url: '/api/login',
        method: 'POST',
        on: (event: string, callback: (chunk: Buffer) => void) => {
          if (event === 'data') {
            callback(Buffer.from(bodyData));
          }
        },
      } as any;
      const next = vi.fn();
      const originalEnd = vi.fn();
      const res = { statusCode: 200, end: originalEnd } as any;

      middleware(req, res, next);
      res.end();

      expect(infoSpy).toHaveBeenCalled();
      const logOutput = infoSpy.mock.calls[0][0] as string;
      expect(logOutput).toContain('[REDACTED]');
      expect(logOutput).toContain('hello');
      expect(logOutput).not.toContain('123');
      expect(logOutput).not.toContain('xyz');
    });

    it('should redact sensitive keys even in malformed JSON or fallback format', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const plugin = viteRequestLogger({
        prefix: '/api',
        logBody: true,
        redactKeys: ['secret'],
        colors: false,
      });
      let middleware: any;
      const mockServer = {
        middlewares: {
          use: (fn: any) => {
            middleware = fn;
          },
        },
      } as any;

      (plugin.configureServer as (server: any) => void)(mockServer);

      const req = {
        url: '/api/login',
        method: 'POST',
        on: (event: string, callback: (chunk: Buffer) => void) => {
          if (event === 'data') {
            callback(Buffer.from('{"secret":"unparsed_val", malformed}'));
          }
        },
      } as any;
      const next = vi.fn();
      const originalEnd = vi.fn();
      const res = { statusCode: 200, end: originalEnd } as any;

      middleware(req, res, next);
      res.end();

      expect(infoSpy).toHaveBeenCalled();
      const logOutput = infoSpy.mock.calls[0][0] as string;
      expect(logOutput).toContain('[REDACTED]');
      expect(logOutput).not.toContain('unparsed_val');
    });

    it('should truncate request body exceeding maxBodyLength', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const plugin = viteRequestLogger({
        prefix: '/api',
        logBody: true,
        maxBodyLength: 20,
        colors: false,
      });
      let middleware: any;
      const mockServer = {
        middlewares: {
          use: (fn: any) => {
            middleware = fn;
          },
        },
      } as any;

      (plugin.configureServer as (server: any) => void)(mockServer);

      const req = {
        url: '/api/long',
        method: 'POST',
        on: (event: string, callback: (chunk: Buffer) => void) => {
          if (event === 'data') {
            callback(
              Buffer.from(JSON.stringify({ longField: 'this is a very long string field value' })),
            );
          }
        },
      } as any;
      const next = vi.fn();
      const originalEnd = vi.fn();
      const res = { statusCode: 200, end: originalEnd } as any;

      middleware(req, res, next);
      res.end();

      expect(infoSpy).toHaveBeenCalled();
      const logOutput = infoSpy.mock.calls[0][0] as string;
      expect(logOutput).toContain('[truncated]');
    });
  });
});
