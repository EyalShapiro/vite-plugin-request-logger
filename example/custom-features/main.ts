import { VPRLClient } from 'vite-plugin-request-logger/client';

const output = document.querySelector<HTMLPreElement>('#output')!;
const telemetryOutput = document.querySelector<HTMLPreElement>('#telemetry-output')!;

// ─── 1. Initialize VPRL Client with Custom Sensitive Types ───────────────────

const capturedEvents: any[] = [];

function appendTelemetryLog(event: any) {
  capturedEvents.unshift(event);
  if (capturedEvents.length > 10) capturedEvents.pop();

  telemetryOutput.textContent = capturedEvents
    .map((e) => {
      const time = new Date(e.timestamp).toLocaleTimeString();
      const payload = JSON.stringify(e.payload);
      return `[${time}] ${e.type.toUpperCase()} -> ${e.target ?? ''}\n  Payload: ${payload}`;
    })
    .join('\n\n');
}

const client = new VPRLClient({
  endpoint: '/api/telemetry',
  batchSize: 5,
  flushInterval: 3000,
  // maskInputValues: false allows non-sensitive inputs (like text) through,
  // while sensitive types (both default and additional) remain redacted!
  maskInputValues: false,
  // Add custom sensitive input types on top of 'password', 'email', 'tel', 'card'
  additionalSensitiveInputTypes: ['ssn', 'pin'],
  maskSelectors: ['.sensitive', '[data-vprl-mask]'],
  beforeSend: (event) => {
    appendTelemetryLog(event);
    return event;
  },
  onFlushSuccess: (events) => {
    console.log(`[VPRL] Successfully flushed batch of ${events.length} events`);
  },
});

console.log('[VPRL] Client initialized with stats:', client.getStats());

// ─── 2. Server Request Testing Buttons ───────────────────────────────────────

async function sendRequest(url: string) {
  output.textContent = `Sending request to ${url}...`;
  try {
    const response = await fetch(url);
    const data = await response.json().catch(() => null);
    output.textContent = `Response status: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    output.textContent = `Error: ${errorMsg}`;
  }
}

document.querySelector('#btn-api')?.addEventListener('click', () => sendRequest('/api/users'));
document.querySelector('#btn-trpc')?.addEventListener('click', () => sendRequest('/trpc/getUser'));
document.querySelector('#btn-slow')?.addEventListener('click', () => sendRequest('/api/slow'));
document
  .querySelector('#btn-ignored')
  ?.addEventListener('click', () => sendRequest('/static/asset.js'));
