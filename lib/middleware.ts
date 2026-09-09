import type { IncomingMessage, ServerResponse } from 'http';
import type { LoggerOptions, CustomLogger } from './types';
import { DEFAULT_OPTIONS } from './constants/default-options';
import { formatMessage } from './formatMessage';
import { normalizePrefix } from './utils/helpers';
import { safeExec } from './utils/safe-exec';
import { safeJsonStringify } from './utils/json.utils';
import { redact } from './utils/redact';
import { resolveLogger, type ReturnLogger } from './utils/resolveLogger';
import { writeLogToFile } from './utils/file.utils';
import { extractRequestBody, formatRequestBody, type RequestWithBody } from './utils/body.utils';

/**
 * Standard Connect / Express middleware function signature.
 *
 * @param {IncomingMessage} req - Node.js HTTP request.
 * @param {ServerResponse} res - Node.js HTTP response.
 * @param {(err?: unknown) => void} next - Callback to proceed to the next middleware.
 */
export type ConnectMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void;

/** Regular expression to detect common static asset extensions. */
const ASSET_REGEX = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif|mp4|webm)$/i;

/**
 * Checks whether an incoming request URL should be skipped from logging
 * according to `skipAssets` or `ignorePaths` configurations.
 *
 * @param {string | undefined} url - The request URL path.
 * @param {LoggerOptions} options - Logger options.
 * @returns {boolean} `true` if the request should be skipped; otherwise `false`.
 *
 * @example
 * ```ts
 * shouldSkip('/assets/logo.svg', { skipAssets: true }); // true
 * shouldSkip('/api/users', { skipAssets: true }); // false
 * ```
 */
export function shouldSkip(url: string | undefined, options: LoggerOptions): boolean {
  if (!url) return false;

  if (options.skipAssets && ASSET_REGEX.test(url)) return true;

  if (options.ignorePaths && options.ignorePaths.length > 0) {
    return options.ignorePaths.some((path) => {
      return typeof path === 'string' ? url.startsWith(path) : path.test(url);
    });
  }

  return false;
}

/**
 * Determines whether the current incoming request should be logged
 * based on custom `filter` function, `prefix` matching, and skip rules.
 *
 * @param {LoggerOptions} options - Logger configuration options.
 * @param {IncomingMessage} req - The incoming HTTP request.
 * @param {string} url - The resolved request URL path.
 * @param {string} normalizedPrefix - The normalized URL prefix filter.
 * @param {CustomLogger | ReturnLogger} logger - The resolved logger instance.
 * @returns {boolean} `true` if the request should be logged; otherwise `false`.
 *
 * @example
 * ```ts
 * const shouldLog = getShouldLog(options, req, '/api/users', '/api', logger);
 * ```
 */
export function getShouldLog(
  options: LoggerOptions,
  req: IncomingMessage,
  url: string,
  normalizedPrefix: string,
  logger: CustomLogger | ReturnLogger,
): boolean {
  return safeExec(
    () => {
      if (shouldSkip(url, options)) return false;
      if (options.filter) return Boolean(options.filter(req));
      return url.startsWith(normalizedPrefix);
    },
    false,
    (filterErr: unknown) => {
      if (!options.silentOnError) {
        logger.error?.(
          '[vite-plugin-request-logger] Custom filter function threw an error:',
          filterErr,
        );
      }
    },
  );
}

/**
 * Creates a standalone Connect / Express compatible HTTP request logging middleware.
 * Can be used in standalone Node.js servers (Express, Fastify, Connect) or inside Vite dev/preview servers.
 *
 * @param {LoggerOptions} [userOptions={}] - Configuration options for the logger.
 * @returns {ConnectMiddleware} Connect/Express middleware function.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { createRequestLoggerMiddleware } from 'vite-plugin-request-logger';
 *
 * const app = express();
 * app.use(createRequestLoggerMiddleware({ prefix: '/api', format: 'dev', logBody: true }));
 * ```
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
      const method = req.method || 'GET';
      let rawStreamBody = '';

      // Collect request body chunks for mutating HTTP methods or when logBody is enabled
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

      // ── Monkey-patch res.end ─────────────────────────────────────────────
      const originalEnd = res.end;

      res.end = function interceptedEnd(...args: unknown[]) {
        safeExec(
          () => {
            const duration = (performance.now() - startTime).toFixed(2);
            const status = res.statusCode;

            let logMessage = formatMessage({
              format: options.format,
              method,
              url,
              status,
              responseTimeMs: duration,
              colors: options.colors,
              timezone: options.timezone,
            });

            // Append custom message suffix if customMsg callback is provided
            if (options.customMsg) {
              safeExec(
                () => {
                  const custom = options.customMsg?.(req, res, parseFloat(duration));
                  if (custom && typeof custom === 'string' && custom.trim()) {
                    logMessage += ` ${custom.trim()}`;
                  }
                },
                undefined,
                (customMsgErr: unknown) => {
                  if (!options.silentOnError) {
                    logger.error(
                      '[vite-plugin-request-logger] customMsg callback threw an error:',
                      customMsgErr,
                    );
                  }
                },
              );
            }

            // Append redacted headers if enabled
            if (options.logHeaders) {
              let headers = req.headers;
              if (options.redactKeys && options.redactKeys.length > 0) {
                headers = redact(headers, options.redactKeys);
              }
              logMessage += `\n  Headers: ${safeJsonStringify(headers, '{}')}`;
            }

            // Append redacted and formatted body if enabled
            if (options.logBody) {
              const candidate = extractRequestBody(req as RequestWithBody, rawStreamBody);
              const formattedBody = formatRequestBody(candidate, options);
              if (formattedBody) {
                logMessage += `\n  Body: ${formattedBody}`;
              }
            }

            // Print the final log message using resolved logger
            logger.info(logMessage);

            // Optionally persist to a log file (async, non-blocking)
            if (options.logToFile) {
              void writeLogToFile(options.logToFile, logMessage, logger.error);
            }
          },
          undefined,
          (loggingErr: unknown) => {
            if (!options.silentOnError) {
              logger.error('[vite-plugin-request-logger] Logging failed:', loggingErr);
            }
          },
        );

        // Invoke the original res.end to complete the HTTP response
        return originalEnd.apply(this, args as never);
      };
    } catch (middlewareErr) {
      if (!options.silentOnError) {
        logger.error('[vite-plugin-request-logger] Middleware error:', middlewareErr);
      }
    }

    next();
  };
}
