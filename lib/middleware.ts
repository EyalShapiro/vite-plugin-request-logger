import type { IncomingMessage, ServerResponse } from 'http';
import type { LoggerOptions, CustomLogger } from './types';
import { DEFAULT_OPTIONS } from './constants/default-options';
import { METHODS_WITH_BODY } from './http-method';
import { formatMessage } from './formatMessage';
import { normalizePrefix, truncateBody } from './utils/helpers';
import { safeExec } from './utils/safe-exec';
import { safeJsonParse, safeJsonStringify } from './utils/json.utils';
import { redact, redactWithRegex } from './utils/redact';
import { resolveLogger, type ReturnLogger } from './utils/resolveLogger';
import { writeLogToFile } from './utils/file.utils';

/**
 * Standard Connect / Express middleware signature.
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
 */
export function shouldSkip(url: string | undefined, options: LoggerOptions): boolean {
  if (!url) return false;

  if (options.skipAssets && ASSET_REGEX.test(url)) {
    return true;
  }

  if (options.ignorePaths && options.ignorePaths.length > 0) {
    return options.ignorePaths.some((path) =>
      typeof path === 'string' ? url.startsWith(path) : path.test(url),
    );
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
      if (options.filter) {
        return Boolean(options.filter(req));
      }
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
 * app.use(createRequestLoggerMiddleware({ prefix: '/api', format: 'dev' }));
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
      let rawBody = '';

      // Collect request body chunks for mutating HTTP methods
      if (
        options.logBody &&
        METHODS_WITH_BODY.includes(method as (typeof METHODS_WITH_BODY)[number])
      ) {
        req.on('data', (chunk: Buffer) => {
          safeExec(() => {
            rawBody += chunk.toString('utf8');
          });
        });
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
            if (options.logBody && rawBody.trim()) {
              let formattedBody = rawBody;
              const parsed = safeJsonParse(rawBody);

              if (parsed !== undefined) {
                // Successfully parsed as JSON → redact sensitive keys → pretty-print
                const redactedBody = redact(parsed, options.redactKeys);
                formattedBody = safeJsonStringify(redactedBody, { space: 2 }) ?? rawBody;
              } else {
                // Body is not valid JSON → fallback to regex-based redaction
                formattedBody = redactWithRegex(rawBody, options.redactKeys);
              }

              // Truncate body if exceeding maxBodyLength
              const maxLen = options?.maxBodyLength ?? DEFAULT_OPTIONS.maxBodyLength;
              if (formattedBody.length > maxLen) {
                formattedBody = truncateBody(formattedBody, maxLen);
              }
              logMessage += `\n  Body: ${formattedBody}`;
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
