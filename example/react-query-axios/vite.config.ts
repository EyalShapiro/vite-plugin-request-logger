import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import babelPlugin from '@rolldown/plugin-babel';
import viteRequestLogger from 'vite-plugin-request-logger';

export default defineConfig({
  plugins: [
    react(),
    babelPlugin({ presets: [reactCompilerPreset()] }),
    viteRequestLogger({
      prefix: '/api',
      logBody: true,
      logHeaders: false,
      redactKeys: ['token', 'secret'],
    }),
    {
      name: 'mock-api-endpoints',
      configureServer(server) {
        server.middlewares.use('/api/todos', (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader('Content-Type', 'application/json');
          if (req.method === 'GET') {
            res.end(
              JSON.stringify([
                { id: 1, title: 'Learn Vite Request Logger', completed: true },
                { id: 2, title: 'Integrate React Query & Axios', completed: true },
                { id: 3, title: 'Build modern Vite plugin', completed: false },
              ]),
            );
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();
            });
            req.on('end', () => {
              res.end(
                JSON.stringify({
                  success: true,
                  message: 'Todo added successfully',
                  data: body ? JSON.parse(body) : null,
                }),
              );
            });
          }
        });
      },
    },
  ],
  server: {
    port: 5180,
  },
});
