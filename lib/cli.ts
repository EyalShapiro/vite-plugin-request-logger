#!/usr/bin/env node
import { createServer, preview, build } from 'vite';
import { viteRequestLogger } from './plugin';
import type { LoggerOptions } from './types';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'dev';

  console.log('\x1b[36m%s\x1b[0m', '🚀 [vite-plugin-request-logger CLI] Initializing...');

  const options: LoggerOptions = {
    logBody: true,
    format: 'dev',
  };

  if (command === 'dev' || command === 'serve') {
    const server = await createServer({
      configFile: false,
      plugins: [viteRequestLogger(options)],
      server: {
        port: 5173,
      },
    });
    await server.listen();
    server.printUrls();
    console.log(
      '\x1b[32m%s\x1b[0m',
      '✅ Request Logger CLI: Dev server running with request logger enabled.',
    );
  } else if (command === 'preview') {
    const previewServer = await preview({
      configFile: false,
      plugins: [viteRequestLogger(options)],
      preview: {
        port: 4173,
      },
    });
    previewServer.printUrls();
    console.log(
      '\x1b[32m%s\x1b[0m',
      '✅ Request Logger CLI: Preview server running with request logger enabled.',
    );
  } else if (command === 'build') {
    await build({
      configFile: false,
      plugins: [viteRequestLogger(options)],
    });
    console.log('\x1b[32m%s\x1b[0m', '✅ Request Logger CLI: Build completed.');
  } else {
    console.log(`
Usage: vite-plugin-request-logger [dev|preview|build]

Commands:
  dev      Start Vite dev server with automatic request logging (default)
  preview  Start Vite preview server with request logging
  build    Build application with request logger plugin
    `);
  }
}

main().catch((err) => {
  console.error('[vite-plugin-request-logger CLI] Error:', err);
  process.exit(1);
});
