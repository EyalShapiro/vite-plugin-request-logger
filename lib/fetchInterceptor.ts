import type { VPRLClient } from './client';

/**
 * Wraps `window.fetch` to automatically:
 *
 * 1. **Inject** the current `X-VPRL-Interaction-ID` header into every
 *    outgoing request so the server can correlate it with client-side events.
 * 2. **Extract** the `X-Trace-ID` (or `X-Request-ID`) header from every
 *    response and record a `navigation` telemetry event that links the
 *    browser request to the server-side trace.
 * 3. **Track network errors** as `error` events when `fetch` rejects
 *    (e.g. DNS failure, offline, CORS block).
 *
 * The interceptor is non-destructive — it preserves the original `fetch`
 * behavior and return values. It can be torn down at any time by calling
 * the returned cleanup function.
 *
 * @param client - An active {@link VPRLClient} instance used to emit events
 *                 and to read the current interaction ID.
 * @returns A teardown function that restores the original `window.fetch`.
 *          Call it during cleanup (e.g. in tests or SPA unmount) to remove
 *          the interceptor.
 *
 * @example Basic setup
 * ```ts
 * import { VPRLClient } from 'vite-plugin-request-logger/client';
 * import { setupFetchInterceptor } from 'vite-plugin-request-logger/fetch-interceptor';
 *
 * const client = new VPRLClient({ endpoint: '/api/telemetry' });
 * const teardown = setupFetchInterceptor(client);
 *
 * // All subsequent fetch() calls are now instrumented
 * await fetch('/api/users');
 *
 * // Restore original fetch when done
 * teardown();
 * ```
 *
 * @example React useEffect cleanup
 * ```ts
 * useEffect(() => {
 *   const client = new VPRLClient({ endpoint: '/api/telemetry' });
 *   const teardown = setupFetchInterceptor(client);
 *   return () => {
 *     teardown();
 *     client.destroy();
 *   };
 * }, []);
 * ```
 */
export function setupFetchInterceptor(client: VPRLClient): () => void {
  if (typeof window === 'undefined' || !window.fetch) {
    return () => {};
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
    const [resource, config = {}] = args;
    const headers = new Headers((config as RequestInit).headers || {});

    // Inject the current interaction ID so the server can correlate
    const currentInteractionId = client.getCurrentInteractionId();
    if (currentInteractionId) {
      headers.set('X-VPRL-Interaction-ID', currentInteractionId);
    }

    const updatedConfig: RequestInit = { ...config, headers };

    let response: Response;
    try {
      response = await originalFetch(resource, updatedConfig);
    } catch (error) {
      // Track network-level failures (offline, DNS, CORS, etc.)
      client.trackEvent({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'error',
        payload: {
          url: typeof resource === 'string' ? resource : (resource as Request).url,
          error: error instanceof Error ? error.message : String(error),
          context: 'fetch-network-error',
        },
      });
      throw error;
    }

    // Extract the trace ID returned by Nginx / backend
    const traceId =
      response.headers.get('X-Trace-ID') || response.headers.get('X-Request-ID') || undefined;

    // Record a navigation event linking this request to the server trace
    client.trackEvent({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'navigation',
      payload: {
        url: typeof resource === 'string' ? resource : (resource as Request).url,
        method: (config as RequestInit).method?.toUpperCase() ?? 'GET',
        status: response.status,
        ok: response.ok,
        traceId,
      },
    });

    return response;
  };

  // Return a cleanup function that restores the original fetch
  return () => {
    window.fetch = originalFetch;
  };
}
