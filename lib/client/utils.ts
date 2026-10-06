/**
 * Utility functions for browser scheduling and deferred execution.
 */

/**
 * Schedules a callback during the browser's idle period using
 * `requestIdleCallback`, falling back to `setTimeout(cb, 1)` if unavailable.
 *
 * @param cb - The callback to run when idle.
 * @internal
 */
export const runWhenIdle = (cb: () => void): void => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(cb);
  } else {
    setTimeout(cb, 1);
  }
};

/**
 * Safely dispatches data via `navigator.sendBeacon` if available in the browser.
 *
 * @param url - Destination endpoint.
 * @param data - String data payload.
 * @internal
 */
export const safeSendBeacon = (url: string, data: string): boolean => {
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    return navigator.sendBeacon(url, data);
  }
  return false;
};

