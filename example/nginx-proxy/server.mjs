import http from 'node:http';
import { createRequestLoggerMiddleware } from 'vite-plugin-request-logger';
import { vprlTraceMiddleware, getCurrentTraceId, getCurrentInteractionId } from 'vite-plugin-request-logger/trace';

const loggerMiddleware = createRequestLoggerMiddleware({
  prefix: '/',
  format: 'dev',
  logHeaders: true,
  logBody: true,
  customMsg: () => {
    const traceId = getCurrentTraceId();
    const interactionId = getCurrentInteractionId();
    return `[trace:${traceId || 'none'}]` + (interactionId ? ` [interaction:${interactionId}]` : '');
  },
});

const traceMiddleware = vprlTraceMiddleware();

const server = http.createServer((req, res) => {
  traceMiddleware(req, res, () => {
    loggerMiddleware(req, res, () => {
      if (req.url === '/api/checkout' && req.method === 'POST') {
        const traceId = getCurrentTraceId();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', traceId }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Hello from behind Nginx proxy!' }));
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
