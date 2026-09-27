'use client';

import { useState } from 'react';

export default function HomePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      addLog(`GET /api/users (${res.status}): ${JSON.stringify(data)}`);
    } catch (err) {
      addLog(`GET /api/users ERROR: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 299.99,
          currency: 'USD',
          password: 'SuperSecretUserPassword123!',
          token: 'jwt-bearer-sensitive-token',
          items: [{ id: 'item-101', name: 'Pro License' }],
        }),
      });
      const data = await res.json();
      addLog(`POST /api/checkout (${res.status}) [Redact Test]: ${JSON.stringify(data)}`);
    } catch (err) {
      addLog(`POST /api/checkout ERROR: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlow = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/slow');
      const data = await res.json();
      addLog(`GET /api/slow (${res.status}): ${JSON.stringify(data)}`);
    } catch (err) {
      addLog(`GET /api/slow ERROR: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <div className="card">
        <h1>🚀 Next.js 14 SSR App Router Example</h1>
        <p>
          Demonstrating <code>vite-plugin-request-logger</code> standalone middleware integrated into Next.js App Router API routes.
        </p>

        <div className="button-group">
          <button className="btn-success" onClick={fetchUsers} disabled={loading}>
            GET /api/users
          </button>
          <button className="btn-warning" onClick={createCheckout} disabled={loading}>
            POST /api/checkout (Sensitive Data)
          </button>
          <button className="btn-danger" onClick={fetchSlow} disabled={loading}>
            GET /api/slow (Delayed)
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Client Output Console</h3>
        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Check your terminal running <code>node server.mjs</code> or <code>npm run dev</code> to view full formatted HTTP logs with sensitive payload redactions!
        </p>
        <div className="log-box">
          {logs.length === 0 ? 'No requests sent yet. Click a button above!' : logs.join('\n')}
        </div>
      </div>
    </main>
  );
}
