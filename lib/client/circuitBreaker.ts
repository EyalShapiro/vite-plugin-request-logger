import { CircuitBreakerState } from './types';

/**
 * Protects the network layer from cascading failures by halting flush
 * attempts after repeated consecutive errors.
 *
 * Uses a simple state machine: `CLOSED → OPEN → (half-open) → CLOSED`.
 *
 * @example
 * ```ts
 * const breaker = new CircuitBreaker(5, 30_000);
 * if (breaker.canExecute()) {
 *   try {
 *     await sendBatch();
 *     breaker.recordSuccess();
 *   } catch {
 *     breaker.recordFailure();
 *   }
 * }
 * ```
 */
export class CircuitBreaker {
  private failures = 0;
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private nextTryTime = 0;

  /**
   * @param maxFailures - Consecutive failures before the breaker opens.
   * @param cooldownPeriod - Milliseconds to wait before a half-open retry.
   */
  constructor(
    private maxFailures: number = 5,
    private cooldownPeriod: number = 30000,
  ) {}

  /**
   * Returns `true` if a flush attempt is currently allowed.
   * In OPEN state, returns `true` only after the cooldown has elapsed (half-open probe).
   */
  public canExecute(): boolean {
    if (this.state === CircuitBreakerState.CLOSED) return true;
    return Date.now() > this.nextTryTime;
  }

  /**
   * Alias for {@link canExecute}.
   */
  public canAttempt(): boolean {
    return this.canExecute();
  }

  /**
   * Returns whether the circuit breaker is currently in the OPEN state.
   */
  public isCircuitOpen(): boolean {
    return this.state === CircuitBreakerState.OPEN;
  }

  /**
   * Records a successful network request, resetting the failure counter
   * and closing the breaker.
   */
  public recordSuccess(): void {
    this.failures = 0;
    this.state = CircuitBreakerState.CLOSED;
  }

  /**
   * Records a failed network request. Trips to `OPEN` once consecutive
   * failures reach `maxFailures`.
   */
  public recordFailure(): void {
    this.failures++;
    if (this.failures >= this.maxFailures) {
      this.state = CircuitBreakerState.OPEN;
      this.nextTryTime = Date.now() + this.cooldownPeriod;
    }
  }

  /**
   * Returns the current state of the circuit breaker (`'CLOSED'` or `'OPEN'`).
   */
  public getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Resets the circuit breaker back to its initial `CLOSED` state.
   */
  public reset(): void {
    this.failures = 0;
    this.state = CircuitBreakerState.CLOSED;
    this.nextTryTime = 0;
  }
}
