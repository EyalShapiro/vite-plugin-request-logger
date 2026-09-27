import type { Transport, LogEntry } from './types';
import { safeJsonStringify } from '../utils/json.utils';

/**
 * Configuration options for the Grafana Loki push transport.
 */
export interface LokiPresetOptions {
  /**
   * Base URL of the Grafana Loki instance.
   */
  host: string;

  /**
   * Static labels attached to every log stream pushed to Loki.
   */
  labels?: Record<string, string>;

  /**
   * Number of log entries to buffer before flushing to Loki.
   * @default 20
   */
  batchSize?: number;

  /**
   * Interval in milliseconds for automatic periodic flushes.
   * @default 3000
   */
  flushInterval?: number;
}

/**
 * Creates a Grafana Loki HTTP push transport with batching and auto-flush.
 */
export function createLokiTransport(options: LokiPresetOptions): Transport {
  const {
    host,
    labels = { app: 'vprl-server', env: process.env.NODE_ENV || 'development' },
    batchSize = 20,
    flushInterval = 3000,
  } = options;

  const buffer: LogEntry[] = [];
  let timer: NodeJS.Timeout | null = null;

  async function flush(): Promise<void> {
    if (buffer.length === 0) return;
    const batch = buffer.splice(0, buffer.length);

    const values: [string, string][] = batch.map((entry) => {
      const nanoTimestamp = String(new Date(entry.timestamp).getTime() * 1_000_000);
      const line =
        safeJsonStringify(
          {
            level: entry.level,
            message: entry.message,
            traceId: entry.traceId,
            interactionId: entry.interactionId,
            context: entry.context,
          },
          '{}',
        ) ?? '{}';
      return [nanoTimestamp, line];
    });

    const payload = {
      streams: [{ stream: labels, values }],
    };

    try {
      const url = `${host.replace(/\/+$/, '')}/loki/api/v1/push`;
      const body = safeJsonStringify(payload, '{}') ?? '{}';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!res.ok) {
        console.error(`[vprl:loki] Push failed with HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('[vprl:loki] Push error:', err);
    }
  }

  function startTimer(): void {
    if (timer) return;
    timer = setInterval(() => {
      void flush();
    }, flushInterval);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  startTimer();

  return {
    name: 'grafana-loki',
    async log(entry: LogEntry): Promise<void> {
      buffer.push(entry);
      if (buffer.length >= batchSize) {
        await flush();
      }
    },
    async close(): Promise<void> {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      await flush();
    },
  };
}
