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
app.get('/api/users', (_req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Eyal' },
      { id: 2, name: 'Developer' },
    ],
  });
});

// POST API endpoint (demonstrates JSON body logging and sensitive key redaction)
app.post('/api/login', (_req, res) => {
  res.status(200).json({ success: true, message: 'Logged in successfully' });
});

// Ignored endpoint (will not appear in logs)
app.get('/health', (_req, res) => {
  res.send('OK');
});

app.get('/random', (_req, res) => {
  const randomUUID = crypto.randomUUID();
  const randomNum = Math.random();

  const timeStamp = Date.now();
  res.status(200).json({ randomUUID, timeStamp, randomNum });
});
app.post('/random', (req, res) => {
  const { num1, num2 } = req.body;

  if (typeof num1 !== 'number' || typeof num2 !== 'number') {
    const error = 'min and max must be numbers';
    console.error(error);
    return res.status(400).json({ error });
  }

  const randomNum = Math.random() * (num2 - num1) + num1;

  const timeStamp = Date.now();

  res.status(200).json({ timeStamp, randomNum });
});
app.post('/items/:index', (req, res) => {
  const { items } = req.body;
  const index = Number(req.params.index);
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items must be an array' });
  }
  if (!Number.isInteger(index) || index < 0 || index >= items.length) {
    return res.status(400).json({ error: 'Invalid index' });
  }
  const item = items[index];
  res.status(200).json({ item });
});

// Asset endpoint (skipped when skipAssets: true)
app.get('/static/style.css', (_req, res) => {
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
