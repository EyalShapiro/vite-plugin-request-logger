/**
 * @file main.ts
 * @description
 * Browser-side entry point for the **advanced** vite-plugin-request-logger example.
 *
 * Each button fires a different HTTP request so you can observe the plugin's
 * terminal output live. Requests to `/public/*` are intentionally outside the
 * `/api` prefix and will **not** appear in the plugin logs.
 *
 * Features demonstrated:
 * - All HTTP methods: GET, POST, PUT, PATCH, DELETE
 * - JSON body logging with automatic pretty-printing
 * - Automatic redaction of sensitive keys (`password`, `token`, `authorization`)
 * - Header logging
 * - File logging (appended to `logs/requests.log` in the project root)
 * - Requests outside the prefix are silently ignored by the plugin
 */

/** Reference to the on-screen log panel element. */
const logEl = document.getElementById('log') as HTMLDivElement;

/**
 * Appends a new entry to the browser-side log panel.
 *
 * @param method  - HTTP method string (used to pick a CSS class).
 * @param url     - The request URL that was fired.
 * @param status  - HTTP status code returned by the server.
 * @param ms      - Round-trip duration in milliseconds.
 */
function appendLog(method: string, url: string, status: number, ms: number): void {
  // Remove placeholder text on first real entry
  const placeholder = logEl.querySelector('.placeholder');
  if (placeholder) placeholder.remove();

  const p = document.createElement('p');
  p.className = `entry-${method.toLowerCase()}`;
  p.textContent = `[${new Date().toLocaleTimeString()}] ${method.padEnd(6)} ${url}  →  ${status}  (${ms}ms)`;
  logEl.prepend(p);
}

/**
 * Generic fetch wrapper that fires a request, measures timing, and logs it
 * to the on-screen panel. Errors are caught and shown as orange entries.
 *
 * @param method  - HTTP method to use.
 * @param url     - Target URL (relative).
 * @param body    - Optional JSON-serializable request body.
 * @param headers - Optional extra request headers.
 */
async function request(
  method: string,
  url: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<void> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const ms = Math.round(performance.now() - start);
    appendLog(method, url, res.status, ms);
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    const p = document.createElement('p');
    p.className = 'entry-error';
    p.textContent = `[${new Date().toLocaleTimeString()}] ${method} ${url}  →  ERR (${ms}ms)  ${String(err)}`;
    logEl.prepend(p);
  }
}

// ── Button wiring ──────────────────────────────────────────────────────────────

/** GET /api/users — simple read request */
document.getElementById('btn-get')!.addEventListener('click', () => {
  void request('GET', '/api/users');
});

/** POST /api/users — body will be pretty-printed in terminal */
document.getElementById('btn-post')!.addEventListener('click', () => {
  void request('POST', '/api/users', { name: 'Alice', age: 30, role: 'admin' });
});

/** PUT /api/users/1 — full update */
document.getElementById('btn-put')!.addEventListener('click', () => {
  void request('PUT', '/api/users/1', { name: 'Alice Updated', age: 31 });
});

/** PATCH /api/users/1 — partial update */
document.getElementById('btn-patch')!.addEventListener('click', () => {
  void request('PATCH', '/api/users/1', { age: 32 });
});

/** DELETE /api/users/1 */
document.getElementById('btn-delete')!.addEventListener('click', () => {
  void request('DELETE', '/api/users/1');
});

/**
 * POST /api/login — demonstrates **automatic redaction**.
 * The `password` and `token` fields will show as `[REDACTED]` in the terminal.
 */
document.getElementById('btn-login')!.addEventListener('click', () => {
  void request(
    'POST',
    '/api/login',
    { username: 'eyal', password: 'super-secret-123', rememberMe: true },
    { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.secret' },
  );
});

/** GET /api/health — simple health-check ping */
document.getElementById('btn-health')!.addEventListener('click', () => {
  void request('GET', '/api/health');
});

/**
 * GET /public/logo.png — this URL does NOT start with `/api`,
 * so the plugin will silently ignore it.
 */
document.getElementById('btn-ignored')!.addEventListener('click', () => {
  void request('GET', '/public/logo.png');
});

/** Clears the on-screen log panel. */
document.getElementById('btn-clear')!.addEventListener('click', () => {
  logEl.innerHTML = '<p class="placeholder">Log cleared.</p>';
});
