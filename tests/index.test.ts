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
});
