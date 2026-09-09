import axios from 'axios';

/**
 * Custom Axios instance configured with base URL and default headers.
 * All requests made through this instance will be automatically intercepted
 * and logged by vite-plugin-request-logger both on the server and in the browser console.
 */
export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Logger': 'React-Query-Axios-Demo',
  },
  timeout: 5000,
});
