/**
 * Next.js 14 (App Router) — SSR Example
 * Demonstrates vite-plugin-request-logger's standalone middleware
 * used as a server-side request logger inside Next.js custom server.
 *
 * Usage:
 *   npm install
 *   node server.mjs   (production-like custom server)
 *   # or for dev mode:
 *   npm run dev       (standard next dev, no custom server)
 */

import { createServer } from 'http';
import { createRequestLoggerMiddleware } from 'vite-plugin-request-logger/middleware';
import { vprlTraceMiddleware, getCurrentTraceId } from 'vite-plugin-request-logger/trace';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const port = +(process.env.PORT ?? '3005');

const app = next({ dev });
const handle = app.getRequestHandler();

// ── Trace & Request Logger Middleware ────────────────────────────────────────
const traceMiddleware = vprlTraceMiddleware();

const logger = createRequestLoggerMiddleware({
  prefix: '/api',
  format: 'dev',
  colors: true,
  logBody: true,
  logHeaders: false,
  redactKeys: ['password', 'token', 'secret', 'authorization', 'apiKey', 'creditCard'],
  skipAssets: true,
  ignorePaths: ['/health', '/ping', '/_next'],
  customMsg: () => {
    const traceId = getCurrentTraceId();
    return traceId ? `[trace:${traceId.slice(0, 8)}]` : undefined;
  },
  logToFile: dev ? undefined : 'logs/requests.log',
});

app.prepare().then(() => {
  createServer((req, res) => {
    // Run request through trace middleware & logger middleware, then hand off to Next.js
    traceMiddleware(req, res, () => {
      logger(req, res, () => {
        handle(req, res);
      });
    });
  }).listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Request logging & tracing enabled for /api/* routes`);
  });
});
