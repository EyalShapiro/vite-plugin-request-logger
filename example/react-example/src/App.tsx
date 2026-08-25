import { useState } from 'react';
import { postTasks, postTasksWithAxiosInstance, postUser, postUserWithAxiosInstance } from './api';

export function App() {
  const [response, setResponse] = useState<string>('');

  const sendAxiosPost = async () => {
    try {
      const data = await postUser({
        name: 'name',
        role: 'role',
      });

      setResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      setResponse(`Axios POST failed: ${message}`);
    }
  };

  const sendAxiosInstancePost = async () => {
    try {
      const data = await postUserWithAxiosInstance({
        name: 'name',
        role: 'role',
      });

      setResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      setResponse(`Axios instance POST failed: ${message}`);
    }
  };

  const sendNativeFetch = async () => {
    try {
      const data = await postTasks(
        JSON.stringify({
          task: 'Build Vite Plugin',
          status: 'Completed',
          password: 'secretpassword123',
        }),
      );

      setResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      setResponse(`Fetch POST failed: ${message}`);
    }
  };

  const sendAxiosInstanceTaskPost = async () => {
    try {
      const data = await postTasksWithAxiosInstance({
        task: 'Build Vite Plugin',
        status: 'Completed',
        password: 'secretpassword123',
      });

      setResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      setResponse(`Axios instance task POST failed: ${message}`);
    }
  };

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        margin: '0 auto',
        height: '100%',
      }}
    >
      <header>
        <h1 style={{ color: 'var(--accent)', fontSize: '4vw' }}>
          Vite Request Logger - React Demo
        </h1>
      </header>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <button onClick={sendAxiosPost}>Send Axios POST</button>

        <button onClick={sendAxiosInstancePost}>Send Axios Instance POST</button>

        <button onClick={sendNativeFetch}>Send Native Fetch POST</button>

        <button onClick={sendAxiosInstanceTaskPost}>Send Axios Instance Task POST</button>
      </div>

      <h3>Response Sandbox:</h3>

      <pre
        style={{
          background: '#f4f4f4',
          padding: '1rem',
          borderRadius: '4px',
          overflowX: 'auto',
          border: '1px solid #ccc',
        }}
      >
        {response || 'Click a button to trigger requests'}
      </pre>
    </div>
  );
}

export default App;
