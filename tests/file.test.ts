/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import viteRequestLogger from '../lib/index';
import { stripAnsi } from '../lib/utils/file.utils';
import * as fs from 'fs';
import * as path from 'path';

describe('File Logging & ANSI Stripping', () => {
  it('should strip ANSI color sequences from text', () => {
    const coloredText = '\x1b[32m[12:00:00]\x1b[0m \x1b[1mGET\x1b[0m /api/users \x1b[32m200\x1b[0m';
    const cleanText = stripAnsi(coloredText);
    expect(cleanText).toBe('[12:00:00] GET /api/users 200');
    expect(cleanText).not.toContain('\x1b[');
  });

  it('should safely return empty string when input is null or non-string', () => {
    expect(stripAnsi(null as any)).toBe('');
    expect(stripAnsi(undefined as any)).toBe('');
  });

  it('should write logs to a file if logToFile is specified', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});

    const testLogFile = 'temp_requests_test.log';
    const resolvedPath = path.resolve(process.cwd(), testLogFile);
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }

    const plugin = viteRequestLogger({
      prefix: '/api',
      logToFile: testLogFile,
      colors: false,
    });
    let middleware: any;
    const mockServer = {
      middlewares: {
        use: (fn: any) => {
          middleware = fn;
        },
      },
    } as any;

    (plugin.configureServer as (server: any) => void)(mockServer);

    const req = {
      url: '/api/test-file',
      method: 'GET',
      on: vi.fn(),
    } as any;
    const next = vi.fn();
    const originalEnd = vi.fn();
    const res = { statusCode: 200, end: originalEnd } as any;

    middleware(req, res, next);
    res.end();

    // writeLogToFile is async (fire-and-forget), wait for file content
    await vi.waitFor(
      () => {
        expect(fs.existsSync(resolvedPath)).toBe(true);
        const content = fs.readFileSync(resolvedPath, 'utf8');
        expect(content).toContain('GET');
        expect(content).toContain('/api/test-file');
      },
      { timeout: 2000, interval: 50 },
    );

    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }
  });
});
