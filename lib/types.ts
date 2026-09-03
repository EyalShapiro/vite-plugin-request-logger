import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Supported log format presets, similar to Morgan.
 *
 * | Format     | Example output                                      |
 * |------------|-----------------------------------------------------|
 * | `dev`      | `[12:00:00] POST   /api/users 201 +12.34ms`         |
 * | `tiny`     | `POST /api/users 201 - 12.34 ms`                    |
 * | `short`    | `POST /api/users 201 12.34 ms`                      |
 * | `combined` | `POST /api/users 201 12.34 ms` _(alias for short)_  |
 */
export type LoggerFormat = 'dev' | 'tiny' | 'combined' | 'short';

export type LogFunction = (message: string, ...args: unknown[]) => void;

/**
 * Custom logger interface compatible with Winston, Pino, Bunyan, or custom objects.
 */
export interface CustomLogger {
  info?: LogFunction;
  error?: LogFunction;
  warn?: LogFunction;
  debug?: LogFunction;
  log?: LogFunction;
}

/**
 * Logger option accepted by the plugin.
 * Can be a `CustomLogger` instance, or built-in presets `'console'` / `'silent'`.
 */
export type LoggerOption = CustomLogger | 'console' | 'silent';

/**
 * Configuration options for `vite-plugin-request-logger`.
 *
 * All fields are optional — the plugin works out of the box with zero config.
 *
 * @example
 * ```ts
 * viteRequestLogger({
 *   prefix: '/api',
 *   format: 'dev',
 *   logBody: true,
 *   redactKeys: ['password', 'token', 'authorization'],
 *   logToFile: 'logs/requests.log',
 * })
 * ```
 */
export interface LoggerOptions {
  /**
   * URL prefix filter — **only requests whose URL starts with this string will be logged.**
   *
   * This is the primary way to avoid logging Vite's internal HMR, asset, and source-file requests.
   * Set to `'/'` to log all requests.
   *
   * When `filter` is provided, `filter` takes precedence over `prefix`.
   *
   * @default '/api'
   * @example '/api'        // logs only /api/* requests
   * @example '/trpc'       // logs only /trpc/* requests
   * @example '/'           // logs everything
   */
  prefix?: string;

  /**
   * Custom filter function — returns `true` to log the request, or `false` to ignore it.
   *
   * When provided, this option takes precedence over `prefix`.
   *
   * @example
   * filter: (req) => req.url?.startsWith('/api') || req.url?.startsWith('/trpc')
   */
  filter?: (req: IncomingMessage) => boolean;

  /**
   * Optional custom callback to compute a message suffix for each logged line.
   *
   * When the function returns a non-empty string, it is appended to the end of the log line.
   * Return `undefined` or an empty string to leave the log line unchanged.
   *
   * @example
   * customMsg: (req, res, responseTimeMs) => responseTimeMs > 500 ? '⚠️ SLOW' : undefined
   */
  customMsg?: (
    req: IncomingMessage,
    res: ServerResponse,
    responseTimeMs: number,
  ) => string | undefined;

  /**
   * Custom logger instance (e.g., Pino, Winston, custom object) or preset (`'console'` | `'silent'`).
   *
   * @default 'console'
   * @example pinoLogger
   * @example 'silent'
   */
  logger?: LoggerOption;

  /**
   * Log format preset.
   *
   * - `'dev'`      — Colored timestamp + method + URL + status + time. Best for development.
   * - `'tiny'`     — Minimal: `METHOD URL STATUS - Xms`
   * - `'short'`    — `METHOD URL STATUS Xms`
   * - `'combined'` — Alias for `'short'`
   *
   * @default 'dev'
   */
  format?: LoggerFormat;

  /**
   * Whether to log the request body for mutating requests (POST, PUT, PATCH, DELETE).
   *
   * The body is automatically pretty-printed if it is valid JSON.
   * Sensitive keys are redacted based on `redactKeys`.
   *
   * @default true
   */
  logBody?: boolean;

  /**
   * Maximum number of characters of the request body to display before truncating.
   * Prevents flooding the terminal with very large payloads.
   *
   * @default 1000
   */
  maxBodyLength?: number;

  /**
   * Whether to capture and log incoming request headers.
   * Sensitive header keys are automatically redacted based on `redactKeys`.
   *
   * @default false
   */
  logHeaders?: boolean;

  /**
   * Keys whose values will be replaced with `[REDACTED]` in logged bodies and headers.
   * Matching is **case-insensitive**.
   *
   * @default ['password', 'token', 'secret']
   * @example ['password', 'token', 'secret', 'apiKey', 'authorization']
   */
  redactKeys?: string[];

  /**
   * Path to a log file where each request line will be appended (in addition to the terminal).
   * The file is created automatically if it does not exist.
   * ANSI color codes are stripped before writing so the file contains plain text.
   *
   * @default undefined  — file logging is disabled
   * @example 'logs/requests.log'
   */
  logToFile?: string;

  /**
   * Whether to use ANSI colors in terminal output.
   * Disable when piping output to a file or running in a CI environment.
   *
   * @default true
   */
  colors?: boolean;

  /**
   * BCP 47 locale tag used to format log timestamps via `Date.toLocaleTimeString`.
   *
   * @default 'he-IL'
   * @example 'en-US' | 'de-DE' | 'ja-JP'
   */
  timezone?: Intl.LocalesArgument;

  /**
   * If `true`, any internal plugin errors are silently caught and will **not** crash
   * the Vite dev server. Set to `false` during debugging to surface errors.
   *
   * @default true
   */
  silentOnError?: boolean;
}
