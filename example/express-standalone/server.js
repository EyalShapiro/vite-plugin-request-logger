import http from 'node:http';
import { createRequestLoggerMiddleware } from '../../dist/index.js';

// Create the standalone request logger middleware
const requestLogger = createRequestLoggerMiddleware({
  prefix: '/api',
  format: 'dev',
  colors: true,
  logBody: true,
  redactKeys: ['password', 'token', 'secret'],
  skipAssets: true,
  ignorePaths: ['/health'],
});

const server = http.createServer((req, res) => {
  // Use the standalone middleware
  requestLogger(req, res, () => {
    if (req.url?.startsWith('/api/users')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ users: [{ id: 1, name: 'Eyal' }] }));
      return;
    }

    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`[Standalone Server] Running at http://localhost:${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/api/users`);
});
