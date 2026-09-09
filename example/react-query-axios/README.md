# ⚛️ React Query + Axios Example

> **vite-plugin-request-logger** integration with React 19, `@tanstack/react-query`, and `axios` (with custom Axios instance).

## 🚀 Overview

This example demonstrates how `vite-plugin-request-logger` captures, intercepts, and formats HTTP requests sent using:

- **Axios Custom Instance** (`apiClient = axios.create(...)`)
- **TanStack React Query** (`useQuery`, `useMutation`)
- **Browser Client Interceptor** (logs in DevTools console)
- **Vite Dev Server Middleware** (logs in terminal with colorized status, duration, and body payload)

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
import react from '@vitejs.plugin-react';
import { viteRequestLogger } from 'vite-plugin-request-logger';

export default defineConfig({
  plugins: [
    react(),
    viteRequestLogger({
      prefix: '/api',
      logBody: true,
      logHeaders: true,
      redactKeys: ['token', 'password'],
    }),
  ],
});
```

---

_Created by Eyal Shapiro_
