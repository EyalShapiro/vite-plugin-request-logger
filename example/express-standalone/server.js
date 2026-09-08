import express from 'express';
import { createRequestLoggerMiddleware } from 'vite-plugin-request-logger';

const app = express();

// Parse incoming JSON body payloads
app.use(express.json());

// Attach the standalone request logger middleware
app.use(
  createRequestLoggerMiddleware({
    prefix: '/api',
    format: 'dev',
    colors: true,
    logBody: true,
    logHeaders: false,
    redactKeys: ['password', 'token', 'secret'],
    skipAssets: true,
    ignorePaths: ['/health'],
  }),
);

// GET API endpoint
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Eyal' },
      { id: 2, name: 'Developer' },
    ],
  });
});

// POST API endpoint (demonstrates JSON body logging and sensitive key redaction)
app.post('/api/login', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
  });
});

// Ignored endpoint (will not appear in logs)
app.get('/health', (req, res) => {
  res.send('OK');
});

// Asset endpoint (skipped when skipAssets: true)
app.get('/static/style.css', (req, res) => {
  res.type('text/css').send('body { margin: 0; }');
});

const PORT = 4000;
const server = app.listen(PORT, () => {
  console.log(`[Express Standalone Server] Running on http://localhost:${PORT}`);
  console.log(`- GET  /api/users      -> Logs request and duration`);
  console.log(`- POST /api/login      -> Logs request body with [REDACTED] password`);
  console.log(`- GET  /health         -> Ignored via ignorePaths`);
  console.log(`- GET  /static/style.css -> Ignored via skipAssets`);
});

export { app, server };
