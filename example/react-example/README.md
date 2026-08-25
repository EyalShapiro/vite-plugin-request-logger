# React Sandbox Example - Vite Request Logger

This directory contains a complete React + TypeScript application demonstrating `vite-plugin-request-logger`.

## Features Demonstrated

1. **Native Fetch POST request**: Sends a JSON body with sensitive data (`password`) to demonstrate JSON body formatting and automatic redaction of sensitive credentials.
2. **Axios POST request**: Demonstrates logging of requests generated via external clients (Axios).

## How to Run

1. Make sure you build the parent plugin package first:

   ```bash
   npm run build
   ```

2. From the root directory, run:

   ```bash
   npm run example:npm
   # or example:pnpm or example:yarn depending on your workspace setup
   ```

   This command starts the React app development server.

3. Open `http://localhost:3000` in your web browser. Click the buttons to trigger network actions and watch your development console terminal for request logs.
