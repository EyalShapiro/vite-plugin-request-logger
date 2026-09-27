/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_SENSITIVE_INPUT_TYPES,
  sanitizeValue,
  VPRLClient,
} from '../lib/client';

describe('@vprl/client & Sensitive Input Types', () => {
  describe('DEFAULT_SENSITIVE_INPUT_TYPES', () => {
    it('should export the expected default sensitive input types', () => {
      expect(DEFAULT_SENSITIVE_INPUT_TYPES).toEqual(['password', 'email', 'tel', 'card']);
    });
  });

  describe('sanitizeValue', () => {
    function createMockInputElement(type: string, value: string, classNames = '', matchesFn?: (s: string) => boolean) {
      const el = {
        type,
        value,
        tagName: 'INPUT',
        getAttribute: (attr: string) => (attr === 'type' ? type : null),
        matches: matchesFn ?? ((s: string) => classNames.split(' ').some((c) => s.includes(c))),
      };
      // Set prototype to HTMLInputElement-like if needed
      Object.setPrototypeOf(el, (globalThis as any).HTMLInputElement?.prototype || Object.prototype);
      return el as unknown as HTMLElement;
    }

    function createMockDivElement(text: string, classNames = '') {
      const el = {
        innerText: text,
        tagName: 'DIV',
        matches: (s: string) => classNames.split(' ').some((c) => s.includes(c)),
      };
      Object.setPrototypeOf(el, (globalThis as any).HTMLElement?.prototype || Object.prototype);
      return el as unknown as HTMLElement;
    }

    it('should redact default sensitive input types when maskInputValues is false', () => {
      for (const type of ['password', 'email', 'tel', 'card']) {
        const input = createMockInputElement(type, 'secret-123');
        const result = sanitizeValue(input, 'secret-123', false);
        expect(result).toBe('[REDACTED]');
      }
    });

    it('should not redact non-sensitive input types when maskInputValues is false and using defaults', () => {
      const input = createMockInputElement('text', 'hello world');
      const result = sanitizeValue(input, 'hello world', false);
      expect(result).toBe('hello world');
    });

    it('should redact custom sensitiveInputTypes when configured', () => {
      const customSensitive = ['ssn', 'pin', 'credit-card', 'custom-token'];
      
      const ssnInput = createMockInputElement('ssn', '123-45-6789');
      expect(sanitizeValue(ssnInput, '123-45-6789', false, [], undefined, customSensitive)).toBe('[REDACTED]');

      const pinInput = createMockInputElement('pin', '9999');
      expect(sanitizeValue(pinInput, '9999', false, [], undefined, customSensitive)).toBe('[REDACTED]');

      const textInput = createMockInputElement('text', 'normal value');
      expect(sanitizeValue(textInput, 'normal value', false, [], undefined, customSensitive)).toBe('normal value');
    });

    it('should redact elements matching maskSelectors', () => {
      const div = createMockDivElement('Confidential Info', 'secret-class');
      const result = sanitizeValue(div, 'Confidential Info', false, ['.secret-class']);
      expect(result).toBe('[REDACTED]');
    });

    it('should defer to customSanitizer if provided', () => {
      const input = createMockInputElement('password', 'p@ssword');
      const customSanitizer = (_el: HTMLElement, val: string) => `CUSTOM_${val}`;
      const result = sanitizeValue(input, 'p@ssword', true, [], customSanitizer);
      expect(result).toBe('CUSTOM_p@ssword');
    });

    it('should redact everything when maskInputValues is true for input elements', () => {
      const input = createMockInputElement('text', 'user-name');
      const result = sanitizeValue(input, 'user-name', true);
      expect(result).toBe('[REDACTED]');
    });
  });

  describe('VPRLClient configuration & tracking', () => {
    let mockFetch: any;

    beforeEach(() => {
      mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok'),
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should instantiate client and configure custom sensitiveInputTypes', () => {
      const client = new VPRLClient({
        endpoint: '/api/telemetry',
        sensitiveInputTypes: ['password', 'ssn', 'pin'],
        enableClickTracking: false,
        enableInputTracking: false,
        enableErrorTracking: false,
        fetchFn: mockFetch,
      });

      expect(client).toBeDefined();
      expect(client.getQueueSize()).toBe(0);
      expect(client.getStats().totalTracked).toBe(0);
    });

    it('should merge additionalSensitiveInputTypes with defaults', () => {
      const client = new VPRLClient({
        endpoint: '/api/telemetry',
        additionalSensitiveInputTypes: ['ssn', 'pin'],
        enableClickTracking: false,
        enableInputTracking: false,
        enableErrorTracking: false,
        fetchFn: mockFetch,
      });

      expect(client).toBeDefined();
    });

    it('should track manual events and flush via fetchFn', async () => {
      const onFlushSuccess = vi.fn();
      const client = new VPRLClient({
        endpoint: '/api/telemetry',
        batchSize: 10,
        flushInterval: 60000, // high so timer doesn't fire automatically
        enableClickTracking: false,
        enableInputTracking: false,
        enableErrorTracking: false,
        fetchFn: mockFetch,
        onFlushSuccess,
      });

      client.trackEvent({
        id: 'evt-1',
        timestamp: Date.now(),
        type: 'custom',
        payload: { message: 'hello' },
      });

      expect(client.getQueueSize()).toBe(1);

      client.trackEvent({
        id: 'evt-2',
        timestamp: Date.now(),
        type: 'custom',
        payload: { message: 'world' },
      });

      expect(client.getQueueSize()).toBe(2);

      // Explicit flush
      await client.flush();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(onFlushSuccess).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'evt-1' }),
          expect.objectContaining({ id: 'evt-2' }),
        ]),
      );
      expect(client.getStats().totalSent).toBe(2);
      expect(client.getQueueSize()).toBe(0);
    });

    it('should support pause, resume, and queue clearing', () => {
      const client = new VPRLClient({
        endpoint: '/api/telemetry',
        enableClickTracking: false,
        enableInputTracking: false,
        enableErrorTracking: false,
      });

      client.pause();
      expect(client.isPaused()).toBe(true);

      client.resume();
      expect(client.isPaused()).toBe(false);

      client.trackEvent({
        id: 'evt-test',
        timestamp: Date.now(),
        type: 'custom',
      });
      expect(client.getQueueSize()).toBe(1);

      client.clearQueue();
      expect(client.getQueueSize()).toBe(0);
    });
  });
});
