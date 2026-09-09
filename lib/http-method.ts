/**
 * List of HTTP mutation methods that typically carry a request body payload.
 */
export const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

/**
 * Union type representing HTTP methods that typically carry a payload body.
 */
export type HttpMethodWithBody = (typeof METHODS_WITH_BODY)[number];

/**
 * Type representing valid HTTP methods supported by Node.js http module and standard web clients.
 */
export type HttpMethodType =
  'GET' | HttpMethodWithBody | 'HEAD' | 'OPTIONS' | (RequestInit['method'] & {});

/**
 * Type representing HTTP response status codes as numbers or string numbers.
 */
export type StatusType = number | `${number}`;
