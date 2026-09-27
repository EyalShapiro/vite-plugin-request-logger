# 🎨 Custom Features Example — vite-plugin-request-logger

Demonstrates custom `filter` functions, `customMsg` status annotations, external `logger` instances, and **`@vprl/client` Browser Telemetry** with configurable sensitive input types.

## Features Shown

- **Custom Sensitive Types (`@vprl/client`)**: Automatically redacts custom input types (such as `ssn`, `pin`, `credit-card`) alongside default types (`password`, `email`, `tel`, `card`).
- **Custom Filter**: Dynamically skip or include requests based on headers, method, or path parameters.
- **Custom Message**: Append custom status messages or user context to log lines.
- **Custom Logger Output**: Send formatted logs to external log management services.

---

_Created by Eyal Shapiro_
