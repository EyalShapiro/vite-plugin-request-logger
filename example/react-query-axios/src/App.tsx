import { useState } from 'react';
import { useFetchTodos, useAddTodo } from './api/queries';

export function App() {
  const { data: todos, isLoading, isError } = useFetchTodos();
  const addTodoMutation = useAddTodo();
  const [newTitle, setNewTitle] = useState('');
  const [logStatus, setLogStatus] = useState<string>('Ready to trigger requests...');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLogStatus('Sending POST request via Axios & React Query...');
    addTodoMutation.mutate(
      { title: newTitle },
      {
        onSuccess: () => {
          setNewTitle('');
          setLogStatus('POST succeeded! Check server terminal and browser console logs.');
        },
        onError: (err) => {
          setLogStatus(`Error: ${String(err)}`);
        },
      },
    );
  };

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '2rem auto',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#1e293b',
      }}
    >
      <header
        style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '2rem' }}
      >
        <h1
          style={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '2.2rem',
            fontWeight: 800,
          }}
        >
          React Query + Axios Logger Demo
        </h1>
        <p style={{ color: '#64748b' }}>
          Demonstrating <code>vite-plugin-request-logger</code> capturing requests sent via Axios
          custom instance and TanStack React Query.
        </p>
      </header>

      <main>
        <section
          style={{
            background: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>⚡ Trigger Requests</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button
              onClick={() => {
                setLogStatus('Refetching todos via React Query...');
              }}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              🔄 Refetch GET /api/todos
            </button>
          </div>

          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.8rem' }}>
            <input
              type="text"
              placeholder="Enter new todo..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
              }}
            />
            <button
              type="submit"
              disabled={addTodoMutation.isPending}
              style={{
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {addTodoMutation.isPending ? 'Adding...' : ' Add POST /api/todos'}
            </button>
          </form>
        </section>

        <section
          style={{
            background: '#0f172a',
            color: '#38bdf8',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            fontFamily: 'monospace',
            marginBottom: '2rem',
          }}
        >
          <strong>Status:</strong> {logStatus}
        </section>

        <section>
          <h3>📋 Todos List (React Query State)</h3>
          {isLoading && <p>Loading todos...</p>}
          {isError && <p style={{ color: '#ef4444' }}>Failed to load todos.</p>}
          {todos && (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {todos.map((item) => (
                <li
                  key={item.id}
                  style={{
                    padding: '0.8rem 1rem',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{item.title}</span>
                  <span style={{ color: item.completed ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {item.completed ? '✓ Completed' : '⏳ Pending'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
