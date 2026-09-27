import vike from 'vike/plugin';
import { defineConfig } from 'vite';
import vikeSolid from 'vike-solid/vite';
import { viteRequestLogger } from '../../dist/index.js';

export default defineConfig({
  plugins: [
    vike(),
    vikeSolid(),
    viteRequestLogger({
      prefix: '/api',
      logBody: true,
      logHeaders: true,
    }),
  ],
});
