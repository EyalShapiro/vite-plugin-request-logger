import axios from 'axios';
import { API_ENDPOINT } from '../env.config';

/**
 * Custom Axios instance configured with base URL and default headers.
 * All requests made through this instance will be automatically intercepted
 * and logged by vite-plugin-request-logger both on the server and in the browser console.
 */
export const axiosInstance = axios.create({
  baseURL: API_ENDPOINT,
  headers: { 'Content-Type': 'application/json' },
});
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Example error logging for demonstration purposes
    console.error('[API Error Example]:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);
// Request Interceptor: Automatically attaches Bearer Token to outgoing requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Or fetch from state management / auth store

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
