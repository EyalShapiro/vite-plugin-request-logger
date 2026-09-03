import { appendFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'http';

// Minimal structural types for Vite server/plugin — avoids cross-version
// type conflicts when consumers use a different Vite major than the plugin's
// devDependency (e.g. Vite 5 in the example, Vite 8 in the root).
interface MinimalConnect {
  use(handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void): void;
}
interface MinimalViteServer {
  middlewares: MinimalConnect;
}
interface VitePluginObject {
  name: string;
  enforce?: 'pre' | 'post';
  configureServer?: (server: MinimalViteServer) => void | (() => void);
}
import type { LoggerOptions, LoggerFormat, LoggerOption, LogFunction, CustomLogger } from './types';
import { redact } from './utils/redact';
import { type AnsiColor, ANSI_COLORS, METHOD_COLORS, stripAnsi } from './utils/AnsiColor';

export type { LoggerOptions, LoggerFormat, LoggerOption, LogFunction, CustomLogger };
const PLUGIN_NAME = 'vite-plugin-request-logger';
type StatusType = number | `${number}`;

const noop: LogFunction = () => {};

/**
 * Resolves a LoggerOption into bound info and error functions.
 * Handles 'silent', 'console', and custom objects (with Pino/Winston .bind context preservation).
 */
function resolveLogger(option?: LoggerOption): { info: LogFunction; error: LogFunction } {
  if (option === 'silent') {
    return { info: noop, error: noop };
  }

  if (typeof option === 'object' && option !== null) {
    const infoFn = option.info ?? option.log ?? console.info;
    const errorFn = option.error ?? option.log ?? console.error;

    return {
      info: infoFn.bind(option),
      error: errorFn.bind(option),
    };
  }

  return {
    info: console.info.bind(console),
    error: console.error.bind(console),
  };
}

/**
 * Returns the color for an HTTP status code.
 * @param {StatusType} statusCode  - HTTP response status code.
 * @returns {AnsiColor} ANSI color escape sequence.
 */
function statusColor(statusCode: StatusType): AnsiColor {
  const status = statusCode ? +statusCode : undefined;
  if (!status || Number.isNaN(status)) return ANSI_COLORS.reset;
  if (status >= 500) return ANSI_COLORS.red;
  if (status >= 400) return ANSI_COLORS.yellow;
  if (status >= 300) return ANSI_COLORS.cyan;
  if (status >= 200) return ANSI_COLORS.green;
  return ANSI_COLORS.reset;
}

/**
 * Truncates a formatted body string to the given maximum length
 * and appends a `[truncated]` indicator.
 *
 * @param formattedBody - The full body string to truncate.
 * @param maxLength     - Maximum number of characters to keep.
 * @returns The truncated string with a trailing `[truncated]` marker.
 */
function truncated(formattedBody: string, maxLength: number): string {
  return formattedBody.slice(0, maxLength) + '\n  ... [truncated]';
}

/**
 * Formats a single log line according to the chosen format preset.
 *
 * @param format       - The log format (`'dev'`, `'tiny'`, `'short'`, `'combined'`).
 * @param method       - HTTP method (e.g. `'GET'`, `'POST'`).
 * @param url          - The request URL path.
 * @param status       - HTTP response status code.
 * @param responseTimeMs - Elapsed time in milliseconds as a formatted string.
 * @param colors       - Whether to apply ANSI colors to the output.
 * @param timezone     - BCP 47 locale string for timestamp formatting (e.g. `'he-IL'`, `'en-US'`).
 * @returns            A formatted log line string.
 */
function formatMessage(
  format: LoggerOptions['format'],
  method: string,
  url: string,
  status: StatusType,
  responseTimeMs: string,
  colors: boolean,
  timezone: LoggerOptions['timezone'],
): string {
  const timestamp = new Date().toLocaleTimeString(timezone, { hour12: false });

  switch (format) {
    case 'dev': {
      // Plain-text fallback when colors are disabled
      if (!colors) {
        return `[${timestamp}] ${method.padEnd(6)} ${url} ${status} +${responseTimeMs}ms`;
      }

      // Resolve the ANSI color for the HTTP method (falls back to reset for unknown methods)
      const methodColor = (METHOD_COLORS as Record<string, AnsiColor>)[method] ?? ANSI_COLORS.reset;

      // Build a colorized log line: [timestamp] METHOD url status +Xms
      return (
        `${ANSI_COLORS.dim}[${timestamp}]${ANSI_COLORS.reset} ` +
        `${methodColor}${ANSI_COLORS.bold}${method.padEnd(6)}${ANSI_COLORS.reset} ` +
        `${url} ` +
        `${statusColor(status)}${status}${ANSI_COLORS.reset} ` +
        `${ANSI_COLORS.dim}+${responseTimeMs}ms${ANSI_COLORS.reset}`
      );
    }
    // Minimal one-liner: METHOD url status - Xms
    case 'tiny':
      return `${method} ${url} ${status} - ${responseTimeMs} ms`;
    // 'short' and 'combined' share the same compact format
    default:
      return `${method} ${url} ${status} ${responseTimeMs} ms`;
  }
}

/**
 * Appends a single log line to a file asynchronously.
 * ANSI color codes are stripped before writing so the file contains plain text.
 *
 * @param filePath - Absolute or relative path to the log file.
 * @param message  - The log message to append (may contain ANSI codes).
 * @param logError - Optional error logger function.
 */
async function writeLogToFile(
  filePath: string,
  message: string,
  logError: LogFunction = console.error.bind(console),
): Promise<void> {
  if (!message) return;
  const cleanLine = stripAnsi(message) + '\n';
  try {
    await appendFile(filePath, cleanLine, 'utf-8');
  } catch (error) {
    logError(`[vite-plugin-request-logger] Failed to write log file "${filePath}":`, error);
  }
}

/**
 * A Morgan-like HTTP request logging plugin for Vite.
 *
 * Intercepts requests in the Vite dev server middleware chain and logs
 * each request with method, URL, status code, and response time.
 * Optionally logs request headers and body, with automatic redaction of
 * sensitive fields.
 *
 * Only requests whose URL starts with `prefix` (default: `'/api'`) or match
 * the custom `filter` function are logged, ignoring Vite's internal HMR and assets.
 *
 * @param userOptions - Optional configuration. All fields have sensible defaults.
 * @returns A Vite `Plugin` object to include in `plugins: []`.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import viteRequestLogger from 'vite-plugin-request-logger';
 *
 * export default defineConfig({
 *   plugins: [
 *     viteRequestLogger({
 *       prefix: '/api',
 *       format: 'dev',
 *       logBody: true,
 *       redactKeys: ['password', 'token'],
 *     }),
 *   ],
 * });
 * ```
 */
export function viteRequestLogger(userOptions: LoggerOptions = {}): VitePluginObject {
  const options = {
    /** URL prefix — only requests starting with this path will be logged (when filter is not provided). */
    prefix: '/api',
    /** Custom filter function. If provided, overrides prefix filtering. */
    filter: undefined as ((req: IncomingMessage) => boolean) | undefined,
    /** Custom message callback appended to log lines. */
    customMsg: undefined as
      | ((req: IncomingMessage, res: ServerResponse, responseTimeMs: number) => string | undefined)
      | undefined,
    /** Custom logger instance or preset ('console' | 'silent'). */
    logger: 'console' as LoggerOption,
    /** Log format preset. */
    format: 'dev' as LoggerFormat,
    /** Log request bodies for POST/PUT/PATCH/DELETE. */
    logBody: true,
    /** Log request headers. */
    logHeaders: false,
    /** Maximum body characters before truncation. */
    maxBodyLength: 1000,
    /** Keys whose values are replaced with [REDACTED] in body and headers. */
    redactKeys: ['password', 'token', 'secret'] as string[],
    /** File path to append logs into. Undefined means no file logging. */
    logToFile: undefined as string | undefined,
    /** Enable ANSI colors in terminal output. */
    colors: true,
    /** Locale for timestamp formatting. */
    timezone: 'he-IL',
    /** Catch internal errors silently — never crash the dev server. */
    silentOnError: true,
    ...userOptions,
  };

  const logger = resolveLogger(options.logger);

  // Normalize prefix to always start with '/'
  const normalizedPrefix = options.prefix.startsWith('/') ? options.prefix : `/${options.prefix}`;

  return {
    name: PLUGIN_NAME,
    // Run before other plugins so the middleware is registered early
    enforce: 'pre',

    configureServer(server: MinimalViteServer) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        try {
          const url = req.url || '/';

          let shouldLog = false;
          try {
            if (options.filter) {
              shouldLog = Boolean(options.filter(req));
            } else {
              shouldLog = url.startsWith(normalizedPrefix);
            }
          } catch (filterErr) {
            if (!options.silentOnError) {
              logger.error(
                '[vite-plugin-request-logger] Custom filter function threw an error:',
                filterErr,
              );
            }
            shouldLog = false;
          }

          if (!shouldLog) {
            return next();
          }

          const startTime = performance.now();
          const method = req.method || 'GET';
          let rawBody = '';

          // Collect request body chunks for mutation methods
          if (options.logBody && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            req.on('data', (chunk: Buffer) => {
              try {
                rawBody += chunk.toString('utf8');
              } catch {
                // Ignore buffer decoding errors
              }
            });
          }

          // ── Monkey-patch res.end ─────────────────────────────────────────────
          // By wrapping res.end we capture the exact moment the response is sent,
          // which gives us the final status code and accurate response timing.
          const originalEnd = res.end;

          res.end = function (...args: unknown[]) {
            try {
              const duration = (performance.now() - startTime).toFixed(2);
              const status = res.statusCode;

              let logMessage = formatMessage(
                options.format,
                method,
                url,
                status,
                duration,
                options.colors,
                options.timezone,
              );

              // Append custom message suffix if customMsg callback is provided
              if (options.customMsg) {
                try {
                  const custom = options.customMsg(req, res, parseFloat(duration));
                  if (custom && typeof custom === 'string' && custom.trim()) {
                    logMessage += ` ${custom.trim()}`;
                  }
                } catch (customMsgErr) {
                  if (!options.silentOnError) {
                    logger.error(
                      '[vite-plugin-request-logger] customMsg callback threw an error:',
                      customMsgErr,
                    );
                  }
                }
              }

              // Append redacted headers if enabled
              if (options.logHeaders) {
                let headers = req.headers;
                if (options.redactKeys && options.redactKeys.length > 0) {
                  headers = redact(headers, options.redactKeys);
                }
                logMessage += `\n  Headers: ${JSON.stringify(headers)}`;
              }

              // Append redacted and formatted body if enabled
              if (options.logBody && rawBody.trim()) {
                let formattedBody = rawBody;
                try {
                  // Attempt to parse as JSON → redact sensitive keys → pretty-print
                  const parsed = JSON.parse(rawBody);
                  const redactedBody = redact(parsed, options.redactKeys);
                  formattedBody = JSON.stringify(redactedBody, null, 2);
                } catch {
                  // Body is not valid JSON — fall back to regex-based redaction
                  // so that key-value patterns like "password":"value" are still redacted
                  if (options.redactKeys && options.redactKeys.length > 0) {
                    for (const key of options.redactKeys) {
                      const regex = new RegExp(`("${key}"\\s*:\\s*")[^"]*(")`, 'gi');
                      formattedBody = formattedBody.replace(regex, `$1[REDACTED]$2`);
                    }
                  }
                }

                // Prevent flooding the terminal with very large payloads
                if (formattedBody.length > options.maxBodyLength) {
                  formattedBody = truncated(formattedBody, options.maxBodyLength);
                }

                logMessage += `\n  Body: ${formattedBody}`;
              }

              // Print the final log message using resolved logger
              logger.info(logMessage);

              // Optionally persist to a log file (async, non-blocking)
              if (options.logToFile) {
                void writeLogToFile(options.logToFile, logMessage, logger.error);
              }
            } catch (error) {
              if (!options.silentOnError) {
                logger.error('[vite-plugin-request-logger] Logging failed:', error);
              }
            }

            // Invoke the original res.end so the response is actually sent
            return originalEnd.apply(this, args as never);
          };
        } catch (err) {
          if (!options.silentOnError) {
            logger.error('[vite-plugin-request-logger] Middleware error:', err);
          }
        }

        next();
      });
    },
  };
}
export default viteRequestLogger;
