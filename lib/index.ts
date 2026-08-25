import { appendFile } from 'node:fs/promises';
import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import type { LoggerOptions, LoggerFormat } from './types';
import { redact } from './utils/redact';
import { type AnsiColor, ANSI_COLORS, METHOD_COLORS, stripAnsi } from './utils/AnsiColor';

export type { LoggerOptions, LoggerFormat };
const PLUGIN_NAME = 'vite-plugin-api-logger';
type StatusType = number | `${number}`;

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
  return ANSI_COLORS.green;
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
      if (!colors) {
        return `[${timestamp}] ${method.padEnd(6)} ${url} ${status} +${responseTimeMs}ms`;
      }

      const methodColor = (METHOD_COLORS as Record<string, AnsiColor>)[method] ?? ANSI_COLORS.reset;

      return (
        `${ANSI_COLORS.dim}[${timestamp}]${ANSI_COLORS.reset} ` +
        `${methodColor}${ANSI_COLORS.bold}${method.padEnd(6)}${ANSI_COLORS.reset} ` +
        `${url} ` +
        `${statusColor(status)}${status}${ANSI_COLORS.reset} ` +
        `${ANSI_COLORS.dim}+${responseTimeMs}ms${ANSI_COLORS.reset}`
      );
    }
    case 'tiny':
      return `${method} ${url} ${status} - ${responseTimeMs} ms`;
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
 */
async function writeLogToFile(filePath: string, message: string): Promise<void> {
  if (!message) return;
  const cleanLine = stripAnsi(message) + '\n';
  try {
    await appendFile(filePath, cleanLine, 'utf-8');
  } catch (error) {
    console.error(`[vite-plugin-request-logger] Failed to write log file "${filePath}":`, error);
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
 * Only requests whose URL starts with `prefix` (default: `'/api'`) are logged,
 * so Vite's internal HMR and asset requests are ignored automatically.
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
export function viteRequestLogger(userOptions: LoggerOptions = {}): Plugin {
  const options = {
    /** URL prefix — only requests starting with this path will be logged. */
    prefix: '/api',
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

  // Normalize prefix to always start with '/'
  const normalizedPrefix = options.prefix.startsWith('/') ? options.prefix : `/${options.prefix}`;

  return {
    name: PLUGIN_NAME,
    enforce: 'pre',

    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        try {
          const url = req.url || '/';

          // Only log requests that start with the configured prefix (e.g. /api)
          if (!url.startsWith(normalizedPrefix)) {
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

          // Patch res.end to capture the response status at the point of send
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
                  const parsed = JSON.parse(rawBody);
                  const redactedBody = redact(parsed, options.redactKeys);
                  formattedBody = JSON.stringify(redactedBody, null, 2);
                } catch {
                  // Fallback: redact using regex for non-JSON bodies
                  if (options.redactKeys && options.redactKeys.length > 0) {
                    for (const key of options.redactKeys) {
                      const regex = new RegExp(`("${key}"\\s*:\\s*")[^"]*(")`, 'gi');
                      formattedBody = formattedBody.replace(regex, `$1[REDACTED]$2`);
                    }
                  }
                }

                if (formattedBody.length > options.maxBodyLength) {
                  formattedBody =
                    formattedBody.slice(0, options.maxBodyLength) + '\n  ... [truncated]';
                }

                logMessage += `\n  Body: ${formattedBody}`;
              }

              console.info(logMessage);

              // Fire-and-forget async file write (non-blocking)
              if (options.logToFile) {
                void writeLogToFile(options.logToFile, logMessage);
              }
            } catch (error) {
              if (!options.silentOnError) {
                console.error('[vite-plugin-request-logger] Logging failed:', error);
              }
            }

            return originalEnd.apply(this, args as never);
          };
        } catch (err) {
          if (!options.silentOnError) {
            console.error('[vite-plugin-request-logger] Middleware error:', err);
          }
        }

        next();
      });
    },
  };
}
export default viteRequestLogger;
