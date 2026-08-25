# vite-plugin-request-logger

[![npm version](https://img.shields.io/npm/v/vite-plugin-request-logger.svg)](https://www.npmjs.com/package/vite-plugin-request-logger)
[![npm downloads](https://img.shields.io/npm/dm/vite-plugin-request-logger.svg)](https://www.npmjs.com/package/vite-plugin-request-logger)
[![license](https://img.shields.io/npm/l/vite-plugin-request-logger.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5%20%7C%206%20%7C%207%20%7C%208%2B-646cff.svg)](https://vitejs.dev/)

A **Morgan-like** HTTP request logger plugin for **Vite 5, 6, 7, 8+**.

Intercepts requests inside the Vite dev-server middleware chain and prints each API call — method, URL, status code, response time, request body, and headers — directly in your terminal. Zero dependencies. Zero config needed to start.

```
[00:12:34] POST   /api/users 201 +14.23ms
  Body: {
    "name": "Eyal",
    "password": "[REDACTED]"
  }
```

---

## Features

- 🚀 **Vite 5, 6, 7, 8+** — tested across all major versions
- 🎨 **Colored terminal output** — method, status, and timing, color-coded at a glance
- 📦 **Request body logging** — pretty-prints JSON bodies for POST / PUT / PATCH / DELETE
- 🛡️ **Automatic redaction** — sensitive keys (`password`, `token`, `secret`, …) replaced with `[REDACTED]`
- 🧹 **Prefix filtering** — only log requests under a given path (e.g. `/api`), ignoring all Vite internals
- 📁 **File logging** — optionally append plain-text logs to a file (ANSI codes stripped automatically)
- 🔒 **Fail-safe** — errors inside the plugin never crash your dev server
- 🦾 **Full TypeScript** — complete types and IntelliSense for all options

---

## Installation

```bash
# npm
npm install -D vite-plugin-request-logger

# pnpm
pnpm add -D vite-plugin-request-logger

# yarn
yarn add -D vite-plugin-request-logger

# bun
bun add -D vite-plugin-request-logger
```

---

## Quick Start

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import viteRequestLogger from 'vite-plugin-request-logger';

export default defineConfig({
  plugins: [
    viteRequestLogger(), // defaults: prefix '/api', format 'dev', logBody true
  ],
});
```

That's it. All requests to `/api/*` will be logged in your terminal automatically.

---

## Configuration

```ts
viteRequestLogger({
  prefix: '/api', // Only log URLs that start with this path
  format: 'dev', // 'dev' | 'tiny' | 'short' | 'combined'
  logBody: true, // Log request body (POST / PUT / PATCH / DELETE)
  maxBodyLength: 1000, // Truncate body output at N characters
  logHeaders: false, // Log all request headers
  redactKeys: ['password', 'token', 'secret'], // Redact sensitive fields
  logToFile: 'logs/dev.log', // Also write logs to a file (optional)
  colors: true, // ANSI colors in terminal
  timezone: 'he-IL', // Locale for timestamps (BCP 47)
  silentOnError: true, // Never crash the dev server on plugin error
});
```

### Options Reference

| Option          | Type                                       | Default                         | Description                                                             |
| :-------------- | :----------------------------------------- | :------------------------------ | :---------------------------------------------------------------------- |
| `prefix`        | `string`                                   | `'/api'`                        | Only log requests whose URL starts with this prefix. Use `'/'` for all. |
| `format`        | `'dev' \| 'tiny' \| 'short' \| 'combined'` | `'dev'`                         | Log line format preset.                                                 |
| `logBody`       | `boolean`                                  | `true`                          | Log request body for POST / PUT / PATCH / DELETE.                       |
| `maxBodyLength` | `number`                                   | `1000`                          | Max characters of body to display before truncating.                    |
| `logHeaders`    | `boolean`                                  | `false`                         | Include all request headers in log output.                              |
| `redactKeys`    | `string[]`                                 | `['password','token','secret']` | Keys replaced with `[REDACTED]` in bodies & headers (case-insensitive). |
| `logToFile`     | `string`                                   | `undefined`                     | Path to append plain-text logs (e.g. `'logs/requests.log'`).            |
| `colors`        | `boolean`                                  | `true`                          | Enable ANSI colors in terminal output.                                  |
| `timezone`      | `string`                                   | `'he-IL'`                       | BCP 47 locale for timestamp formatting (e.g. `'en-US'`, `'de-DE'`).     |
| `silentOnError` | `boolean`                                  | `true`                          | Silently catch internal plugin errors to prevent dev server crashes.    |

---

## Log Formats

| Format     | Example output                                     |
| :--------- | :------------------------------------------------- |
| `dev`      | `[12:00:00] POST   /api/users 201 +12.34ms`        |
| `tiny`     | `POST /api/users 201 - 12.34 ms`                   |
| `short`    | `POST /api/users 201 12.34 ms`                     |
| `combined` | `POST /api/users 201 12.34 ms` _(alias for short)_ |

---

## Examples

### Zero config (log only `/api`)

```ts
viteRequestLogger();
```

### Log all requests (including Vite HMR and assets)

```ts
viteRequestLogger({ prefix: '/' });
```

### Redact additional sensitive fields

```ts
viteRequestLogger({
  redactKeys: ['password', 'token', 'secret', 'apiKey', 'authorization', 'ssn'],
});
```

### Persist logs to a file

```ts
viteRequestLogger({
  logToFile: 'logs/dev-requests.log',
  colors: true, // colors in terminal; ANSI codes stripped automatically in the file
});
```

### Minimal terminal output

```ts
viteRequestLogger({
  format: 'tiny',
  logBody: false,
  logHeaders: false,
});
```

### Disable colors (CI / piped output)

```ts
viteRequestLogger({ colors: false });
```

### Full configuration example

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import viteRequestLogger from 'vite-plugin-request-logger';

export default defineConfig({
  plugins: [
    viteRequestLogger({
      prefix: '/api',
      format: 'dev',
      logBody: true,
      maxBodyLength: 2000,
      logHeaders: true,
      redactKeys: ['password', 'token', 'secret', 'authorization'],
      logToFile: 'logs/requests.log',
      colors: true,
      timezone: 'en-US',
      silentOnError: true,
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### With Vite proxy to a real backend

The plugin logs the request **before** it's forwarded — so you see the exact URL, body, and timing for every proxied call.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import viteRequestLogger from 'vite-plugin-request-logger';

export default defineConfig({
  plugins: [viteRequestLogger({ prefix: '/api' })],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000', // your Express / Fastify / NestJS server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

### With React (Vite + @vitejs/plugin-react)

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteRequestLogger from 'vite-plugin-request-logger';

export default defineConfig({
  plugins: [
    react(),
    viteRequestLogger({
      prefix: '/api',
      format: 'dev',
      logBody: true,
    }),
  ],
});
```

### With Vue (Vite + @vitejs/plugin-vue)

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import viteRequestLogger from 'vite-plugin-request-logger';

export default defineConfig({
  plugins: [
    vue(),
    viteRequestLogger({
      prefix: '/api',
      format: 'tiny', // minimal output for Vue projects
    }),
  ],
});
```

### With tRPC (log `/trpc` prefix)

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import viteRequestLogger from 'vite-plugin-request-logger';

export default defineConfig({
  plugins: [
    viteRequestLogger({
      prefix: '/trpc', // log all tRPC procedure calls
      format: 'dev',
      logBody: true,
    }),
  ],
});
```

### Multiple prefixes (log both `/api` and `/trpc`)

The plugin doesn't natively support multiple prefixes, but you can add it twice
with different options:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import viteRequestLogger from 'vite-plugin-request-logger';

export default defineConfig({
  plugins: [
    viteRequestLogger({ prefix: '/api', format: 'dev' }),
    viteRequestLogger({ prefix: '/trpc', format: 'tiny' }),
  ],
});
```

### Environment-based configuration

Enable verbose logging only in local dev; keep it minimal in staging:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import viteRequestLogger from 'vite-plugin-request-logger';

export default defineConfig(({ mode }) => ({
  plugins: [
    viteRequestLogger({
      prefix: '/api',
      format: mode === 'development' ? 'dev' : 'tiny',
      logBody: mode === 'development',
      logHeaders: mode === 'development',
      colors: mode === 'development',
      // write logs to file only in staging
      logToFile: mode === 'staging' ? 'logs/requests.log' : undefined,
    }),
  ],
}));
```

### Write logs to file without showing them in the terminal

```ts
viteRequestLogger({
  logToFile: 'logs/requests.log',
  colors: false,
  // Override console.info to suppress terminal output
  silentOnError: true,
});
```

> **Tip:** The log file is always plain text (ANSI codes stripped automatically),
> so it's safe to `tail -f logs/requests.log` or ship to any log aggregator.

---

## How It Works

The plugin registers a middleware in Vite's dev server using `configureServer`. It patches `res.end` to capture the status code and response time at the exact moment the response is sent — giving accurate timing that includes proxy round-trips.

**Request filtering:** Only URLs that start with `prefix` (default: `/api`) are logged. Vite's own HMR, source-file, and asset requests are always ignored without any extra configuration.

**Body capture:** For mutating methods (POST, PUT, PATCH, DELETE), request body chunks are collected via `req.on('data', …)` before `res.end` fires. The body is then pretty-printed (if JSON) and redacted before logging.

**File logging:** Logs are written to disk asynchronously (non-blocking) using `fs/promises`. ANSI color codes are stripped before writing so the file contains clean plain text.

---

## Runnable Examples

Two standalone examples are bundled under [`example/`](./example/):

### `example/base` — Minimal setup

The simplest possible configuration. Fires a few fetch calls on page load so you can see the plugin working immediately.

```bash
cd example/base
npm install
npm run dev
# Open http://localhost:3000
```

### `example/advanced` — All options · Vite 5

Demonstrates every plugin option with an interactive browser UI. Uses **Vite 5** for maximum compatibility with older projects.

```bash
cd example/advanced
npm install
npm run dev
# Open http://localhost:3001
```

Features demonstrated:

- All HTTP methods: GET, POST, PUT, PATCH, DELETE
- Body logging with automatic JSON pretty-printing
- Header logging
- Automatic redaction (`password`, `token`, `authorization`)
- File logging → `logs/requests.log`
- Requests outside `/api` are silently ignored

### `example/react-example` — React + Vite 8

A full React app with a click-to-fire UI, random status codes, and all plugin features.

```bash
cd example/react-example
npm install
npm run dev
# Open http://localhost:3000
```

Or run from the repo root:

```bash
npm run example:base      # minimal example  (port 3000)
npm run example:advanced  # advanced example (port 3001, Vite 5)
```

---

## Development & Contributing

```bash
# Install dependencies
npm install

# Build the library (watch mode)
npm run dev

# Run tests
npm test

# Type-check only (no emit)
npm run typecheck

# Lint
npm run lint

# Auto-fix formatting
npm run format:fix
```

---

## License

[MIT](./LICENSE) © [Eyal Shapiro](https://github.com/Eyal)
