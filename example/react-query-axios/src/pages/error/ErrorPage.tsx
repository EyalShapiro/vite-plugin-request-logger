import { memo, useMemo } from 'react';
import { useRouteError, Link } from 'react-router';
import { getErrorDetails } from './getErrorDetails';

function ErrorPage() {
  const error = useRouteError();
  const { title, message, icon, statusBadge } = useMemo(() => getErrorDetails(error), [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md w-full text-center shadow-xl">
        <span className="text-5xl mb-4 block">{icon}</span>
        {statusBadge && (
          <span className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-mono font-semibold mb-3">
            {statusBadge}
          </span>
        )}
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">{title}</h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 break-words bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
          {message}
        </p>
        <Link
          to="/"
          className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors shadow"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

export default memo(ErrorPage);
