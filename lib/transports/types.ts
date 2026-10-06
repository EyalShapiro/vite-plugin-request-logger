/**
 * A single structured log entry produced by the VPRL server logger
 * and consumed by {@link Transport} implementations.
 *
 * @example
 * ```ts
 * const entry: LogEntry = {
 *   timestamp: new Date().toISOString(),
 *   level: 'info',
 *   message: 'POST /api/users 201 +12.34ms',
 *   traceId: 'c3a1f9e2-4b21',
 *   context: { method: 'POST', path: '/api/users', status: 201 },
 * };
 * ```
 */
export interface LogEntry {
  /**
   * ISO 8601 timestamp string for when the log entry was created.
   * @example `'2026-09-23T20:54:00.000Z'`
   */
  timestamp: string;

  /**
   * Severity level of the log entry.
   *
   * | Level   | Usage                                        |
   * |---------|----------------------------------------------|
   * | `debug` | Verbose diagnostic information                |
   * | `info`  | Normal operational events (most requests)     |
   * | `warn`  | Potential issues (slow responses, retries)    |
   * | `error` | Failures and exceptions                       |
   */
  level: 'info' | 'warn' | 'error' | 'debug';

  /** Human-readable log message (e.g., formatted request line). */
  message: string;

  /** Unique request identifier, typically from `X-Request-ID` header. */
  requestId?: string;

  /**
   * End-to-end trace identifier that correlates logs across Nginx,
   * the Node.js backend, and the browser client.
   * @see {@link vprlTraceMiddleware} for how this is propagated.
   */
  traceId?: string;

  /**
   * Browser interaction ID linking this server log to a specific
   * user action captured by the VPRL client agent.
   */
  interactionId?: string;

  /** Arbitrary structured context attached to the log entry. */
  context?: Record<string, unknown>;
}

/**
 * Interface for log transport implementations. A transport receives
 * {@link LogEntry} objects and delivers them to a destination (stdout,
 * remote API, file, etc.).
 *
 * Transports can be synchronous or asynchronous. Implement the optional
 * `close()` method to flush buffers and release resources on shutdown.
 *
 * @example Custom console transport
 * ```ts
 * const consoleTransport: Transport = {
 *   name: 'console',
 *   log(entry) {
 *     console.log(`[${entry.level}] ${entry.message}`);
 *   },
 * };
 * ```
 *
 * @example Async transport with cleanup
 * ```ts
 * const httpTransport: Transport = {
 *   name: 'http-forwarder',
 *   async log(entry) {
 *     await fetch('/logs', { method: 'POST', body: JSON.stringify(entry) });
 *   },
 *   async close() {
 *     // flush any remaining buffered entries
 *   },
 * };
 * ```
 */
export interface Transport {
  /**
   * Human-readable name for this transport, used in diagnostic messages.
   * @example `'openshift-stdout'`, `'grafana-loki'`, `'datadog'`
   */
  name: string;

  /**
   * Processes a single log entry. May be synchronous or return a Promise.
   *
   * @param entry - The structured log entry to deliver.
   */
  log(entry: LogEntry): void | Promise<void>;

  /**
   * Optional cleanup hook called during graceful shutdown.
   * Use this to flush internal buffers, close connections, or
   * clear timers.
   */
  close?(): void | Promise<void>;
}
