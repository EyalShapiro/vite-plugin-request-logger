/**
 * Types and interfaces for `@vprl/client` browser telemetry.
 */

/**
 * Circuit breaker states for network resilience.
 */
export const CircuitBreakerState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
} as const;

export type CircuitBreakerState =
  (typeof CircuitBreakerState)[keyof typeof CircuitBreakerState];

/**
 * Supported telemetry event types captured by the VPRL client.
 *
 * | Type         | Description                                        |
 * |--------------|----------------------------------------------------|
 * | `click`      | User clicked on an interactive element              |
 * | `input`      | User changed a form field value                     |
 * | `error`      | An uncaught JavaScript error occurred                |
 * | `navigation` | A fetch/network request was made (via interceptor)   |
 * | `custom`     | A manually tracked custom event                     |
 */
export type VPRLEventType = 'click' | 'input' | 'error' | 'navigation' | 'custom';

/**
 * A single telemetry event captured by the VPRL client.
 *
 * @example
 * ```ts
 * const event: VPRLEvent = {
 *   id: crypto.randomUUID(),
 *   timestamp: Date.now(),
 *   type: 'click',
 *   target: 'button#submit',
 *   payload: { text: 'Submit Order' },
 * };
 * ```
 */
export interface VPRLEvent {
  /** Unique identifier for this event (UUID v4). */
  id: string;
  /** Unix timestamp in milliseconds when the event occurred. */
  timestamp: number;
  /** The category of the captured event. */
  type: VPRLEventType;
  /** CSS-like selector identifying the DOM element (e.g. `"button#checkout"`). */
  target?: string;
  /** Arbitrary key-value data attached to the event. */
  payload?: Record<string, any>;
  /** Links this event to a user interaction session (auto-set on clicks). */
  interactionId?: string;
}

/**
 * Cumulative statistics about the VPRL client's event pipeline.
 *
 * @example
 * ```ts
 * const stats = client.getStats();
 * console.log(`Tracked: ${stats.totalTracked}, Sent: ${stats.totalSent}`);
 * ```
 */
export interface ClientStats {
  /** Total number of events passed to `trackEvent()`. */
  totalTracked: number;
  /** Total number of events successfully sent to the server. */
  totalSent: number;
  /** Total number of events that failed to send (network/server errors). */
  totalFailed: number;
  /** Total number of events dropped because the queue was full. */
  totalDropped: number;
  /** Current number of events waiting in the in-memory queue. */
  queueSize: number;
  /** Whether the client is currently paused. */
  paused: boolean;
  /** Current state of the circuit breaker. */
  circuitBreakerState: CircuitBreakerState;
}

/**
 * Configuration options for the {@link VPRLClient}.
 */
export interface ClientConfig {
  /** The server ingest endpoint URL where batched events are POSTed. */
  endpoint: string;

  /**
   * Maximum number of events to include in a single batch POST request.
   * @default 10
   */
  batchSize?: number;

  /**
   * Interval in milliseconds for periodic automatic flushes.
   * @default 2000
   */
  flushInterval?: number;

  /**
   * Maximum number of events the in-memory queue can hold.
   * @default 100
   */
  maxQueueSize?: number;

  /**
   * Whether to automatically mask (redact) values of all form input elements.
   * When `true`, every `<input>` value is replaced with `[REDACTED]`.
   * When `false`, only inputs matching {@link sensitiveInputTypes} are redacted.
   * @default true
   */
  maskInputValues?: boolean;

  /**
   * HTML input `type` attributes whose values are always redacted with `[REDACTED]`.
   * @default ['password', 'email', 'tel', 'card']
   */
  sensitiveInputTypes?: string[];

  /**
   * Additional HTML input `type` attributes to redact.
   * @default []
   */
  additionalSensitiveInputTypes?: string[];

  /**
   * CSS selectors for elements whose text content should be redacted.
   * @default `['.sensitive', '[data-vprl-mask]']`
   */
  maskSelectors?: string[];

  /**
   * Number of consecutive flush failures before the circuit breaker opens.
   * @default 5
   */
  maxFailures?: number;

  /**
   * Time in milliseconds to wait after the circuit breaker trips before attempting recovery.
   * @default 30000
   */
  cooldownPeriod?: number;

  /** Enable automatic click event tracking. @default true */
  enableClickTracking?: boolean;

  /** Enable automatic input/change event tracking. @default true */
  enableInputTracking?: boolean;

  /** Enable automatic error tracking. @default true */
  enableErrorTracking?: boolean;

  /** Called before an event is queued. Return event to keep or null to drop. */
  beforeSend?: (event: VPRLEvent) => VPRLEvent | null;

  /** Called after a batch of events is successfully sent. */
  onFlushSuccess?: (events: VPRLEvent[]) => void;

  /** Called when a batch flush fails. */
  onFlushError?: (error: Error, events: VPRLEvent[]) => void;

  /** Custom sanitization function that overrides default PII masking. */
  customSanitizer?: (element: HTMLElement, value: string) => string;

  /** Additional HTTP headers to include in flush requests. */
  customHeaders?: Record<string, string> | (() => Record<string, string>);

  /** Custom fetch implementation. @default window.fetch */
  fetchFn?: typeof fetch;
}

/** @internal Full config shape after defaults have been applied. */
export type ResolvedConfig = Required<
  Pick<
    ClientConfig,
    | 'endpoint'
    | 'batchSize'
    | 'flushInterval'
    | 'maxQueueSize'
    | 'maskInputValues'
    | 'maskSelectors'
    | 'sensitiveInputTypes'
    | 'maxFailures'
    | 'cooldownPeriod'
    | 'enableClickTracking'
    | 'enableInputTracking'
    | 'enableErrorTracking'
  >
> &
  Pick<
    ClientConfig,
    | 'additionalSensitiveInputTypes'
    | 'beforeSend'
    | 'onFlushSuccess'
    | 'onFlushError'
    | 'customSanitizer'
    | 'customHeaders'
    | 'fetchFn'
  >;
