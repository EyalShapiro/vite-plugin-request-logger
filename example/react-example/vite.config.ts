import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import viteRequestLogger from '../../lib/index.ts';

const statusCodes = [200, 201, 204, 400, 401, 403, 404, 500];
const randomFromList = <T>(list: T[]): T => {
  return list[Math.floor(Math.random() * list.length)];
};
export default defineConfig({
  plugins: [
    react(),

    viteRequestLogger({
      format: 'dev',
      logBody: true,
      ignoreStaticAssets: true,
    }),
    {
      name: 'mock-api',
      configureServer(server) {
        /* mock-api */
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            const statusCode = randomFromList(statusCodes);
            res.statusCode = statusCode;
            res.setHeader('Content-Type', 'application/json');

            res.end(
              JSON.stringify({
                status: statusCode >= 400 ? 'error' : 'success',
                statusCode,
                path: req.url,
                method: req.method,
              }),
            );

            return;
          }
          next();
        });
      },
    },
  ],

  server: {
    port: 3000,
    host: true,
  },
});
