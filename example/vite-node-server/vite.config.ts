/**
 * @file vite.config.ts
 * @description
 * Vite configuration for the **vite-node-server** example.
 *
 * This example shows how to embed a complete Node.js API server **inside** the
 * Vite dev server — with **zero extra runtime dependencies** (no Express, no
 * Koa, no Fastify).  Everything runs in a single process via Vite's
 * `configureServer` plugin hook.
 *
 * ## What's demonstrated
 * - `viteRequestLogger` Vite plugin (server-side terminal logs)
 * - Pure `node:http`-style mock API routes via `configureServer`
 * - GET / POST / PUT / PATCH / DELETE endpoints
 * - 4xx / 5xx error responses for colour-coded status output
 * - Request body logging with automatic JSON pretty-printing
 * - Automatic redaction of `password`, `token`, `secret`, `authorization`
 * - `ignorePaths: ['/health']` to skip health-check routes
 * - `skipAssets: true` to silence Vite's own JS / CSS / source-map requests
 * - `format: 'dev'` — coloured timestamp + method + URL + status + time
 */

import { defineConfig, type Plugin } from 'vite';
import viteRequestLogger from '../../lib/index';
import type { IncomingMessage, ServerResponse } from 'node:http';

// ─── Tiny in-process "database" ────────────────────────────────────────────
const users: Record<string, { id: number; name: string; email: string }> = {
  '1': { id: 1, name: 'Alice', email: 'alice@example.com' },
  '2': { id: 2, name: 'Bob', email: 'bob@example.com' },
};

const products = [
  { id: 1, name: 'Widget', price: 9.99 },
  { id: 2, name: 'Gadget', price: 24.99 },
];

// ─── Helper: read raw request body ─────────────────────────────────────────
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => {
      data += chunk.toString('utf8');
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// ─── Helper: send JSON response ─────────────────────────────────────────────
function json(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

/**
 * Vite plugin that registers in-process API route handlers using
 * `server.middlewares.use()` — compatible with any Connect/Vite middleware.
 *
 * This replaces Express while staying entirely inside the Vite process.
 */
function nodeApiPlugin(): Plugin {
  return {
    name: 'node-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '/';
        const method = req.method ?? 'GET';

        // ── GET /api/users ───────────────────────────────────────────────
        if (method === 'GET' && url === '/api/users') {
          return json(res, 200, { users: Object.values(users) });
        }

        // ── GET /api/users/:id ───────────────────────────────────────────
        const userMatch = url.match(/^\/api\/users\/(\d+)$/);
        if (method === 'GET' && userMatch) {
          const user = users[userMatch[1]];
          if (!user) return json(res, 404, { error: 'User not found' });
          return json(res, 200, { user });
        }

        // ── POST /api/users ──────────────────────────────────────────────
        if (method === 'POST' && url === '/api/users') {
          const raw = await readBody(req);
          const body = JSON.parse(raw || '{}') as { name?: string };
          const id = String(Object.keys(users).length + 1);
          const created = {
            id: Number(id),
            name: body.name ?? 'Unknown',
            email: `${id}@example.com`,
          };
          users[id] = created;
          return json(res, 201, { user: created });
        }

        // ── PUT /api/users/:id ───────────────────────────────────────────
        if (method === 'PUT' && userMatch) {
          const user = users[userMatch[1]];
          if (!user) return json(res, 404, { error: 'User not found' });
          const raw = await readBody(req);
          const body = JSON.parse(raw || '{}') as Partial<typeof user>;
          Object.assign(user, body);
          return json(res, 200, { user });
        }

        // ── PATCH /api/users/:id ─────────────────────────────────────────
        if (method === 'PATCH' && userMatch) {
          const user = users[userMatch[1]];
          if (!user) return json(res, 404, { error: 'User not found' });
          const raw = await readBody(req);
          const body = JSON.parse(raw || '{}') as Partial<typeof user>;
          Object.assign(user, body);
          return json(res, 200, { user });
        }

        // ── DELETE /api/users/:id ────────────────────────────────────────
        if (method === 'DELETE' && userMatch) {
          const user = users[userMatch[1]];
          if (!user) return json(res, 404, { error: 'User not found' });
          delete users[userMatch[1]];
          return json(res, 200, { deleted: true });
        }

        // ── GET /api/products ────────────────────────────────────────────
        if (method === 'GET' && url === '/api/products') {
          return json(res, 200, { products });
        }

        // ── GET /api/not-found ───────────────────────────────────────────
        if (method === 'GET' && url === '/api/not-found') {
          return json(res, 404, { error: 'Resource not found' });
        }

        // ── GET /api/forbidden ───────────────────────────────────────────
        if (method === 'GET' && url === '/api/forbidden') {
          return json(res, 403, { error: 'Access forbidden' });
        }

        // ── POST /api/error ──────────────────────────────────────────────
        if (method === 'POST' && url === '/api/error') {
          return json(res, 500, { error: 'Simulated internal server error' });
        }

        // ── GET /health ──────────────────────────────────────────────────
        if (url === '/health') {
          res.statusCode = 200;
          res.end('OK');
          return;
        }

        // Not an API route — hand off to Vite's own middleware chain
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    // ── 1. Request logger (must come before the API plugin so it patches res.end first)
    viteRequestLogger({
      /** Log all /api/* requests; skip /health, /static assets, Vite internals */
      prefix: '/api',

      /** Coloured timestamp + method + URL + status + time */
      format: 'dev',

      /** Pretty-print JSON bodies for POST / PUT / PATCH / DELETE */
      logBody: true,

      /** Redact sensitive keys in the logged body */
      redactKeys: ['password', 'token', 'secret', 'authorization'],

      /** Skip .js / .css / image / font files */
      skipAssets: true,

      /** Skip the /health endpoint */
      ignorePaths: ['/health'],

      /** ANSI colours in the terminal */
      colors: true,

      /** Never crash the dev server on internal plugin errors */
      silentOnError: true,
    }),

    // ── 2. Pure Node.js in-process API (no Express / Fastify / etc.)
    nodeApiPlugin(),
  ],

  server: {
    port: 3003,
    host: true,
  },
});
