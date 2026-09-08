import { ANSI_COLORS, type AnsiColor } from '../constants/AnsiColor';
import { type StatusType } from '../http-method';

/**
 * Returns the ANSI color formatter corresponding to a given HTTP method string.
 *
 * @param {string} httpMethod - The HTTP method name (case-insensitive).
 * @returns {AnsiColor} The ANSI color formatter function for the method, or `ANSI_COLORS.reset` as fallback.
 *
 * @example
 * const color = getMethodColor('GET');
 * console.log(color('GET /api/users'));
 */
export function getMethodColor(httpMethod: string): AnsiColor {
  const method = httpMethod?.toUpperCase()?.trim();
  if (!method) return ANSI_COLORS.reset;

  switch (method) {
    case 'GET': {
      return ANSI_COLORS.green;
    }
    case 'POST': {
      return ANSI_COLORS.cyan;
    }
    case 'PUT':
    case 'PATCH': {
      return ANSI_COLORS.yellow;
    }
    case 'DELETE': {
      return ANSI_COLORS.red;
    }
    case 'HEAD':
    case 'OPTIONS': {
      return ANSI_COLORS.magenta;
    }
    default: {
      return ANSI_COLORS.reset;
    }
  }
}

/**
 * Returns the color for an HTTP status code.
 * @param {StatusType} statusCode  - HTTP response status code.
 * @returns {AnsiColor} ANSI color escape sequence.
 */
export function getStatusColor(statusCode: StatusType): AnsiColor {
  const status = statusCode ? +statusCode : undefined;
  if (!status || Number.isNaN(status)) return ANSI_COLORS.reset;
  if (status >= 500) return ANSI_COLORS.red;
  if (status >= 400) return ANSI_COLORS.yellow;
  if (status >= 300) return ANSI_COLORS.cyan;
  if (status >= 200) return ANSI_COLORS.green;
  return ANSI_COLORS.reset;
}
