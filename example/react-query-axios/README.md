# ⚛️ React Query + Axios Example

> **vite-plugin-request-logger** integration with React 19, `@tanstack/react-query`, Axios, React Router, and Tailwind CSS v4.

## 🚀 Overview

This example demonstrates how `vite-plugin-request-logger` captures, intercepts, and formats HTTP requests sent using:

- **Axios Custom Instance** (`axiosInstance = axios.create(...)`)
- **TanStack React Query v5** (`useQuery`, `useMutation`, `QueryClient`)
- **React Router** (`createBrowserRouter` with data routers, split pages, and unified error boundary)
- **Tailwind CSS v4** with dark mode support
- **Map In-Memory Backend** (`server/mock-server.ts`) using high-performance `Map` data structures for server storage
- **Vite Dev Server Middleware** (logs in terminal with colorized status, duration, and body payload)

## ✨ Features Showcased

- 📝 **Todos Page**: Demonstrates `useQuery`, `useMutation`, and **Optimistic Updates** (toggle completion, add todo, clear completed).
- 🐶 **Dogs Page & Breed Details**: Clean, split routing (`/dogs` and `/dogs/:breed`) showcasing `useGetDocs` and `useGetDogImage` via Axios.
- 💬 **Cute Chat Page**: Simulated dog bot chat application with real-time optimistic updates and simulated latency.
- ⚠️ **Unified Error Handling**: Robust `ErrorPage` utilizing `isRouteErrorResponse` and `axios.isAxiosError` for clean 404 and runtime error states.
- 🌙 **Tailwind Dark Mode**: Seamless theme switching without extra Context providers.

## 🛠️ Getting Started

Run from root directory:

```bash
npm run example:react-query
```

Or inside `example/react-query-axios`:

```bash
npm install
npm run dev
```

Open [http://localhost:5180](http://localhost:5180) in your browser.

## ⚙️ Vite Configuration (`vite.config.ts`)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteRequestLogger } from 'vite-plugin-request-logger';
import { mockApiPlugin } from './server/mock-server';

export default defineConfig({
  plugins: [
    react(),
    mockApiPlugin(),
    viteRequestLogger({
      prefix: '/api',
      logBody: true,
      logHeaders: true,
      redactKeys: ['token', 'password'],
      disableClientLogs: true,
    }),
  ],
});
```

---

_Created by Eyal Shapiro_
