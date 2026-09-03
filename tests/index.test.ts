import { describe, it, expect, vi, afterEach } from 'vitest';
import viteRequestLogger from '../lib/index';
import * as fs from 'fs';
import * as path from 'path';

describe('vite-plugin-request-logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create plugin with correct name and pre enforcement', () => {
    const plugin = viteRequestLogger();
    expect(plugin.name).toBe('vite-plugin-request-logger');
    expect(plugin.enforce).toBe('pre');
  });

  it('should safely attach middleware in configureServer', () => {
    const plugin = viteRequestLogger();
    const mockUse = vi.fn();
    const mockServer = {
      middlewares: {
        use: mockUse,
      },
    } as any;

    const configureServer = plugin.configureServer as (server: any) => void;
    configureServer(mockServer);
    expect(mockUse).toHaveBeenCalledTimes(1);
  });

  it('should skip logging for non-matching prefix paths', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const plugin = viteRequestLogger({ prefix: '/api' });
    let middleware: any;
    const mockServer = {
      middlewares: {
        use: (fn: any) => {
          middleware = fn;
        },
      },
    } as any;

    (plugin.configureServer as (server: any) => void)(mockServer);

    const req = { url: '/other/path', method: 'GET', on: vi.fn() } as any;
    const next = vi.fn();
    const res = { statusCode: 200, end: vi.fn() } as any;

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    // res.end should NOT have been patched since the prefix didn't match
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it('should log requests that match the prefix', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const plugin = viteRequestLogger({ prefix: '/api', colors: false });
    let middleware: any;
    const mockServer = {
      middlewares: {
        use: (fn: any) => {
          middleware = fn;
        },
      },
    } as any;

    (plugin.configureServer as (server: any) => void)(mockServer);

    const req = { url: '/api/users', method: 'GET', on: vi.fn() } as any;
    const next = vi.fn();
    const originalEnd = vi.fn();
    const res = { statusCode: 200, end: originalEnd } as any;

    middleware(req, res, next);

    // Call the patched res.end to trigger logging
    res.end();

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const logOutput = infoSpy.mock.calls[0][0] as string;
    expect(logOutput).toContain('GET');
    expect(logOutput).toContain('/api/users');
    expect(logOutput).toContain('200');
  });

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

    // Mock req.on('data', cb) to emit body data synchronously
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

    // Trigger the patched res.end
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
          // Malformed JSON — will hit the regex fallback path
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

  it('should write logs to a file if logToFile is specified', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});

    const testLogFile = 'temp_requests_test.log';
    const resolvedPath = path.resolve(process.cwd(), testLogFile);
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }

    const plugin = viteRequestLogger({
      prefix: '/api',
      logToFile: testLogFile,
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
      url: '/api/test-file',
      method: 'GET',
      on: vi.fn(),
    } as any;
    const next = vi.fn();
    const originalEnd = vi.fn();
    const res = { statusCode: 200, end: originalEnd } as any;

    middleware(req, res, next);
    res.end();

    // writeLogToFile is async (fire-and-forget), so we need to wait for the content
    await vi.waitFor(
      () => {
        expect(fs.existsSync(resolvedPath)).toBe(true);
        const content = fs.readFileSync(resolvedPath, 'utf8');
        expect(content).toContain('GET');
        expect(content).toContain('/api/test-file');
      },
      { timeout: 2000, interval: 50 },
    );

    fs.unlinkSync(resolvedPath);
  });

  describe('custom filter option', () => {
    it('should use custom filter function when provided', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const plugin = viteRequestLogger({
        filter: (req) => Boolean(req.url?.startsWith('/api') || req.url?.startsWith('/trpc')),
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

      const next1 = vi.fn();
      const req1 = { url: '/trpc/getUser', method: 'GET', on: vi.fn() } as any;
      const res1 = { statusCode: 200, end: vi.fn() } as any;
      middleware(req1, res1, next1);
      res1.end();

      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy.mock.calls[0][0]).toContain('/trpc/getUser');

      const next2 = vi.fn();
      const req2 = { url: '/static/asset.js', method: 'GET', on: vi.fn() } as any;
      const res2 = { statusCode: 200, end: vi.fn() } as any;
      middleware(req2, res2, next2);

      expect(next2).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('should silently handle error thrown inside custom filter when silentOnError is true', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const plugin = viteRequestLogger({
        filter: () => {
          throw new Error('Filter Boom');
        },
        silentOnError: true,
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

      const next = vi.fn();
      const req = { url: '/api/test', method: 'GET', on: vi.fn() } as any;
      const res = { statusCode: 200, end: vi.fn() } as any;

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('status code color mapping', () => {
    it('should apply correct ANSI color codes for HTTP status ranges', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const plugin = viteRequestLogger({ prefix: '/api', colors: true });
      let middleware: any;
      const mockServer = {
        middlewares: {
          use: (fn: any) => {
            middleware = fn;
          },
        },
      } as any;

      (plugin.configureServer as (server: any) => void)(mockServer);

      const testCases = [
        { code: 200, ansiColor: '\x1b[32m' }, // green
        { code: 301, ansiColor: '\x1b[36m' }, // cyan
        { code: 404, ansiColor: '\x1b[33m' }, // yellow
        { code: 500, ansiColor: '\x1b[31m' }, // red
      ];

      testCases.forEach(({ code, ansiColor }) => {
        infoSpy.mockClear();
        const req = { url: '/api/status', method: 'GET', on: vi.fn() } as any;
        const res = { statusCode: code, end: vi.fn() } as any;

        middleware(req, res, vi.fn());
        res.end();

        expect(infoSpy).toHaveBeenCalledTimes(1);
        const logOutput = infoSpy.mock.calls[0][0] as string;
        // Verify that the status code string is wrapped in the expected ANSI color code
        expect(logOutput).toContain(`${ansiColor}${code}\x1b[0m`);
      });
    });

    it('should omit ANSI color codes when colors is set to false', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const plugin = viteRequestLogger({ prefix: '/api', colors: false });
      let middleware: any;
      const mockServer = {
        middlewares: {
          use: (fn: any) => {
            middleware = fn;
          },
        },
      } as any;

      (plugin.configureServer as (server: any) => void)(mockServer);

      const req = { url: '/api/404', method: 'GET', on: vi.fn() } as any;
      const res = { statusCode: 404, end: vi.fn() } as any;

      middleware(req, res, vi.fn());
      res.end();

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const logOutput = infoSpy.mock.calls[0][0] as string;
      expect(logOutput).toContain('404');
      expect(logOutput).not.toContain('\x1b[');
    });
  });

  describe('customMsg option', () => {
    it('should append custom message suffix to log output when provided', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const plugin = viteRequestLogger({
        prefix: '/api',
        customMsg: (_req, _res, responseTimeMs) =>
          responseTimeMs >= 0 ? '[SLOW_WARN]' : undefined,
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

      const req = { url: '/api/slow', method: 'GET', on: vi.fn() } as any;
      const res = { statusCode: 200, end: vi.fn() } as any;

      middleware(req, res, vi.fn());
      res.end();

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const logOutput = infoSpy.mock.calls[0][0] as string;
      expect(logOutput).toContain('[SLOW_WARN]');
    });

    it('should leave log line unchanged when customMsg returns undefined or empty string', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const plugin = viteRequestLogger({
        prefix: '/api',
        customMsg: () => undefined,
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

      const req = { url: '/api/normal', method: 'GET', on: vi.fn() } as any;
      const res = { statusCode: 200, end: vi.fn() } as any;

      middleware(req, res, vi.fn());
      res.end();

      expect(infoSpy).toHaveBeenCalledTimes(1);
      const logOutput = infoSpy.mock.calls[0][0] as string;
      expect(logOutput).not.toContain('undefined');
    });

    it('should catch error thrown inside customMsg when silentOnError is true', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const plugin = viteRequestLogger({
        prefix: '/api',
        customMsg: () => {
          throw new Error('customMsg Boom');
        },
        silentOnError: true,
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

      const req = { url: '/api/test', method: 'GET', on: vi.fn() } as any;
      const res = { statusCode: 200, end: vi.fn() } as any;

      middleware(req, res, vi.fn());
      res.end();

      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('custom logger option', () => {
    it('should delegate logging to custom logger object', () => {
      const customInfo = vi.fn();
      const customError = vi.fn();

      const plugin = viteRequestLogger({
        prefix: '/api',
        logger: { info: customInfo, error: customError },
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

      const req = { url: '/api/custom-logger', method: 'GET', on: vi.fn() } as any;
      const res = { statusCode: 200, end: vi.fn() } as any;

      middleware(req, res, vi.fn());
      res.end();

      expect(customInfo).toHaveBeenCalledTimes(1);
      expect(customInfo.mock.calls[0][0]).toContain('/api/custom-logger');
    });

    it('should preserve this context binding for custom logger instances', () => {
      let receivedThis: any = null;

      const customLoggerObj = {
        name: 'MyPinoLogger',
        info(msg: string) {
          receivedThis = this;
        },
      };

      const plugin = viteRequestLogger({
        prefix: '/api',
        logger: customLoggerObj,
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

      const req = { url: '/api/bind-test', method: 'GET', on: vi.fn() } as any;
      const res = { statusCode: 200, end: vi.fn() } as any;

      middleware(req, res, vi.fn());
      res.end();

      expect(receivedThis).toBe(customLoggerObj);
      expect(receivedThis.name).toBe('MyPinoLogger');
    });

    it('should suppress output when logger preset is silent', () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const plugin = viteRequestLogger({
        prefix: '/api',
        logger: 'silent',
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

      const req = { url: '/api/silent', method: 'GET', on: vi.fn() } as any;
      const res = { statusCode: 200, end: vi.fn() } as any;

      middleware(req, res, vi.fn());
      res.end();

      expect(infoSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should fallback to log method when info or error is omitted', () => {
      const customLog = vi.fn();

      const plugin = viteRequestLogger({
        prefix: '/api',
        logger: { log: customLog },
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

      const req = { url: '/api/fallback', method: 'GET', on: vi.fn() } as any;
      const res = { statusCode: 200, end: vi.fn() } as any;

      middleware(req, res, vi.fn());
      res.end();

      expect(customLog).toHaveBeenCalledTimes(1);
      expect(customLog.mock.calls[0][0]).toContain('/api/fallback');
    });
  });
});
