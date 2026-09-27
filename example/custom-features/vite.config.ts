import { defineConfig, type PluginOption, type Logger } from 'vite';
import viteRequestLogger from 'vite-plugin-request-logger';

export default defineConfig({
  plugins: [
    mockApi(),
    viteRequestLogger({
      // Custom filter function: match /api/* and /trpc/*
      filter: (req) => Boolean(req.url?.startsWith('/api') || req.url?.startsWith('/trpc')),

      // Custom message callback: flag slow requests
      customMsg: (_req, _res, responseTimeMs) =>
        responseTimeMs > 100 ? '⚠️ [SLOW REQUEST]' : '⚡ [FAST]',

      // 👉 Use Vite's own logger (set at plugin load time via configResolved hook)
      // The `viteLogger()` helper below bridges Vite's Logger to our CustomLogger interface.
      // For the purposes of this example we configure it directly here:
      logger: {
        info: (...args) => viteLoggerBridge.info(args.join(' ')),
        error: (...args) => viteLoggerBridge.error(args.join(' ')),
      },

      format: 'dev',
      colors: true,
      logBody: true,
    }),

    // This plugin captures Vite's native Logger and shares it with the request logger
    viteLoggerPlugin(),
  ],
  server: { port: 3002, host: true },
});

// ── Vite Logger Bridge ───────────────────────────────────────────────────────
//
// Vite's `configResolved` hook exposes `config.logger`. We capture it here so
// the request logger emits through Vite's own output (which is already set up
// with prefixes, colors, and log-level filtering).

let viteLoggerBridge: Logger = {
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  clearScreen: () => {},
  hasErrorLogged: () => false,
  hasWarned: false,
  warnOnce: console.warn.bind(console),
};

function viteLoggerPlugin(): PluginOption {
  return {
    name: 'vprl-vite-logger-bridge',
    configResolved(config) {
      // After Vite has resolved the full config, take its native logger
      viteLoggerBridge = config.logger;
    },
  };
}

// ── Mock API for demo ────────────────────────────────────────────────────────

function mockApi(): PluginOption {
  return {
    name: 'mock-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api') && !req.url?.startsWith('/trpc')) return next();
        const statusCode = req.url.includes('error') ? 500 : 200;
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json');

        const delay = req.url.includes('slow') ? 120 : 10;
        setTimeout(() => {
          const data = { ok: statusCode < 400, url: req.url, delay };
          res.end(JSON.stringify(data));
        }, delay);
      });
    },
  };
}
