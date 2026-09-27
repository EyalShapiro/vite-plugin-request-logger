import { AsyncLocalStorage } from 'async_hooks';
import type { RequestContext } from './types';

/**
 * Node.js `AsyncLocalStorage` instance that holds the {@link RequestContext}
 * for the current request. This allows any code in the async call chain
 * to access trace/interaction IDs without explicitly passing them through
 * function parameters.
 */
export const requestStore = new AsyncLocalStorage<RequestContext>();

/**
 * Returns the Trace ID for the current request, or `undefined` if called
 * outside of a request context.
 */
export function getCurrentTraceId(): string | undefined {
  return requestStore.getStore()?.traceId;
}

/**
 * Returns the Interaction ID sent by the browser's VPRL client for the
 * current request, or `undefined` if not present.
 */
export function getCurrentInteractionId(): string | undefined {
  return requestStore.getStore()?.interactionId;
}

/**
 * Returns the full {@link RequestContext} for the current request,
 * or `undefined` if called outside of a request context.
 */
export function getCurrentContext(): RequestContext | undefined {
  return requestStore.getStore();
}
