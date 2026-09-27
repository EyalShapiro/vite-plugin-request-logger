import type { IncomingMessage, ServerResponse } from 'http';
import type { LoggerOptions } from './types';
import { DEFAULT_OPTIONS } from './constants/default-options';
import { normalizePrefix } from './utils/helpers';
import { safeExec } from './utils/safe-exec';
import { safeJsonStringify } from './utils/json.utils';
import { resolveLogger } from './utils/resolveLogger';
import { type RequestWithBody } from './utils/body.utils';
import { shouldSkip, getShouldLog } from './utils/filter.utils';
import { interceptResponseEnd } from './utils/responseLogger';

export { shouldSkip, getShouldLog };

/**
 * Standard Connect / Express middleware function signature.
 */
export type ConnectMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void;

/**
 * Creates a standalone Connect / Express compatible HTTP request logging middleware.
 * Can be used in standalone Node.js servers (Express, Fastify, Connect) or inside Vite dev/preview servers.
 *
 * @param {LoggerOptions} [userOptions={}] - Configuration options for the logger.
 * @returns {ConnectMiddleware} Connect/Express middleware function.
 */
export function createRequestLoggerMiddleware(userOptions: LoggerOptions = {}): ConnectMiddleware {
  const options = { ...DEFAULT_OPTIONS, ...userOptions } as LoggerOptions;
  const logger = resolveLogger(options.logger);
  const normalizedPrefix = normalizePrefix(options.prefix);

  return function requestLoggerMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ): void {
    try {
      const url = req.url || '/';

      const shouldLog = getShouldLog(options, req, url, normalizedPrefix, logger);
      if (!shouldLog) {
        next();
        return;
      }

      const startTime = performance.now();
      const method = req?.method || 'GET';
      let rawStreamBody = '';

      if (options.logBody) {
        const initialBody = (req as RequestWithBody).body;
        if (initialBody !== undefined && initialBody !== null) {
          rawStreamBody =
            typeof initialBody === 'string'
              ? initialBody
              : safeJsonStringify(initialBody, '{}') || '';
        }

        if (typeof req.on === 'function') {
          req.on('data', (chunk: unknown) => {
            safeExec(() => {
              if (chunk) {
                rawStreamBody += Buffer.isBuffer(chunk)
                  ? chunk.toString('utf8')
                  : typeof chunk === 'string'
                    ? chunk
                    : String(chunk);
              }
            });
          });
        }
      }

      interceptResponseEnd({
        options,
        logger,
        req,
        res,
        url,
        method,
        startTime,
        getRawBody: () => rawStreamBody,
      });
    } catch (middlewareErr) {
      if (!options.silentOnError) {
        logger.error('[vite-plugin-request-logger] Middleware error:', middlewareErr);
      }
    }

    next();
  };
}
