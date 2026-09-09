import type { LoggerOptions } from './types';
import { createRequestLoggerMiddleware, type ConnectMiddleware } from './middleware';
import { CLIENT_INTERCEPTOR_SCRIPT } from './client-interceptor';

export const PLUGIN_NAME = 'vite-plugin-request-logger';

/**
 * Server instance containing Connect middleware capabilities.
 */
export interface MiddlewareServer {
  middlewares: { use: (middleware: ConnectMiddleware) => void };
}

/**
 * HTML script tag injection descriptor for Vite's `transformIndexHtml` hook.
 */
export interface InjectedHtmlTag {
  tag: string;
  attrs?: Record<string, string | boolean>;
  injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend';
  children?: string;
}

/**
 * Type representing the Vite plugin configuration object returned by `viteRequestLogger`.
 */
export interface VitePluginObject {
  name: string;
  enforce?: 'pre' | 'post';
  configureServer?: (server: MiddlewareServer) => (() => void) | void;
  configurePreviewServer?: (server: MiddlewareServer) => (() => void) | void;
  transformIndexHtml?: (html: string) => { html: string; tags: InjectedHtmlTag[] };
}

/**
 * A Morgan-like HTTP request logging plugin for Vite.
 *
 * - Intercepts requests in the Vite dev server and preview server middleware chains.
 * - Logs each request with HTTP method, URL, status code, response time, and optional body/headers.
 * - Injects client-side fetch & XHR interceptors into HTML for full visibility in the browser console.
 *
 * @param {LoggerOptions} [userOptions={}] - Configuration options for the logger.
 * @returns {VitePluginObject} A Vite plugin object to include in `vite.config.ts` `plugins: []`.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import viteRequestLogger from 'vite-plugin-request-logger';
 *
 * export default defineConfig({
 *   plugins: [
 *     viteRequestLogger({
 *       prefix: '/api',
 *       format: 'dev',
 *       logBody: true,
 *       redactKeys: ['password', 'token'],
 *     }),
 *   ],
 * });
 * ```
 */
export function viteRequestLogger(userOptions: LoggerOptions = {}): VitePluginObject {
  const middleware = createRequestLoggerMiddleware(userOptions);

  return {
    name: PLUGIN_NAME,
    // Run before other plugins so the middleware is registered early
    enforce: 'pre',

    configureServer(server: MiddlewareServer) {
      server.middlewares.use(middleware);
    },

    configurePreviewServer(server: MiddlewareServer) {
      server.middlewares.use(middleware);
    },

    transformIndexHtml(html: string) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: { type: 'module' },
            injectTo: 'head-prepend' as const,
            children: CLIENT_INTERCEPTOR_SCRIPT,
          },
        ],
      };
    },
  };
}
