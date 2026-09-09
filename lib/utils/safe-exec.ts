/**
 * Safely executes a synchronous function within a try/catch block.
 *
 * Catches any thrown errors, invokes the optional error callback, and returns
 * a fallback value (or `undefined` if no fallback is provided).
 *
 * @template T - The return type of the executed function.
 * @param {() => T} fn - The function to safely execute.
 * @param {T} fallback - The fallback value to return if `fn` throws.
 * @param {(error: unknown) => void} [onError] - Optional callback invoked when an error is caught.
 * @returns {T} The result of `fn()`, or `fallback` if an error was thrown.
 *
 * @example
 * const isMatched = safeExec(() => customFilter(req), false, (err) => console.error(err));
 */
export function safeExec<T>(fn: () => T, fallback: T, onError?: (error: unknown) => void): T;

/**
 * Safely executes a synchronous function within a try/catch block without a fallback value.
 *
 * @template T - The return type of the executed function.
 * @param {() => T} fn - The function to safely execute.
 * @param {undefined} [fallback] - Undefined fallback.
 * @param {(error: unknown) => void} [onError] - Optional callback invoked when an error is caught.
 * @returns {T | undefined} The result of `fn()`, or `undefined` if an error was thrown.
 */
export function safeExec<T>(
  fn: () => T,
  fallback?: T,
  onError?: (error: unknown) => void,
): T | undefined;

export function safeExec<T>(
  fn: () => T,
  fallback?: T,
  onError?: (error: unknown) => void,
): T | undefined {
  try {
    return fn();
  } catch (error) {
    onError?.(error);
    return fallback;
  }
}
