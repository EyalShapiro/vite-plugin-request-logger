import { ANSI_COLORS } from './constants/AnsiColor';
import type { LoggerOptions } from './types';
import { getMethodColor, getStatusColor } from './utils/statusColor';
import type { StatusType } from './http-method';

/**
 * Parameters for formatting a request log line.
 * Uses `Pick` from `LoggerOptions` for relevant logger formatting configuration.
 */
export interface FormatMessageOptions extends Pick<
  LoggerOptions,
  'format' | 'colors' | 'timezone'
> {
  /** HTTP request method (e.g. 'GET', 'POST'). */
  method: string;
  /** Request URL path. */
  url: string;
  /** HTTP response status code. */
  status: StatusType;
  /** Elapsed response duration in milliseconds as a string. */
  responseTimeMs: string;
}

/**
 * Formats a single log line according to the chosen format preset and options object.
 *
 * @param {FormatMessageOptions} options - Configuration and request metadata for formatting the log line.
 * @returns {string} A formatted log line string.
 *
 * @example
 * formatMessage({
 *   format: 'dev',
 *   method: 'GET',
 *   url: '/api/users',
 *   status: 200,
 *   responseTimeMs: '12.34',
 *   colors: true,
 *   timezone: 'en-US',
 * });
 */
export function formatMessage(options: FormatMessageOptions): string;

/**
 * Formats a single log line according to individual positional arguments.
 *
 * @param {LoggerOptions['format']} format - The log format preset ('dev', 'tiny', 'short', 'combined').
 * @param {string} method - HTTP request method.
 * @param {string} url - Request URL path.
 * @param {StatusType} status - HTTP status code.
 * @param {string} responseTimeMs - Response time in milliseconds.
 * @param {boolean} [colors] - Whether to apply ANSI color codes.
 * @param {LoggerOptions['timezone']} [timezone] - BCP 47 locale tag for timestamp or custom formatter function.
 * @returns {string} A formatted log line string.
 */
export function formatMessage(
  format: LoggerOptions['format'],
  method: string,
  url: string,
  status: StatusType,
  responseTimeMs: string,
  colors?: boolean,
  timezone?: LoggerOptions['timezone'],
): string;

export function formatMessage(
  formatOrOptions: LoggerOptions['format'] | FormatMessageOptions,
  methodArg?: string,
  urlArg?: string,
  statusArg?: StatusType,
  responseTimeMsArg?: string,
  colorsArg?: boolean,
  timezoneArg?: LoggerOptions['timezone'],
): string {
  const isObject = typeof formatOrOptions === 'object' && formatOrOptions !== null;

  const format: LoggerOptions['format'] = isObject
    ? (formatOrOptions as FormatMessageOptions).format
    : (formatOrOptions as LoggerOptions['format']);
  const method = isObject ? (formatOrOptions as FormatMessageOptions).method : (methodArg ?? 'GET');
  const url = isObject ? (formatOrOptions as FormatMessageOptions).url : (urlArg ?? '/');
  const status: StatusType = isObject
    ? (formatOrOptions as FormatMessageOptions).status
    : (statusArg ?? 200);
  const responseTimeMs = isObject
    ? (formatOrOptions as FormatMessageOptions).responseTimeMs
    : (responseTimeMsArg ?? '0');
  const colors: boolean | undefined = isObject
    ? (formatOrOptions as FormatMessageOptions).colors
    : colorsArg;
  const timezone: LoggerOptions['timezone'] = isObject
    ? (formatOrOptions as FormatMessageOptions).timezone
    : timezoneArg;

  const now = new Date();
  const timestamp =
    typeof timezone === 'function'
      ? timezone(now)
      : now.toLocaleTimeString(timezone as Intl.LocalesArgument, { hour12: false });

  switch (format) {
    case 'dev': {
      // Plain-text fallback when colors are disabled
      if (!colors) {
        return `[${timestamp}] ${method.padEnd(6)} ${url} ${status} +${responseTimeMs}ms`;
      }

      // Resolve the ANSI color for the HTTP method and status
      const methodColor = getMethodColor(method);
      const statusColor = getStatusColor(status);

      const timeMsg = `${ANSI_COLORS.dim}[${timestamp}]${ANSI_COLORS.reset} `;
      const methodMsg = `${methodColor}${ANSI_COLORS.bold}${method.padEnd(6)}${ANSI_COLORS.reset} `;
      const urlMsg = `${url} `;
      const statusMsg = `${statusColor}${status}${ANSI_COLORS.reset} `;
      const timeResponseMsg = `${ANSI_COLORS.dim}+${responseTimeMs}ms${ANSI_COLORS.reset}`;

      return timeMsg + methodMsg + urlMsg + statusMsg + timeResponseMsg;
    }
    // Minimal one-liner: METHOD url status - Xms
    case 'tiny':
      return `${method} ${url} ${status} - ${responseTimeMs} ms`;
    // 'short' and 'combined' share the same compact format
    default:
      return `${method} ${url} ${status} ${responseTimeMs} ms`;
  }
}
