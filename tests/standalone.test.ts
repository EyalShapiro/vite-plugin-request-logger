import { describe, it, expect, vi } from 'vitest';
import http from 'node:http';
import { createRequestLoggerMiddleware } from '../lib/index';

describe('Standalone HTTP Server Integration', () => {
  it('should process HTTP requests via standalone middleware without Vite server', async () => {
    const logSpy = vi.fn();
    const middleware = createRequestLoggerMiddleware({
      logger: { info: logSpy, error: vi.fn() },
      colors: false,
    });

    const server = http.createServer((req, res) => {
      middleware(req, res, () => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, async () => {
        const address = server.address() as { port: number };
        try {
          const res = await fetch(`http://127.0.0.1:${address.port}/api/standalone-test`);
          expect(res.status).toBe(200);
          expect(logSpy).toHaveBeenCalled();
          expect(logSpy.mock.calls[0][0]).toContain('GET');
          expect(logSpy.mock.calls[0][0]).toContain('/api/standalone-test');
          expect(logSpy.mock.calls[0][0]).toContain('200');
        } finally {
          server.close(() => resolve());
        }
      });
    });
  });

  it('should skip asset requests when skipAssets is true', async () => {
    const logSpy = vi.fn();
    const middleware = createRequestLoggerMiddleware({
      skipAssets: true,
      logger: { info: logSpy, error: vi.fn() },
    });

    const server = http.createServer((req, res) => {
      middleware(req, res, () => {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end('console.log("asset")');
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, async () => {
        const address = server.address() as { port: number };
        try {
          const res = await fetch(`http://127.0.0.1:${address.port}/main.js`);
          expect(res.status).toBe(200);
          expect(logSpy).not.toHaveBeenCalled();
        } finally {
          server.close(() => resolve());
        }
      });
    });
  });

  it('should skip configured paths in ignorePaths', async () => {
    const logSpy = vi.fn();
    const middleware = createRequestLoggerMiddleware({
      ignorePaths: ['/health', /^\/metrics/],
      logger: { info: logSpy, error: vi.fn() },
    });

    const server = http.createServer((req, res) => {
      middleware(req, res, () => {
        res.writeHead(200);
        res.end('OK');
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, async () => {
        const address = server.address() as { port: number };
        try {
          await fetch(`http://127.0.0.1:${address.port}/health`);
          await fetch(`http://127.0.0.1:${address.port}/metrics/prometheus`);
          expect(logSpy).not.toHaveBeenCalled();
        } finally {
          server.close(() => resolve());
        }
      });
    });
  });
});
