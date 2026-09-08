import { describe, it, expect } from 'vitest';
import { formatMessage } from '../lib/index';

describe('formatMessage formatter', () => {
  it('should format dev preset with ANSI colors enabled', () => {
    const formatted = formatMessage({
      format: 'dev',
      method: 'GET',
      url: '/api/users',
      status: 200,
      responseTimeMs: '15.50',
      colors: true,
      timezone: 'en-US',
    });

    expect(formatted).toContain('GET');
    expect(formatted).toContain('/api/users');
    expect(formatted).toContain('200');
    expect(formatted).toContain('+15.50ms');
    expect(formatted).toContain('\x1b['); // ANSI color codes present
  });

  it('should format dev preset with colors disabled', () => {
    const formatted = formatMessage({
      format: 'dev',
      method: 'POST',
      url: '/api/login',
      status: 201,
      responseTimeMs: '30.00',
      colors: false,
      timezone: 'en-US',
    });

    expect(formatted).toContain('POST');
    expect(formatted).toContain('/api/login');
    expect(formatted).toContain('201');
    expect(formatted).toContain('+30.00ms');
    expect(formatted).not.toContain('\x1b['); // No ANSI color codes
  });

  it('should format tiny preset', () => {
    const formatted = formatMessage({
      format: 'tiny',
      method: 'DELETE',
      url: '/api/items/1',
      status: 204,
      responseTimeMs: '5.20',
    });

    expect(formatted).toBe('DELETE /api/items/1 204 - 5.20 ms');
  });

  it('should format short and combined presets', () => {
    const formattedShort = formatMessage({
      format: 'short',
      method: 'GET',
      url: '/api/data',
      status: 200,
      responseTimeMs: '10.00',
    });

    const formattedCombined = formatMessage({
      format: 'combined',
      method: 'GET',
      url: '/api/data',
      status: 200,
      responseTimeMs: '10.00',
    });

    expect(formattedShort).toBe('GET /api/data 200 10.00 ms');
    expect(formattedCombined).toBe('GET /api/data 200 10.00 ms');
  });

  it('should support positional parameter overloading', () => {
    const formatted = formatMessage('tiny', 'GET', '/api/test', 200, '12.00');
    expect(formatted).toBe('GET /api/test 200 - 12.00 ms');
  });
});
