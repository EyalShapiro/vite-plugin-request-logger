/**
 * Options for generating the client interceptor script.
 */
export interface ClientInterceptorScriptOptions {
  /** If `true`, suppresses console.log/console.error in browser DevTools while preserving terminal telemetry. */
  disableDevToolsConsole?: boolean;
}

/**
 * Generates the self-executing client-side JavaScript snippet injected into the browser document head.
 *
 * Hooks into `window.fetch` and `window.XMLHttpRequest` to log incoming and outgoing
 * HTTP network calls.
 * Dispatches log reports back to the Vite dev server (`/__vprl_log`) so external client-side calls
 * are logged on the server terminal.
 *
 * @param options Configuration options for script behavior.
 * @returns Client-side JavaScript code string.
 */
export function getClientInterceptorScript(options: ClientInterceptorScriptOptions = {}): string {
  const disableConsole = Boolean(options.disableDevToolsConsole);

  return `(function () {
  if (typeof window === 'undefined' || window.__REQUEST_LOGGER_INITIALIZED__) return;
  window.__REQUEST_LOGGER_INITIALIZED__ = true;

  var disableConsole = ${disableConsole};
  var originalFetch = window.fetch;

  function sendServerLog(method, url, status, duration) {
    if (!url || typeof url !== 'string' || url.indexOf('/__vprl_log') !== -1) return;
    try {
      var data = JSON.stringify({ method: method, url: url, status: status, duration: duration });
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon('/__vprl_log', data);
      } else if (typeof originalFetch === 'function') {
        originalFetch('/__vprl_log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true
        }).catch(function(){});
      }
    } catch (e) {}
  }

  if (originalFetch) {
    window.fetch = async function () {
      var start = performance.now();
      var resource = arguments[0];
      var config = arguments[1];
      var url = typeof resource === 'string' ? resource : (resource && resource.url) || '';
      var method = (config && config.method) || 'GET';

      try {
        var res = await originalFetch.apply(this, arguments);
        var duration = (performance.now() - start).toFixed(1);
        if (!disableConsole) {
          console.log(
            '%c[HTTP/Fetch]',
            'color: #38bdf8; font-weight: bold;',
            method + ' ' + url + ' ' + res.status + ' - ' + duration + 'ms'
          );
        }
        sendServerLog(method, url, res.status, duration);
        return res;
      } catch (err) {
        var failDuration = (performance.now() - start).toFixed(1);
        if (!disableConsole) {
          console.error(
            '[HTTP/Fetch] ' + method + ' ' + url + ' FAILED - ' + failDuration + 'ms',
            err
          );
        }
        sendServerLog(method, url, 0, failDuration);
        throw err;
      }
    };
  }

  if (typeof window.XMLHttpRequest !== 'undefined') {
    var originalXOpen = window.XMLHttpRequest.prototype.open;
    var originalXSend = window.XMLHttpRequest.prototype.send;

    window.XMLHttpRequest.prototype.open = function (method, url) {
      this._logMeta = { method: method, url: url };
      return originalXOpen.apply(this, arguments);
    };

    window.XMLHttpRequest.prototype.send = function () {
      if (this._logMeta) {
        var self = this;
        var start = performance.now();
        this.addEventListener('load', function () {
          var duration = (performance.now() - start).toFixed(1);
          if (!disableConsole) {
            console.log(
              '%c[HTTP/XHR]',
              'color: #38bdf8; font-weight: bold;',
              self._logMeta.method + ' ' + self._logMeta.url + ' ' + self.status + ' - ' + duration + 'ms'
            );
          }
          sendServerLog(self._logMeta.method, self._logMeta.url, self.status, duration);
        });
        this.addEventListener('error', function () {
          var duration = (performance.now() - start).toFixed(1);
          if (!disableConsole) {
            console.error(
              '[HTTP/XHR] ' + self._logMeta.method + ' ' + self._logMeta.url + ' FAILED - ' + duration + 'ms'
            );
          }
          sendServerLog(self._logMeta.method, self._logMeta.url, 0, duration);
        });
      }
      return originalXSend.apply(this, arguments);
    };
  }
})();`;
}

/**
 * Default self-executing client-side JavaScript snippet injected into the browser document head.
 */
export const CLIENT_INTERCEPTOR_SCRIPT = getClientInterceptorScript();
