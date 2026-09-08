# Standalone Request Logger Example

Demonstrates `createRequestLoggerMiddleware` from `vite-plugin-request-logger` running in a standalone Node.js / Express server without Vite.

## Running the Example

```bash
node server.js
```

Then visit:
- `http://localhost:4000/api/users` (will be logged in terminal with response timing and status)
- `http://localhost:4000/health` (ignored via `ignorePaths`)
