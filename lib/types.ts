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
   * @default '/api'
   * @example '/api'        // logs only /api/* requests
   * @example '/trpc'       // logs only /trpc/* requests
   * @example '/'           // logs everything
   */
  prefix?: string;

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
