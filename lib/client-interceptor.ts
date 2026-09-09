/**
 * Self-executing client-side JavaScript snippet injected into the browser document head.
 *
 * Hooks into `window.fetch` and `window.XMLHttpRequest` to log incoming and outgoing
 * HTTP network calls with styled console messages, timestamps, status codes, and execution durations.
 */
export const CLIENT_INTERCEPTOR_SCRIPT = `(function () {
  if (typeof window === 'undefined' || window.__REQUEST_LOGGER_INITIALIZED__) return;
  window.__REQUEST_LOGGER_INITIALIZED__ = true;

  var originalFetch = window.fetch;
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
        console.log(
          '%c[HTTP/Fetch]',
          'color: #38bdf8; font-weight: bold;',
          method + ' ' + url + ' ' + res.status + ' - ' + duration + 'ms'
        );
        return res;
      } catch (err) {
        var failDuration = (performance.now() - start).toFixed(1);
        console.error(
          '[HTTP/Fetch] ' + method + ' ' + url + ' FAILED - ' + failDuration + 'ms',
          err
        );
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
          console.log(
            '%c[HTTP/XHR]',
            'color: #38bdf8; font-weight: bold;',
            self._logMeta.method + ' ' + self._logMeta.url + ' ' + self.status + ' - ' + duration + 'ms'
          );
        });
        this.addEventListener('error', function () {
          var duration = (performance.now() - start).toFixed(1);
          console.error(
            '[HTTP/XHR] ' + self._logMeta.method + ' ' + self._logMeta.url + ' FAILED - ' + duration + 'ms'
          );
        });
      }
      return originalXSend.apply(this, arguments);
    };
  }
})();`;
