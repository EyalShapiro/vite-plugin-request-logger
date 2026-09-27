# 🚀 Next.js SSR Example — vite-plugin-request-logger

Demonstrates two integration patterns for using `vite-plugin-request-logger` in a **Next.js 14 App Router** project.

---

## Option A: Custom Node.js Server (`server.mjs`)

Use the standalone middleware with a **custom HTTP server** for full request logging in both development and production.

```bash
npm install
node server.mjs
# Open http://localhost:3000
```

This gives you:
- Full `createRequestLoggerMiddleware` with all options (body logging, redaction, file logging, etc.)
- Works in **both dev and production** mode
- All requests pass through the logger before Next.js handles them

## Option B: Next.js App Router Middleware (`middleware.ts`)

Light-weight logging using the **Edge-compatible Next.js middleware** pattern.

```bash
npm run dev
# Requests to /api/* are logged automatically
```

This pattern:
- Runs at the **Edge** (or Node.js server depending on `runtime` setting)
- Logs every request to `/api/*` routes
- Zero overhead: does not require a custom server

---

## `createRequestLoggerMiddleware` with Next.js

```ts
// server.mjs
import { createServer } from 'http';
import { createRequestLoggerMiddleware } from 'vite-plugin-request-logger/middleware';
import next from 'next';

const logger = createRequestLoggerMiddleware({
  prefix: '/api',
  format: 'dev',
  colors: true,
  logBody: true,
  redactKeys: ['password', 'token', 'authorization'],
});

const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    logger(req, res, () => handle(req, res));
  }).listen(3000);
});
```

---

_Created by Eyal Shapiro_
