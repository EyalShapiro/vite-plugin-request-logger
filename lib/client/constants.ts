/**
 * Constants and default settings for `@vprl/client`.
 */

export { CircuitBreakerState } from './types';

/**
 * Default HTML input `type` attributes whose values are always redacted
 * regardless of the `maskInputValues` setting.
 *
 * @example
 * ```ts
 * console.log(DEFAULT_SENSITIVE_INPUT_TYPES);
 * // ['password', 'email', 'tel', 'card']
 * ```
 */
export const DEFAULT_SENSITIVE_INPUT_TYPES: readonly string[] = [
  'password',
  'email',
  'tel',
  'card',
];

/**
 * Default CSS selectors masked automatically by the client.
 */
export const DEFAULT_MASK_SELECTORS: readonly string[] = [
  '.sensitive',
  '[data-vprl-mask]',
];

/**
 * Default timing and queue thresholds.
 */
export const CLIENT_DEFAULTS = {
  BATCH_SIZE: 10,
  FLUSH_INTERVAL: 2000,
  MAX_QUEUE_SIZE: 100,
  MAX_FAILURES: 5,
  COOLDOWN_PERIOD: 30000,
} as const;
