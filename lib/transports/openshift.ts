import type { Transport, LogEntry } from './types';
import { safeJsonStringify } from '../utils/json.utils';

/**
 * Configuration options for the OpenShift / Kubernetes stdout transport.
 */
export interface OpenShiftPresetOptions {
  /**
   * When `true`, JSON output is indented with 2 spaces for readability.
   * Set to `false` (default) in production for compact, single-line JSON.
   *
   * @default false
   */
  pretty?: boolean;
}

/**
 * Creates an OpenShift / Kubernetes stdout JSON transport.
 * Compatible with Fluentd, Logstash, and OpenShift EFK stack.
 */
export function createOpenShiftTransport(options: OpenShiftPresetOptions = {}): Transport {
  const indent = options.pretty ? 2 : undefined;

  return {
    name: 'openshift-stdout',
    log(entry: LogEntry): void {
      const output = {
        '@timestamp': entry.timestamp,
        severity: entry.level.toUpperCase(),
        message: entry.message,
        'service.name': 'vprl-server',
        ...(entry.traceId && { 'trace.id': entry.traceId }),
        ...(entry.interactionId && { 'interaction.id': entry.interactionId }),
        ...(entry.context && Object.keys(entry.context).length > 0 && { context: entry.context }),
      };

      const line = safeJsonStringify(output, { space: indent, fallback: '{}' }) ?? '{}';
      process.stdout.write(line + '\n');
    },
  };
}
