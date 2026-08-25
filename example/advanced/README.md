# Advanced Example — vite-plugin-request-logger

Demonstrates **all plugin options** using **Vite 5** (broadly compatible with older projects).

## Features shown

| Feature            | Detail                                           |
| ------------------ | ------------------------------------------------ |
| `format: 'dev'`    | Colored timestamp, method, URL, status, time     |
| `logBody: true`    | Pretty-prints POST/PUT/PATCH/DELETE bodies       |
| `logHeaders: true` | Logs all incoming request headers                |
| `redactKeys`       | Hides `password`, `token`, `authorization`, etc. |
| `logToFile`        | Appends plain-text logs to `logs/requests.log`   |
| `prefix: '/api'`   | Ignores non-API requests                         |

## Running

```bash
cd example/advanced
npm install
npm run dev
```

Open <http://localhost:3001> and click the buttons.  
Check your **terminal** for colored log output and `logs/requests.log` for the file log.
