import type { Transport } from './types';
import { createOpenShiftTransport, type OpenShiftPresetOptions } from './openshift';
import { createLokiTransport, type LokiPresetOptions } from './loki';

export type { OpenShiftPresetOptions, LokiPresetOptions };
export { createOpenShiftTransport, createLokiTransport };

/**
 * Built-in transport presets for common cloud-native environments.
 */
export const presets = {
  /**
   * **OpenShift / Kubernetes Preset**
   * Writes structured JSON logs directly to `process.stdout`.
   */
  openShift(options?: OpenShiftPresetOptions): Transport {
    return createOpenShiftTransport(options);
  },

  /**
   * **Grafana Loki Preset**
   * Pushes batched structured logs to a Grafana Loki endpoint.
   */
  loki(options: LokiPresetOptions): Transport {
    return createLokiTransport(options);
  },
};
