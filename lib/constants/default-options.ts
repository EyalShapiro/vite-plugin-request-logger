import type { LoggerFormat, LoggerOption, LoggerOptions } from '../types';

const REDACT_KEYS = [
  'token',
  'password',
  'secret',
  'authorization',
  'cookie',
  'apiKey',
  'api_key',
  'authorization_token',
] as const;

export const DEFAULT_OPTIONS = {
  /** URL prefix — only requests starting with this path will be logged (when filter is not provided). */
  prefix: '/api',
  /** Custom filter function. If provided, overrides prefix filtering. */
  filter: undefined,
  /** Custom message callback appended to log lines. */
  customMsg: undefined,
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
  redactKeys: REDACT_KEYS,
  /** File path to append logs into. Undefined means no file logging. */
  logToFile: undefined as string | undefined,
  /** Enable ANSI colors in terminal output. */
  colors: true,
  /** Locale for timestamp formatting. */
  timezone: 'he-IL',
  /** Paths to ignore. */
  ignorePaths: undefined,
  /** Skip asset requests. */
  skipAssets: false,
  /** Catch internal errors silently — never crash the dev server. */
  silentOnError: true,
} satisfies LoggerOptions;
