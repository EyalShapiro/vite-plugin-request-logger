/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from 'vitest';
import viteRequestLogger, { createRequestLoggerMiddleware } from '../lib/index';

describe('Middleware & Request Interception', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should export createRequestLoggerMiddleware as a valid Connect middleware function', () => {
    const middleware = createRequestLoggerMiddleware();
    expect(typeof middleware).toBe('function');
    expect(middleware.length).toBe(3);
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
    res.end();

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const logOutput = infoSpy.mock.calls[0][0] as string;
    expect(logOutput).toContain('GET');
    expect(logOutput).toContain('/api/users');
    expect(logOutput).toContain('200');
  });

  it('should work when used directly as standalone middleware', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const middleware = createRequestLoggerMiddleware({ prefix: '/standalone', colors: false });

    const req = { url: '/standalone/ping', method: 'GET', on: vi.fn() } as any;
    const next = vi.fn();
    const originalEnd = vi.fn();
    const res = { statusCode: 200, end: originalEnd } as any;

    middleware(req, res, next);
    res.end();

    expect(next).toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0][0]).toContain('/standalone/ping');
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
});
