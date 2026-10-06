import { defineConfig, loadEnv } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babelPlugin from '@rolldown/plugin-babel';
import viteRequestLogger from 'vite-plugin-request-logger';
import tailwindcss from '@tailwindcss/vite';
import { mockApiPlugin } from './server/mock-server.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const IS_PROD = mode === 'production';
  return {
    plugins: [
      tailwindcss(),
      react(),
      babelPlugin({ presets: [reactCompilerPreset()] }),
      viteRequestLogger({
        prefix: '/api',
        logBody: true,
        logHeaders: false,
        redactKeys: ['token', 'secret'],
      }),
      mockApiPlugin(),
    ],
    server: { port: Number(env.VITE_PORT ?? 5180), host: true, strictPort: true, cors: true },
    build: { outDir: 'dist', sourcemap: IS_PROD ? 'hidden' : true, target: 'esnext' },
  };
});
