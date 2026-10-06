import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';

import './index.css';

import { Router } from './routers';
import ReactQueryProvider from './contexts/ReactQueryProvider';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <RouterProvider router={Router} />
    </ReactQueryProvider>
  </React.StrictMode>,
);
