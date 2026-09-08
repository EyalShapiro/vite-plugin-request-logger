# vite-node-server — vite-plugin-request-logger example

A runnable example showing how to embed a **pure Node.js HTTP API server** inside the Vite dev server — with **zero extra runtime dependencies** (no Express, Fastify, or Koa).

Everything runs in a **single process** via Vite's `configureServer` plugin hook and Node.js `IncomingMessage` / `ServerResponse` objects.

## What's demonstrated

| Feature              | Detail                                                        |
| -------------------- | ------------------------------------------------------------- |
| `format: 'dev'`      | Coloured timestamp · method · URL · status · response time    |
| `logBody: true`      | Pretty-prints JSON bodies for POST / PUT / PATCH / DELETE     |
| `redactKeys`         | Hides `password`, `token`, `secret`, `authorization`          |
| `skipAssets: true`   | Silences Vite's own JS / CSS / source-map requests            |
| `ignorePaths`        | Skips `/health` from logging                                  |
| In-process API       | CRUD `/api/users` + `/api/products` with no Express           |
| Error routes         | 403, 404, 500 responses for colour-coded terminal output      |

## Running

```bash
cd example/vite-node-server
npm install
npm run dev
# Open http://localhost:3003
```

Or from the project root:

```bash
npm run example:vite-node
```

## API Routes

| Method | URL               | Description                        |
| ------ | ----------------- | ---------------------------------- |
| GET    | `/api/users`      | List all users                     |
| GET    | `/api/users/:id`  | Get a single user                  |
| POST   | `/api/users`      | Create a user (body logged)        |
| PUT    | `/api/users/:id`  | Replace a user (body logged)       |
| PATCH  | `/api/users/:id`  | Update a user field (body logged)  |
| DELETE | `/api/users/:id`  | Delete a user                      |
| GET    | `/api/products`   | List products                      |
| GET    | `/api/not-found`  | Simulated 404                      |
| GET    | `/api/forbidden`  | Simulated 403                      |
| POST   | `/api/error`      | Simulated 500                      |
| GET    | `/health`         | Health check (ignored by logger)   |

## How it works

```
Browser fetch  →  Vite dev server
                      │
               ┌──────▼──────────────────────────┐
               │  viteRequestLogger middleware    │  ← patches res.end, reads body
               └──────┬──────────────────────────┘
                      │
               ┌──────▼──────────────────────────┐
               │  nodeApiPlugin middleware        │  ← pure node:http routing
               └──────┬──────────────────────────┘
                      │
               ┌──────▼──────────────────────────┐
               │  Vite static file serving        │
               └─────────────────────────────────┘
```

The logger middleware is registered first (via Vite plugin `enforce: 'pre'`), so it intercepts every API response before it leaves the server, measuring accurate response time that includes all downstream middleware.
