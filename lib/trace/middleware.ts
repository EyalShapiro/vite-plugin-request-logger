import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import { requestStore } from './store';

/**
 * Connect-compatible middleware that extracts (or generates) a Trace ID
 * from the incoming request and stores it in {@link requestStore} for
 * the duration of the request lifecycle.
 */
export function vprlTraceMiddleware() {
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const traceId =
      (req.headers['x-trace-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      crypto.randomUUID();

    const interactionId = req.headers['x-vprl-interaction-id'] as string | undefined;

    res.setHeader('X-Trace-ID', traceId);

    requestStore.run({ traceId, interactionId }, next);
  };
}
