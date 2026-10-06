import axios from 'axios';
import { isRouteErrorResponse } from 'react-router';

export interface ErrorDetails {
  title: string;
  message: string;
  icon: string;
  statusBadge: string | number | null;
}

const DEFAULT_404 = {
  statusBadge: 404,
  icon: '🔍',
  title: '404 - Page Not Found',
  message: "Oops! The page you are looking for doesn't exist or has been moved.",
} as const satisfies ErrorDetails;

export function getErrorDetails(error: unknown): ErrorDetails {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) return DEFAULT_404;

    return {
      statusBadge: error.status,
      icon: '⚠️',
      title: `${error.status} ${error.statusText || 'Error'}`,
      message:
        extractDataMessage(error.data) ||
        error.statusText ||
        'An unexpected router error occurred.',
    };
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 404) return DEFAULT_404;

    const serverMessage = extractDataMessage(error.response?.data);
    const message = serverMessage || error.message || 'An unexpected network error occurred.';

    return {
      statusBadge: status ?? 'Network Error',
      icon: '🌐',
      title: status ? `${status} ${error.response?.statusText || 'API Error'}` : 'Network Error',
      message,
    };
  }

  const message = extractErrorMessage(error);
  if (!message) {
    return DEFAULT_404;
  }

  const isError = error instanceof Error;
  return {
    statusBadge: isError ? 'Runtime Error' : 'Error',
    icon: isError ? '💥' : '⚠️',
    title: 'Application Error',
    message,
  };
}

function extractDataMessage(data: unknown): string | null {
  if (typeof data === 'string') return data;
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }
  return null;
}

function extractErrorMessage(error: unknown): string | null {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message || 'An unexpected runtime error occurred.';
  return extractDataMessage(error);
}
