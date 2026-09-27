# 🌐 Nginx Reverse Proxy with Distributed Tracing

This example demonstrates how **Nginx** generates a unique `$request_id` for incoming traffic, injects it into `X-Request-ID` / `X-Trace-ID` headers, and how **`vite-plugin-request-logger/trace`** picks it up automatically using Node's `AsyncLocalStorage`.

---

## 🏗️ Architecture

```
Browser Client
   │
   │  (optional X-VPRL-Interaction-ID)
   ▼
[Nginx Reverse Proxy :8080]
   │  - Generates $request_id (e.g. "a1b2c3d4e5f6...")
   │  - Injects X-Trace-ID: $request_id
   │  - Injects X-Request-ID: $request_id
   ▼
[Vite / Node Application :3000]
   │  - vprlTraceMiddleware() captures $request_id into AsyncLocalStorage
   │  - createRequestLoggerMiddleware() logs request with trace ID
   │  - getCurrentTraceId() accessible in downstream database & service calls
```

---

## 🚀 Running with Docker Compose

```bash
cd example/nginx-proxy
docker compose up
```

Send a request through Nginx:
```bash
curl -X POST http://localhost:8080/api/checkout \
  -H "Content-Type: application/json" \
  -H "X-VPRL-Interaction-ID: click-btn-checkout" \
  -d '{"plan": "pro"}'
```

Output in server logs:
```
[POST] /api/checkout 200 (1.24ms) [trace:a1b2c3d4e5f67890] [interaction:click-btn-checkout]
  Headers: {"x-trace-id":"a1b2c3d4e5f67890","x-vprl-interaction-id":"click-btn-checkout",...}
  Body: {
    "plan": "pro"
  }
```

---

## 🛠️ Nginx Configuration Snippet (`nginx.conf`)

```nginx
location / {
  # Generate and propagate trace ID
  proxy_set_header X-Request-ID $request_id;
  proxy_set_header X-Trace-ID   $request_id;
  
  # Forward browser interaction telemetry header
  proxy_set_header X-VPRL-Interaction-ID $http_x_vprl_interaction_id;
  
  proxy_pass http://app:3000;
}
```
