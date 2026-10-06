import { memo, useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router';

/**
 * Main application Layout component with theme toggle and navigation header.
 */
function Layout() {
  const [isDark, setIsDark] = useState(() => {
    return (
      document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <div className="min-h-screen font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      <header className="px-8 py-4 shadow-md flex justify-between items-center transition-colors duration-300 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="font-bold text-xl flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          React Query Showcase
        </div>
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sky-500 font-semibold hover:text-sky-400 transition-colors">
            📝 Todos
          </Link>
          <Link
            to="/dogs"
            className="text-sky-500 font-semibold hover:text-sky-400 transition-colors"
          >
            🐶 Dogs
          </Link>
          <Link
            to="/chat"
            className="text-sky-500 font-semibold hover:text-sky-400 transition-colors"
          >
            💬 Chat
          </Link>
          <button
            onClick={toggleTheme}
            className="bg-transparent border border-sky-500 text-sky-500 rounded-lg px-3 py-1 cursor-pointer hover:bg-sky-500 hover:text-white transition-colors font-medium text-sm"
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </nav>
      </header>
      <main className="p-8 max-w-4xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default memo(Layout);
