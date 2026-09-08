import type { LoggerOptions } from './types';
import { createRequestLoggerMiddleware, type ConnectMiddleware } from './middleware';

export const PLUGIN_NAME = 'vite-plugin-request-logger';

/**
 * Server instance containing Connect middleware capabilities.
 */
export interface MiddlewareServer {
  middlewares: {
    use: (middleware: ConnectMiddleware) => void;
  };
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
  /** Unique plugin name. */
  name: string;
  /** Plugin execution order ('pre' | 'post'). */
  enforce?: 'pre' | 'post';
  /** Vite dev server configuration hook for middleware attachment. */
  configureServer?: (server: MiddlewareServer) => (() => void) | void;
  /** Vite preview server configuration hook for middleware attachment. */
  configurePreviewServer?: (server: MiddlewareServer) => (() => void) | void;
  /** HTML transform hook for client-side script injection. */
  transformIndexHtml?: (html: string) => { html: string; tags: InjectedHtmlTag[] };
}

/**
 * Client-side script injected into the browser HTML `<head>` to intercept and log
 * all outgoing `fetch` and `XMLHttpRequest` calls in the browser developer console.
 */
const CLIENT_INTERCEPTOR_SCRIPT = `(function() {
  if (typeof window === 'undefined' || window.__REQUEST_LOGGER_INITIALIZED__) return;
  window.__REQUEST_LOGGER_INITIALIZED__ = true;

  // 1. Intercept Native Fetch (ky, ofetch, cross-fetch, native fetch)
  var originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = async function() {
      var start = performance.now();
      var resource = arguments[0];
      var config = arguments[1];
      var url = typeof resource === 'string' ? resource : (resource && resource.url) || '';
      var method = (config && config.method) || 'GET';

      try {
        var res = await originalFetch.apply(this, arguments);
        var duration = (performance.now() - start).toFixed(1);
        console.log('%c[HTTP/Fetch]', 'color: #38bdf8; font-weight: bold;', method + ' ' + url + ' ' + res.status + ' - ' + duration + 'ms');
        return res;
      } catch (err) {
        var failDuration = (performance.now() - start).toFixed(1);
        console.error('[HTTP/Fetch] ' + method + ' ' + url + ' FAILED - ' + failDuration + 'ms', err);
        throw err;
      }
    };
  }

  // 2. Intercept XMLHttpRequest (axios, superagent, legacy XHR)
  var originalXOpen = window.XMLHttpRequest.prototype.open;
  var originalXSend = window.XMLHttpRequest.prototype.send;

  window.XMLHttpRequest.prototype.open = function(method, url) {
    this._logMeta = { method: method, url: url };
    return originalXOpen.apply(this, arguments);
  };

  window.XMLHttpRequest.prototype.send = function() {
    if (this._logMeta) {
      var self = this;
      var start = performance.now();
      this.addEventListener('load', function() {
        var duration = (performance.now() - start).toFixed(1);
        console.log('%c[HTTP/XHR]', 'color: #38bdf8; font-weight: bold;', self._logMeta.method + ' ' + self._logMeta.url + ' ' + self.status + ' - ' + duration + 'ms');
      });
      this.addEventListener('error', function() {
        var duration = (performance.now() - start).toFixed(1);
        console.error('[HTTP/XHR] ' + self._logMeta.method + ' ' + self._logMeta.url + ' FAILED - ' + duration + 'ms');
      });
    }
    return originalXSend.apply(this, arguments);
  };
})();`;

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
            injectTo: 'head-prepend',
            children: CLIENT_INTERCEPTOR_SCRIPT,
          },
        ],
      };
    },
  };
}
