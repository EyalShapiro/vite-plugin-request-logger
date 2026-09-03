import { defineConfig, type PluginOption } from 'vite';
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

      // Custom logger instance
      logger: {
        info: (msg) => console.info(`[CUSTOM-LOGGER-INFO] ${msg}`),
        error: (msg, ...args) => console.error(`[CUSTOM-LOGGER-ERROR] ${msg}`, ...args),
      },

      format: 'dev',
      colors: true,
      logBody: true,
    }),
  ],
  server: { port: 3002, host: true },
});

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
