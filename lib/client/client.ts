import { CircuitBreaker } from './circuitBreaker';
import { DEFAULT_MASK_SELECTORS, DEFAULT_SENSITIVE_INPUT_TYPES } from './constants';
import { setupClientListeners } from './listeners';
import type { ClientConfig, ClientStats, ResolvedConfig, VPRLEvent } from './types';
import { safeSendBeacon } from './utils';

/**
 * Browser-side telemetry agent that captures user interactions (clicks, inputs, errors)
 * and delivers them in resilient batches to your server endpoint.
 */
export class VPRLClient {
  private queue: VPRLEvent[] = [];
  private config: ResolvedConfig;
  private breaker: CircuitBreaker;
  private timer: ReturnType<typeof setInterval> | null = null;
  private _currentInteractionId: string | undefined;
  private _paused = false;

  private _totalTracked = 0;
  private _totalSent = 0;
  private _totalFailed = 0;
  private _totalDropped = 0;

  constructor(config: ClientConfig) {
    const baseSensitive = config.sensitiveInputTypes ?? [...DEFAULT_SENSITIVE_INPUT_TYPES];
    const additionalSensitive = config.additionalSensitiveInputTypes ?? [];
    const sensitiveInputTypes = Array.from(new Set([...baseSensitive, ...additionalSensitive]));

    this.config = {
      batchSize: 10,
      flushInterval: 2000,
      maxQueueSize: 100,
      maskInputValues: true,
      maskSelectors: [...DEFAULT_MASK_SELECTORS],
      maxFailures: 5,
      cooldownPeriod: 30000,
      enableClickTracking: true,
      enableInputTracking: true,
      enableErrorTracking: true,
      ...config,
      sensitiveInputTypes,
    };

    this.breaker = new CircuitBreaker(this.config.maxFailures, this.config.cooldownPeriod);

    setupClientListeners(this.config, {
      trackEvent: (event) => this.trackEvent(event),
      isPaused: () => this._paused,
    });

    this.startPeriodicFlush();
  }

  public getCurrentInteractionId(): string | undefined {
    return this._currentInteractionId;
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  public isPaused(): boolean {
    return this._paused;
  }

  public clearQueue(): void {
    this.queue = [];
  }

  public trackEvent(event: VPRLEvent): void {
    if (this._paused) return;
    if (event.type === 'click' && event.id) this._currentInteractionId = event.id;

    const enrichedEvent: VPRLEvent = {
      ...event,
      interactionId: event.interactionId ?? this._currentInteractionId,
    };

    let finalEvent: VPRLEvent | null = enrichedEvent;
    if (this.config.beforeSend) {
      finalEvent = this.config.beforeSend(enrichedEvent);
      if (finalEvent === null) {
        this._totalDropped++;
        return;
      }
    }

    if (this.queue.length >= this.config.maxQueueSize) {
      this.queue.shift();
      this._totalDropped++;
    }

    this.queue.push(finalEvent);
    this._totalTracked++;

    if (this.queue.length >= this.config.batchSize) {
      void this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    if (!this.breaker.canAttempt()) {
      return;
    }

    const eventsToSend = this.queue.splice(0, this.config.batchSize);
    const fetchImplementation =
      this.config.fetchFn || (typeof fetch !== 'undefined' ? fetch : undefined);

    if (!fetchImplementation) {
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(typeof this.config.customHeaders === 'function'
        ? this.config.customHeaders()
        : this.config.customHeaders),
    };

    try {
      const response = await fetchImplementation(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(eventsToSend),
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      this.breaker.recordSuccess();
      this._totalSent += eventsToSend.length;
      this.config.onFlushSuccess?.(eventsToSend);
    } catch (err) {
      this.breaker.recordFailure();
      this._totalFailed += eventsToSend.length;
      this.config.onFlushError?.(err instanceof Error ? err : new Error(String(err)), eventsToSend);

      const remainingSpace = this.config.maxQueueSize - this.queue.length;
      if (remainingSpace > 0) {
        this.queue.unshift(...eventsToSend.slice(0, remainingSpace));
      }
    }
  }

  public getStats(): ClientStats {
    return {
      queueSize: this.queue.length,
      paused: this._paused,
      circuitBreakerState: this.breaker.getState(),
      totalTracked: this._totalTracked,
      totalSent: this._totalSent,
      totalFailed: this._totalFailed,
      totalDropped: this._totalDropped,
    };
  }

  public pause(): void {
    this._paused = true;
  }

  public resume(): void {
    this._paused = false;
  }

  public destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.queue.length > 0 && typeof navigator !== 'undefined') {
      safeSendBeacon(this.config.endpoint, JSON.stringify(this.queue));
      this.queue = [];
    }
  }

  private startPeriodicFlush(): void {
    if (typeof window === 'undefined') return;

    this.timer = setInterval(() => {
      void this.flush();
    }, this.config.flushInterval);

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void this.flush();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.destroy();
    });
  }
}
