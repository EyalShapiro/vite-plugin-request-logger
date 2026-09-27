import type { IncomingMessage } from 'http';
import type { LoggerOptions, CustomLogger } from '../types';
import type { ReturnLogger } from './resolveLogger';
import { safeExec } from './safe-exec';

/** Regular expression to detect common static asset extensions. */
export const ASSET_REGEX = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif|mp4|webm)$/i;

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
