# AGENTS.md — Repository Guidelines & Rules

This document outlines the architectural patterns, coding standards, and best practices enforced across this repository.

---

## 1. Safe Execution & Robust Parsing
- **Never use raw `JSON.stringify()` or `JSON.parse()` directly in runtime logic.**
  - Always use `safeJsonStringify()` and `safeJsonParse()` from `lib/utils/json.utils.ts`.
  - Provide sensible fallback defaults (`'{}'`, `undefined`, or typed fallbacks).
- **Safe Execution Wrapping**:
  - Wrap user-provided callbacks (e.g., `filter`, `customMsg`, `customSanitizer`, `beforeSend`) with `safeExec()` or try/catch.
  - Logging or telemetry failures must **never** crash the host server or break the browser application.

---

## 2. File Size & Modular Structure
- **Keep files small and focused**:
  - Aim for files under **150 lines** (absolute maximum 200 lines).
  - Split large components into sub-modules (e.g., `lib/client/`, `lib/trace/`, `lib/transports/`, `lib/utils/`).
  - Keep single-responsibility per file: separate types, constants, listeners, state machines, and middleware logic.

---

## 3. Strict Typing & JSDoc Standards
- Every function, interface, type, and exported constant must have **comprehensive JSDoc comments in English**.
- Include `@example`, `@param`, `@returns`, and `@default` tags.
- Avoid `any` wherever possible. Use precise generics (`T`, `RequestContext`, `VPRLEvent`).

---

## 4. Constants & State Machines over Magic Strings
- Avoid hardcoded magic strings for states, colors, or options.
- Use `const` objects or union types (e.g., `CircuitBreakerState = { CLOSED: 'CLOSED', OPEN: 'OPEN' } as const`).

---

## 5. Rich Examples & Production Patterns
- Every core feature must have a working example under `example/`:
  - `example/custom-features`: Custom filters, sensitive input types, Vite logger integration.
  - `example/nextjs-ssr`: Next.js 14 App Router, custom server & middleware.
  - `example/express-standalone`: Standalone Connect / Express server logging.
  - `example/nginx-proxy`: Nginx reverse proxy with `$request_id` distributed tracing.
- Maintain a clear and updated `README.md` with configuration tables and CLI usage.

---

## 6. Verification & Zero-Error Builds
- Run `npm test` (`vitest`) and `npm run build` (`tsup`) before finishing tasks.
- Ensure all tests pass with 100% success and 0 compilation errors across ESM, CJS, and TypeScript declaration files (`.d.ts`, `.d.cts`).
