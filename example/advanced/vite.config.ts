/**
 * @file vite.config.ts
 * @description
 * Vite 5 configuration for the **advanced** vite-plugin-request-logger example.
 *
 * This config demonstrates every available plugin option:
 * - `prefix`           — only `/api/*` requests are logged
 * - `format`           — `'dev'` colored format
 * - `logBody`          — pretty-prints POST/PUT/PATCH/DELETE bodies
 * - `logHeaders`       — captures and logs all request headers
 * - `redactKeys`       — hides `password`, `token`, `secret`, `authorization`
 * - `logToFile`        — appends plain-text logs to `logs/requests.log`
 * - `colors`           — ANSI colors in the terminal
 * - `maxBodyLength`    — truncates large bodies after 2000 characters
 * - `timezone`         — timestamp locale set to `'en-US'`
 * - `silentOnError`    — never crashes the dev server on plugin errors
 *
 * A lightweight **mock-api** plugin is included so the example works
 * standalone without a real backend. It responds to any `/api/*` route
 * with a random status code and JSON body so you can observe colored output.
 */

import { defineConfig, loadEnv, type PluginOption } from 'vite';
// Import directly from the library source so changes are reflected instantly
// In a real project you would import from 'vite-plugin-request-logger'
import viteRequestLogger from '../../lib/index';

/** HTTP status codes the mock server cycles through to demo color-coded output. */
const STATUS_CODES = [200, 201, 204, 400, 401, 403, 404, 500] as const;

/**
 * Picks a random element from a non-empty array.
 *
 * @param list - The source array.
 * @returns A randomly selected element.
 */
function randomFrom<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      // ── Mock API plugin ────────────────────────────────────────────────────────
      // Handles /api/* routes in-process so the example works without a backend.
      mockApi(),
      // ── vite-plugin-request-logger (all options) ──────────────────────────────
      viteRequestLogger({
        /** Only log requests whose URL starts with /api. */
        prefix: '/api',

        /** Colored timestamp + method + URL + status + time. */
        format: 'dev',

        /** Pretty-print request bodies for POST, PUT, PATCH, DELETE. */
        logBody: true,

        /** Truncate body output at 2 000 characters. */
        maxBodyLength: 2000,

        /** Also log all incoming request headers. */
        logHeaders: true,

        /**
         * Keys whose values will be replaced with [REDACTED].
         * Matching is case-insensitive.
         */
        redactKeys: ['password', 'token', 'secret', 'authorization', 'apiKey'],

        /**
         * Append plain-text (no ANSI) logs to this file.
         * The file is created automatically if it does not exist.
         */
        logToFile: 'logs/requests.log',

        /** Enable ANSI colors in terminal. */
        colors: true,

        /** Timestamp locale — change to match your location (BCP 47). */
        timezone: 'en-US',

        /** Never crash the Vite dev server on internal plugin errors. */
        silentOnError: true,
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
      port: Number(env.VITE_PORT ?? 3001),
      host: true,
    },
  };
});
function mockApi(): PluginOption {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) return next();
        const statusCode = randomFrom(STATUS_CODES);
        const ok = statusCode < 400;
        const message = !ok ? 'Simulated error response' : 'Success';
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json');
        const data = { ok, statusCode, path: req.url, method: req.method, message };
        res.end(JSON.stringify(data));
      });
    },
  };
}
