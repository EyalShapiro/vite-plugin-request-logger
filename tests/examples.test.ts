import { describe, it, expect, vi } from 'vitest';
import { viteRequestLogger } from '../lib/index';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { EventEmitter } from 'node:events';

describe('Examples & Framework Integrations Test Suite', () => {
  it('should format and log React Query / Axios GET request correctly', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const plugin = viteRequestLogger({ prefix: '/api', logBody: true });

    const req = Object.assign(new EventEmitter(), {
      method: 'GET',
      url: '/api/todos',
      headers: { 'user-agent': 'Axios/1.19.0' },
    }) as unknown as IncomingMessage;

    const res = Object.assign(new EventEmitter(), {
      statusCode: 200,
      getHeader: () => 'application/json',
      end: vi.fn(function (this: any) {
        this.emit('finish');
      }),
    }) as unknown as ServerResponse;

    let middleware: any;
    const mockServer = {
      middlewares: {
        use: (fn: any) => {
          middleware = fn;
        },
      },
    };

    plugin.configureServer!(mockServer as any);
    middleware(req, res, () => {});
    res.end(JSON.stringify([{ id: 1, title: 'Test Todo' }]));

    expect(infoSpy).toHaveBeenCalled();
    expect(infoSpy.mock.calls[0][0]).toContain('GET');
    expect(infoSpy.mock.calls[0][0]).toContain('/api/todos');
    infoSpy.mockRestore();
  });

  it('should format and log Solid-TS POST request with body payload', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const plugin = viteRequestLogger({ prefix: '/api', logBody: true });

    const req = Object.assign(new EventEmitter(), {
      method: 'POST',
      url: '/api/posts',
      headers: { 'content-type': 'application/json' },
    }) as unknown as IncomingMessage;

    const res = Object.assign(new EventEmitter(), {
      statusCode: 201,
      getHeader: () => 'application/json',
      end: vi.fn(function (this: any) {
        this.emit('finish');
      }),
    }) as unknown as ServerResponse;

    let middleware: any;
    const mockServer = {
      middlewares: {
        use: (fn: any) => {
          middleware = fn;
        },
      },
    };

    plugin.configureServer!(mockServer as any);
    middleware(req, res, () => {});

    req.emit('data', Buffer.from(JSON.stringify({ title: 'Solid Signal Post' })));
    req.emit('end');

    res.end(JSON.stringify({ success: true }));

    expect(infoSpy).toHaveBeenCalled();
    expect(infoSpy.mock.calls[0][0]).toContain('POST');
    expect(infoSpy.mock.calls[0][0]).toContain('/api/posts');
    infoSpy.mockRestore();
  });
});
