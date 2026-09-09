import { createSignal, createResource, For } from 'solid-js';

interface Post {
  id: number;
  title: string;
  author: string;
}

const fetchPosts = async (): Promise<Post[]> => {
  const res = await fetch('/api/posts');
  return res.json();
};

export function App() {
  const [posts, { refetch }] = createResource(fetchPosts);
  const [postTitle, setPostTitle] = createSignal('');
  const [statusMsg, setStatusMsg] = createSignal('Ready.');

  const handleCreatePost = async (e: Event) => {
    e.preventDefault();
    if (!postTitle().trim()) return;

    setStatusMsg('Posting new item...');
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: postTitle(), author: 'Solid-TS User' }),
      });
      setPostTitle('');
      setStatusMsg('Post created! Check logs.');
      refetch();
    } catch (err) {
      setStatusMsg(`Error: ${String(err)}`);
    }
  };

  return (
    <div
      style={{ 'max-width': '750px', margin: '2rem auto', 'font-family': 'system-ui, sans-serif' }}
    >
      <header
        style={{
          'border-bottom': '2px solid #38bdf8',
          'padding-bottom': '1rem',
          'margin-bottom': '1.5rem',
        }}
      >
        <h1 style={{ color: '#0284c7', 'font-size': '2rem' }}>
          🔷 Solid-TS + Vite Request Logger Demo
        </h1>
        <p style={{ color: '#475569' }}>
          Demonstrating fine-grained SolidJS signal fetching logged by{' '}
          <code>vite-plugin-request-logger</code>.
        </p>
      </header>

      <section
        style={{
          background: '#f0f9ff',
          padding: '1.5rem',
          'border-radius': '10px',
          'margin-bottom': '1.5rem',
        }}
      >
        <h3>⚡ Actions</h3>
        <button
          onClick={() => refetch()}
          style={{
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            padding: '0.6rem 1.2rem',
            'border-radius': '6px',
            cursor: 'pointer',
            'margin-right': '1rem',
          }}
        >
          🔄 Refetch /api/posts
        </button>

        <form onSubmit={handleCreatePost} style={{ display: 'inline-flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="New post title..."
            value={postTitle()}
            onInput={(e) => setPostTitle(e.currentTarget.value)}
            style={{ padding: '0.6rem', 'border-radius': '6px', border: '1px solid #94a3b8' }}
          />
          <button
            type="submit"
            style={{
              background: '#0369a1',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.2rem',
              'border-radius': '6px',
              cursor: 'pointer',
            }}
          >
            Post Item
          </button>
        </form>
      </section>

      <p
        style={{
          'font-family': 'monospace',
          background: '#0f172a',
          color: '#38bdf8',
          padding: '0.8rem 1rem',
          'border-radius': '6px',
        }}
      >
        Status: {statusMsg()}
      </p>

      <section>
        <h3>📬 Posts List</h3>
        {posts.loading && <p>Loading Solid resource...</p>}
        {posts.error && <p style={{ color: 'red' }}>Error loading resource.</p>}
        <ul>
          <For each={posts()}>
            {(post) => (
              <li style={{ padding: '0.6rem', 'border-bottom': '1px solid #e2e8f0' }}>
                <strong>{post.title}</strong> — <em style={{ color: '#64748b' }}>{post.author}</em>
              </li>
            )}
          </For>
        </ul>
      </section>
    </div>
  );
}

export default App;
