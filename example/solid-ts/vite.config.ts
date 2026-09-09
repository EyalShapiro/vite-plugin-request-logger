import vike from 'vike/plugin';
import { defineConfig } from 'vite';
import vikeSolid from 'vike-solid/vite';
import { viteRequestLogger } from '../../lib/index';

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
