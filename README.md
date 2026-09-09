# vite-plugin-request-logger

---

👨‍💻 **Created by** [Eyal Shapiro](https://github.com/EyalShapiro/vite-plugin-request-logger)
---

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
- 🧩 **Standalone middleware** — use `createRequestLoggerMiddleware` in Express, Fastify, or any Node.js server
- 🌐 **Browser console** — auto-injects a client-side interceptor for fetch & XHR visibility
- 💻 **Vite CLI binary** — zero-config instant dev server logging (`npx vprl` / `npx vite-plugin-request-logger`)

---

## Installation

[![View on npm](https://img.shields.io/badge/View_on-npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/vite-plugin-request-logger)

### npm https://www.npmjs.com/package/vite-plugin-request-logger

```bash
npm install -D vite-plugin-request-logger
```

[![View on npmx](https://img.shields.io/badge/View_on-npmx-F69220?style=for-the-badge)](https://npmx.dev/package/vite-plugin-request-logger)

### pnpm https://npmx.dev/package/vite-plugin-request-logger

```bash
pnpm add -D vite-plugin-request-logger
```

[![View on Yarn](https://img.shields.io/badge/View_on-Yarn-2C8EBB?style=for-the-badge&logo=yarn&logoColor=white)](https://yarnpkg.com/package?q=vite-plugin-request-logger&name=vite-plugin-request-logger)

### yarn https://yarnpkg.com/package?q=vite-plugin-request-logger&name=vite-plugin-request-logger

```bash
yarn add -D vite-plugin-request-logger
```

[![View on npm](https://img.shields.io/badge/View_on-npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/vite-plugin-request-logger)

```bash
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

## 💻 Vite CLI Usage

You can launch Vite directly with `vite-plugin-request-logger` enabled **without editing any configuration files** using our built-in CLI binary (`vprl` / `vite-plugin-request-logger`):

```bash
# Start Vite dev server with request logging
npx vprl dev

# Start preview server with request logging
npx vprl preview

# Run Vite build with request logging
npx vprl build
```

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

| Option          | Type                                       | Default                         | Description                                                                             |
| :-------------- | :----------------------------------------- | :------------------------------ | :-------------------------------------------------------------------------------------- |
| `prefix`        | `string`                                   | `'/api'`                        | Only log requests whose URL starts with this prefix. Use `'/'` for all.                 |
| `filter`        | `(req) => boolean`                         | `undefined`                     | Custom filter function (overrides `prefix` when provided).                              |
| `customMsg`     | `(req, res, responseTimeMs) => string`     | `undefined`                     | Callback returning a custom suffix string to append to log lines.                       |
| `logger`        | `CustomLogger \| 'console' \| 'silent'`    | `'console'`                     | Custom logger instance (e.g. Pino, Winston) or preset (`'silent'`).                     |
| `format`        | `'dev' \| 'tiny' \| 'short' \| 'combined'` | `'dev'`                         | Log line format preset.                                                                 |
| `logBody`       | `boolean`                                  | `true`                          | Log request body for POST / PUT / PATCH / DELETE.                                       |
| `maxBodyLength` | `number`                                   | `1000`                          | Max characters of body to display before truncating.                                    |
| `logHeaders`    | `boolean`                                  | `false`                         | Include all request headers in log output.                                              |
| `redactKeys`    | `string[]`                                 | `['password','token','secret']` | Keys replaced with `[REDACTED]` in bodies & headers (case-insensitive).                 |
| `logToFile`     | `string`                                   | `undefined`                     | Path to append plain-text logs (e.g. `'logs/requests.log'`).                            |
| `colors`        | `boolean`                                  | `true`                          | Enable ANSI colors in terminal output.                                                  |
| `timezone`      | `string \| ((d: Date) => string)`          | `'he-IL'`                       | BCP 47 locale for timestamp formatting (e.g. `'en-US'`) or a custom formatter function. |
| `ignorePaths`   | `(string \| RegExp)[]`                     | `undefined`                     | Paths or patterns to exclude from logging (e.g. `['/health', /^\/assets\//]`).          |
| `skipAssets`    | `boolean`                                  | `false`                         | Skip logging of static asset requests (`.js`, `.css`, images, fonts, …).                |
| `silentOnError` | `boolean`                                  | `true`                          | Silently catch internal plugin errors to prevent dev server crashes.                    |

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

### Custom filtering (multiple prefixes or regex)

You can pass a custom `filter` function to log requests matching multiple endpoints, regexes, or exclude specific routes:

```ts
viteRequestLogger({
  filter: (req) =>
    req.url?.startsWith('/api') ||
    req.url?.startsWith('/trpc') ||
    (req.url?.includes('/graphql') ?? false),
});
```

### Custom message suffix (`customMsg`)

Annotate log lines with custom labels (e.g. tagging slow requests or environment headers):

```ts
viteRequestLogger({
  customMsg: (req, res, responseTimeMs) => (responseTimeMs > 500 ? '⚠️ SLOW' : undefined),
});
```

### Custom Logger (Pino / Winston / Silent)

Pass any external logger instance (e.g. Pino, Winston) or the `'silent'` preset directly:

#### With Pino

```ts
import pino from 'pino';
import viteRequestLogger from 'vite-plugin-request-logger';

const pinoLogger = pino();

export default defineConfig({
  plugins: [
    viteRequestLogger({
      logger: pinoLogger,
    }),
  ],
});
```

#### With Winston

```ts
import winston from 'winston';
import viteRequestLogger from 'vite-plugin-request-logger';

const winstonLogger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

export default defineConfig({
  plugins: [
    viteRequestLogger({
      logger: winstonLogger,
    }),
  ],
});
```

#### Silent Mode (suppress all console output)

```ts
viteRequestLogger({
  logger: 'silent',
});
```

### Multiple prefixes (alternative)

You can also instantiate the plugin twice with different prefixes:

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
  logger: 'silent', // suppress terminal output entirely
});
```

> **Tip:** The log file is always plain text (ANSI codes stripped automatically),
> so it's safe to `tail -f logs/requests.log` or ship to any log aggregator.

### Skip health-check and asset routes

```ts
viteRequestLogger({
  ignorePaths: ['/health', '/ping', /^\/metrics/],
  skipAssets: true,
});
```

### Standalone middleware (Express / Fastify / pure Node.js)

Use `createRequestLoggerMiddleware` independently of Vite — perfect for production servers or any Connect-compatible framework:

```ts
import express from 'express';
import { createRequestLoggerMiddleware } from 'vite-plugin-request-logger';

const app = express();
app.use(
  createRequestLoggerMiddleware({
    prefix: '/api',
    format: 'dev',
    logBody: true,
    redactKeys: ['password', 'token'],
  }),
);
```

Or with a pure `node:http` server:

```ts
import http from 'node:http';
import { createRequestLoggerMiddleware } from 'vite-plugin-request-logger';

const logger = createRequestLoggerMiddleware({ prefix: '/api' });

const server = http.createServer((req, res) => {
  logger(req, res, () => {
    // your handler
    res.end('Hello');
  });
});
server.listen(3000);
```

---

## How It Works

The plugin registers a middleware in Vite's dev server using `configureServer`. It patches `res.end` to capture the status code and response time at the exact moment the response is sent — giving accurate timing that includes proxy round-trips.

**Request filtering:** Only URLs that start with `prefix` (default: `/api`) are logged. Vite's own HMR, source-file, and asset requests are always ignored without any extra configuration.

**Body capture:** For mutating methods (POST, PUT, PATCH, DELETE), request body chunks are collected via `req.on('data', …)` before `res.end` fires. The body is then pretty-printed (if JSON) and redacted before logging.

**File logging:** Logs are written to disk asynchronously (non-blocking) using `fs/promises`. ANSI color codes are stripped before writing so the file contains clean plain text.

---

## Runnable Examples

Five standalone examples are bundled under [`example/`](./example/):

| Example                                               | Port | Description                                           |
| :---------------------------------------------------- | :--- | :---------------------------------------------------- |
| [`react-query-axios`](./example/react-query-axios/)   | 5180 | React 19 + `@tanstack/react-query` + Axios Instance   |
| [`solid-ts`](./example/solid-ts/)                     | 5181 | SolidJS + TypeScript (`solid-ts`) signal logging      |
| [`client-interceptor`](./example/client-interceptor/) | 5173 | Dedicated browser fetch & XHR interceptor demo        |
| [`advanced`](./example/advanced/)                     | 3001 | All plugin options · Vite 5 · mock API · file logging |
| [`custom-features`](./example/custom-features/)       | 3002 | Custom `filter`, `customMsg`, Pino/Winston logger     |
| [`vite-node-server`](./example/vite-node-server/)     | 3003 | Pure Node.js API embedded in Vite — no Express        |
| [`react-example`](./example/react-example/)           | 3000 | React + Vite + axios                                  |
| [`express-standalone`](./example/express-standalone/) | 4000 | Standalone Express server (no Vite)                   |

### [`example/react-query-axios`](https://github.com/EyalShapiro/vite-plugin-request-logger/tree/main/example/react-query-axios) — React Query + Axios Instance

Demonstrates capturing requests sent via a custom **Axios Instance** (`axios.create(...)`) integrated with **TanStack React Query** (`useQuery`, `useMutation`).

```bash
cd example/react-query-axios
npm install
npm run dev
# Open http://localhost:5180
```

### [`example/solid-ts`](https://github.com/EyalShapiro/vite-plugin-request-logger/tree/main/example/solid-ts) — Solid-TS Example

Demonstrates fine-grained SolidJS signals and `createResource` fetching data logged seamlessly by `vite-plugin-request-logger`.

```bash
cd example/solid-ts
npm install
npm run dev
# Open http://localhost:5181
```

### [`example/advanced`](https://github.com/EyalShapiro/vite-plugin-request-logger/tree/main/example/advanced) — All options · Vite 5

Demonstrates every plugin option with an interactive browser UI. Uses **Vite 5** for maximum compatibility with older projects.

```bash
cd example/advanced
npm install
npm run dev
# Open http://localhost:3001
```

Features demonstrated: all HTTP methods, body logging, header logging, automatic redaction, file logging, prefix filtering.

### [`example/custom-features`](https://github.com/EyalShapiro/vite-plugin-request-logger/tree/main/example/custom-features) — Filter, Custom Message & Custom Logger

Demonstrates custom `filter` functions, `customMsg` status annotations, and external `logger` instances (Pino/Winston/Silent).

```bash
cd example/custom-features
npm install
npm run dev
# Open http://localhost:3002
```

### [`example/vite-node-server`](https://github.com/EyalShapiro/vite-plugin-request-logger/tree/main/example/vite-node-server) — Pure Node.js inside Vite · No Express

Shows how to embed a complete CRUD API using **only** `node:http` primitives inside the Vite middleware chain via `configureServer`. Zero extra runtime dependencies.

```bash
cd example/vite-node-server
npm install
npm run dev
# Open http://localhost:3003
```

### [`example/react-example`](https://github.com/EyalShapiro/vite-plugin-request-logger/tree/main/example/react-example) — React + Vite

React 19 app using axios for HTTP calls. The plugin logs every request in the terminal and the client-side interceptor mirrors them in the browser console.

```bash
cd example/react-example
npm install
npm run dev
# Open http://localhost:3000
```

### [`example/express-standalone`](https://github.com/EyalShapiro/vite-plugin-request-logger/tree/main/example/express-standalone) — Express Standalone

Uses `createRequestLoggerMiddleware` directly in an Express server — no Vite needed. Useful for production or preview servers.

```bash
cd example/express-standalone
npm install
npm start
# Server on http://localhost:4000
```

Run any example from the project root:

```bash
npm run example:react-query # port 5180
npm run example:solid       # port 5181
npm run example:advanced    # port 3001
npm run example:custom      # port 3002
npm run example:vite-node   # port 3003
npm run example:react       # port 3000
npm run example:express     # port 4000
```

---

## Automated Publishing & Release

Releases are published automatically to [npm](https://www.npmjs.com/package/vite-plugin-request-logger) via GitHub Actions when a new GitHub Release is created.

- **Workflow File:** [`.github/workflows/publish.yml`](./.github/workflows/publish.yml)
- **Changelog & Releases:** [github.com/EyalShapiro/vite-plugin-request-logger/releases](https://github.com/EyalShapiro/vite-plugin-request-logger/releases)

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

Source code and issue tracker: **[github.com/EyalShapiro/vite-plugin-request-logger](https://github.com/EyalShapiro/vite-plugin-request-logger)**

---

## License

[MIT](./LICENSE) © [Eyal Shapiro](https://github.com/EyalShapiro)
