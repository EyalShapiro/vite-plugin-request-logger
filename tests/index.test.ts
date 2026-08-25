import { describe, it, expect, vi } from 'vitest';
import viteRequestLogger from '../lib/index';
import * as fs from 'fs';
import * as path from 'path';

describe('vite-plugin-request-logger', () => {
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

  it('should skip logging for ignored paths', () => {
    const plugin = viteRequestLogger({
      ignorePaths: ['/ignored-prefix'],
    });
    const infoMock = vi.fn();
    let middleware: any;
    const mockServer = {
      config: { logger: { info: infoMock } },
      middlewares: {
        use: (fn: any) => {
          middleware = fn;
        },
      },
    } as any;

    (plugin.configureServer as (server: any) => void)(mockServer);

    const req = { url: '/ignored-prefix/some-path', method: 'GET' } as any;
    const next = vi.fn();
    let finishCallback: (() => void) | undefined;
    const res = {
      statusCode: 200,
      on: (event: string, callback: () => void) => {
        if (event === 'finish') finishCallback = callback;
      },
    } as any;

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    if (finishCallback) {
      finishCallback();
    }
    expect(infoMock).not.toHaveBeenCalled();
  });

  it('should skip static assets if ignoreStaticAssets is true', () => {
    const plugin = viteRequestLogger({
      ignoreStaticAssets: true,
    });
    const infoMock = vi.fn();
    let middleware: any;
    const mockServer = {
      config: { logger: { info: infoMock } },
      middlewares: {
        use: (fn: any) => {
          middleware = fn;
        },
      },
    } as any;

    (plugin.configureServer as (server: any) => void)(mockServer);

    const req = { url: '/assets/logo.png', method: 'GET' } as any;
    const next = vi.fn();
    let finishCallback: (() => void) | undefined;
    const res = {
      statusCode: 200,
      on: (event: string, callback: () => void) => {
        if (event === 'finish') finishCallback = callback;
      },
    } as any;

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    if (finishCallback) {
      finishCallback();
    }
    expect(infoMock).not.toHaveBeenCalled();
  });

  it('should redact sensitive keys in request body', () => {
    const plugin = viteRequestLogger({
      logBody: true,
      redactKeys: ['password', 'secret', 'token'],
    });
    const infoMock = vi.fn();
    let middleware: any;
    const mockServer = {
      config: { logger: { info: infoMock } },
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
          callback(Buffer.from(JSON.stringify({ password: '123', token: 'xyz', safe: 'hello' })));
        }
      },
    } as any;
    const next = vi.fn();
    let finishCallback: (() => void) | undefined;
    const res = {
      statusCode: 200,
      on: (event: string, callback: () => void) => {
        if (event === 'finish') finishCallback = callback;
      },
    } as any;

    middleware(req, res, next);
    if (finishCallback) finishCallback();

    expect(infoMock).toHaveBeenCalled();
    const logOutput = infoMock.mock.calls[0][0];
    expect(logOutput).toContain('[REDACTED]');
    expect(logOutput).toContain('hello');
    expect(logOutput).not.toContain('123');
    expect(logOutput).not.toContain('xyz');
  });

  it('should redact sensitive keys even in malformed JSON or fallback format', () => {
    const plugin = viteRequestLogger({
      logBody: true,
      redactKeys: ['secret'],
    });
    const infoMock = vi.fn();
    let middleware: any;
    const mockServer = {
      config: { logger: { info: infoMock } },
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
    let finishCallback: (() => void) | undefined;
    const res = {
      statusCode: 200,
      on: (event: string, callback: () => void) => {
        if (event === 'finish') finishCallback = callback;
      },
    } as any;

    middleware(req, res, next);
    if (finishCallback) finishCallback();

    expect(infoMock).toHaveBeenCalled();
    const logOutput = infoMock.mock.calls[0][0];
    expect(logOutput).toContain('[REDACTED]');
    expect(logOutput).not.toContain('unparsed_val');
  });

  it('should truncate request body exceeding maxBodyLength', () => {
    const plugin = viteRequestLogger({
      logBody: true,
      maxBodyLength: 20,
    });
    const infoMock = vi.fn();
    let middleware: any;
    const mockServer = {
      config: { logger: { info: infoMock } },
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
    let finishCallback: (() => void) | undefined;
    const res = {
      statusCode: 200,
      on: (event: string, callback: () => void) => {
        if (event === 'finish') finishCallback = callback;
      },
    } as any;

    middleware(req, res, next);
    if (finishCallback) finishCallback();

    expect(infoMock).toHaveBeenCalled();
    const logOutput = infoMock.mock.calls[0][0];
    expect(logOutput).toContain('[truncated]');
  });

  it('should write logs to a file if logToFile is specified', () => {
    const testLogFile = 'temp_requests_test.log';
    const resolvedPath = path.resolve(process.cwd(), testLogFile);
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }

    const plugin = viteRequestLogger({
      logToFile: testLogFile,
    });
    const infoMock = vi.fn();
    let middleware: any;
    const mockServer = {
      config: { logger: { info: infoMock } },
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
      on: () => {},
    } as any;
    const next = vi.fn();
    let finishCallback: (() => void) | undefined;
    const res = {
      statusCode: 200,
      on: (event: string, callback: () => void) => {
        if (event === 'finish') finishCallback = callback;
      },
    } as any;

    middleware(req, res, next);
    if (finishCallback) finishCallback();

    expect(fs.existsSync(resolvedPath)).toBe(true);
    const content = fs.readFileSync(resolvedPath, 'utf8');
    expect(content).toContain('GET');
    expect(content).toContain('/api/test-file');

    fs.unlinkSync(resolvedPath);
  });
});
