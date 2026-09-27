/**
 * Context object stored per-request in {@link requestStore}.
 * Available anywhere in the async call chain during request handling.
 */
export interface RequestContext {
  /**
   * Unique trace identifier for this request. Either extracted from the
   * incoming `X-Trace-ID` / `X-Request-ID` header (set by Nginx or a
   * reverse proxy) or auto-generated as a UUID v4.
   */
  traceId: string;

  /**
   * Optional interaction ID sent by the browser's VPRL client.
   * Links this server-side request to a specific user interaction
   * (e.g., a button click) captured on the frontend.
   */
  interactionId?: string;
}
