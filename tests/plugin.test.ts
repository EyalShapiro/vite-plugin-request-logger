/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from 'vitest';
import viteRequestLogger, { PLUGIN_NAME } from '../lib/index';

describe('Vite Plugin Lifecycle & Setup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create plugin with correct name and pre enforcement', () => {
    const plugin = viteRequestLogger();
    expect(plugin.name).toBe(PLUGIN_NAME);
    expect(plugin.enforce).toBe('pre');
  });

  it('should attach middleware in configureServer', () => {
    const plugin = viteRequestLogger();
    const mockUse = vi.fn();
    const mockServer = {
      middlewares: {
        use: mockUse,
      },
    } as any;

    const configureServer = plugin.configureServer as (server: any) => void;
    configureServer(mockServer);
    expect(mockUse).toHaveBeenCalledTimes(1);
  });

  it('should attach middleware in configurePreviewServer', () => {
    const plugin = viteRequestLogger();
    const mockUse = vi.fn();
    const mockPreviewServer = {
      middlewares: {
        use: mockUse,
      },
    } as any;

    const configurePreviewServer = plugin.configurePreviewServer as (server: any) => void;
    configurePreviewServer(mockPreviewServer);
    expect(mockUse).toHaveBeenCalledTimes(1);
  });

  it('should inject client interception script via transformIndexHtml', () => {
    const plugin = viteRequestLogger();
    const transformHtml = plugin.transformIndexHtml as (html: string) => any;
    expect(transformHtml).toBeDefined();

    const result = transformHtml('<html><head></head><body></body></html>');
    expect(result.tags).toBeDefined();
    expect(result.tags.length).toBeGreaterThan(0);
    expect(result.tags[0].tag).toBe('script');
    expect(result.tags[0].injectTo).toBe('head-prepend');
    expect(result.tags[0].children).toContain('window.fetch');
    expect(result.tags[0].children).toContain('XMLHttpRequest');
  });
});
