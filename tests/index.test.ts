import { describe, it, expect } from 'vitest';
import viteRequestLogger, {
  createRequestLoggerMiddleware,
  formatMessage,
  DEFAULT_OPTIONS,
  PLUGIN_NAME,
  METHODS_WITH_BODY,
} from '../lib/index';

describe('Public API & Module Exports', () => {
  it('should export viteRequestLogger as default and named export', () => {
    expect(typeof viteRequestLogger).toBe('function');
  });

  it('should export createRequestLoggerMiddleware function', () => {
    expect(typeof createRequestLoggerMiddleware).toBe('function');
  });

  it('should export formatMessage function', () => {
    expect(typeof formatMessage).toBe('function');
  });

  it('should export expected constants', () => {
    expect(PLUGIN_NAME).toBe('vite-plugin-request-logger');
    expect(DEFAULT_OPTIONS).toBeDefined();
    expect(DEFAULT_OPTIONS.prefix).toBe('/api');
    expect(METHODS_WITH_BODY).toEqual(['POST', 'PUT', 'PATCH', 'DELETE']);
  });
});
