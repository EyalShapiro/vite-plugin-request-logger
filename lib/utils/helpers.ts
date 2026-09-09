import type { LogFunction, LoggerOptions } from '../types';

/**
 * A no-operation (noop) function that performs no action.
 * Useful for suppressing logging output or serving as a default fallback logger.
 *
 * @returns {void}
 *
 * @example
 * const logger: LogFunction = config.silent ? noop : console.log;
 */
export const noop: LogFunction = () => {};

/**
 * Truncates a formatted text/body string to a specified maximum length
 * and appends a `[truncated]` marker at the end.
 *
 * @param {string} formattedBody - The full string payload to be truncated.
 * @param {number} maxLength - The maximum number of characters to retain before truncating.
 * @returns {string} The original string if within limits, or truncated with a trailing marker.
 *
 * @example
 * truncateBody('Hello World', 5);
 * // => 'Hello\n  ... [truncated]'
 */
export function truncateBody(formattedBody: string, maxLength: number): string {
  if (typeof formattedBody !== 'string') return '';
  if (formattedBody.length <= maxLength) return formattedBody;

  return `${formattedBody.slice(0, maxLength)}\n  ... [truncated]`;
}

/**
 * Normalizes a URL prefix to always ensure a leading forward slash `/`.
 *
 * @param {LoggerOptions['prefix']} [prefix] - The raw prefix string (e.g., 'api' or '/api').
 * @returns {string} Normalized prefix string with leading slash (e.g., '/api').
 *
 * @example
 * normalizePrefix('api'); // => '/api'
 * normalizePrefix('/api'); // => '/api'
 * normalizePrefix(); // => ''
 */
export function normalizePrefix(prefix?: LoggerOptions['prefix']): string {
  if (!prefix) return '';
  return prefix.startsWith('/') ? prefix : `/${prefix}`;
}
