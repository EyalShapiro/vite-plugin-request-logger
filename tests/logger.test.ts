/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from 'vitest';
import viteRequestLogger from '../lib/index';
import { resolveLogger } from '../lib/utils/resolveLogger';

describe('Logger Option & Resolution', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should resolve silent logger preset to noops', () => {
    const logger = resolveLogger('silent');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    // Calling noop should not throw
    logger.info('test');
    logger.error('test');
  });

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
    let receivedThis: unknown = null;

    const customLoggerObj = {
      name: 'MyPinoLogger',
      info(_msg: string) {
        receivedThis = customLoggerObj;
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
    expect((receivedThis as any).name).toBe('MyPinoLogger');
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
