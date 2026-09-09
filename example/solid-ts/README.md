# 🔷 SolidJS + Vike Example (`solid-ts`)

Professional production-ready setup combining **Vite**, **SolidJS**, **vike** (SSR / Routing framework), and `vite-plugin-request-logger`.

## 🚀 Overview

Demonstrates how `vite-plugin-request-logger` integrates seamlessly with Vike + SolidJS fullstack applications, capturing request timings, method information, and JSON payload bodies.

## 🛠️ Getting Started

```bash
cd example/solid-ts
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or Vite assigned port).

## ⚙️ Vite Configuration (`vite.config.ts`)

```ts
import vike from 'vike/plugin';
import { defineConfig } from 'vite';
import vikeSolid from 'vike-solid/vite';
import { viteRequestLogger } from 'vite-plugin-request-logger';

export default defineConfig({
  plugins: [
    vike(),
    vikeSolid(),
    viteRequestLogger({
      prefix: '/api',
      logBody: true,
    }),
  ],
});
```

---

_Created by Eyal Shapiro_
