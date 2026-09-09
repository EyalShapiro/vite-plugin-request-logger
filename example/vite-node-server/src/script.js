/* eslint-env browser */
const REQUESTS = Object.freeze([
  { method: 'POST', url: '/api/users', body: { name: 'Alice', password: 's3cr3t' } },
  { method: 'PUT', url: '/api/users/1', body: { name: 'Bob', token: 'tok123' } },
  { method: 'PATCH', url: '/api/users/1', body: { email: 'b@b.com' } },
  { method: 'DELETE', url: '/api/users/1' },
]);

function main() {
  const logEl = window.document.getElementById('log');
  const clearBtn = window.document.getElementById('clear-btn');
  const buttons = window.document.querySelectorAll('.btn-group button');

  function appendLog(cls, text) {
    const span = window.document.createElement('span');

    span.className = cls;
    span.textContent = `${text}\n`;

    logEl.appendChild(span);
    logEl.scrollTop = logEl.scrollHeight;
  }

  async function req(method, url, body) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      opts.body = JSON.stringify(body);
    }

    const t = performance.now();

    appendLog('log-info', `→ ${method} ${url}${body ? `  ${JSON.stringify(body)}` : ''}`);

    try {
      const res = await fetch(url, opts);
      const ms = (performance.now() - t).toFixed(1);

      const data = await res.json().catch(() => ({}));

      const cls = res.ok ? 'log-ok' : res.status >= 500 ? 'log-error' : 'log-warn';

      appendLog(cls, `← ${res.status} ${ms}ms  ${JSON.stringify(data)}`);
    } catch (err) {
      appendLog('log-error', `✗ ${err.message}`);
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const method = button.dataset.method;
      const url = button.dataset.url;

      const body = button.dataset.body ? JSON.parse(button.dataset.body) : undefined;

      req(method, url, body);
    });
  });

  clearBtn.addEventListener('click', () => {
    logEl.replaceChildren();
  });

  const btnGroup = window.document.querySelector('.btn-group');
  for (const { method, url, body } of REQUESTS) {
    const button = window.document.createElement('button');

    button.className = `btn-${method.toLowerCase()}`;
    button.textContent = `${method} ${url}`;

    button.addEventListener('click', () => {
      req(method, url, body);
    });

    btnGroup.appendChild(button);
  }
}
void main();
