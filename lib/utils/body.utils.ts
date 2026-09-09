import type { IncomingMessage } from 'http';
import type { LoggerOptions } from '../types';
import { DEFAULT_OPTIONS } from '../constants/default-options';
import { safeJsonParse, safeJsonStringify } from './json.utils';
import { redact, redactWithRegex } from './redact';
import { truncateBody } from './helpers';

/**
 * Extended IncomingMessage interface representing potential request body locations
 * across different HTTP servers, middleware chains, and body-parsers.
 */
export interface RequestWithBody extends IncomingMessage {
  body?: unknown;
  _body?: unknown;
  rawBody?: unknown;
  payload?: unknown;
}

/**
 * Resolves the raw or parsed request body candidate from multiple possible locations on the request object.
 *
 * Looks up `rawBody` stream buffer, `req.body` (e.g. Express / body-parser),
 * `req._body`, `req.rawBody`, or `req.payload`.
 *
 * @param {RequestWithBody} req - The incoming HTTP request.
 * @param {string} rawStreamBody - Body string accumulated from the request data stream chunks.
 * @returns {unknown} The candidate body value (string, object, or undefined).
 *
 * @example
 * ```ts
 * const candidate = extractRequestBody(req, rawBody);
 * ```
 */
export function extractRequestBody(req: RequestWithBody, rawStreamBody: string): unknown {
  if (rawStreamBody && rawStreamBody.trim()) {
    return rawStreamBody;
  }

  return req.body ?? req._body ?? req.rawBody ?? req.payload;
}

/**
 * Formats, redacts, and truncates a request body candidate for logger output.
 *
 * - Parses JSON strings or processes parsed objects.
 * - Redacts sensitive keys specified in `options.redactKeys`.
 * - Pretty-prints JSON with standard 2-space indentation.
 * - Falls back to regex-based redaction for non-JSON payloads.
 * - Truncates outputs exceeding `options.maxBodyLength`.
 *
 * @param {unknown} candidateBody - The raw or parsed request body.
 * @param {LoggerOptions} options - Logger configuration options containing redaction rules and length limits.
 * @returns {string} Formatted, redacted, and indented body string ready for printing, or empty string if empty.
 *
 * @example
 * ```ts
 * const formatted = formatRequestBody({ password: 'secret', user: 'eyal' }, options);
 * // Returns pretty-printed JSON with password: "[REDACTED]"
 * ```
 */
export function formatRequestBody(candidateBody: unknown, options: LoggerOptions): string {
  if (candidateBody === undefined || candidateBody === null || candidateBody === '') {
    return '';
  }

  let formatted = '';

  if (typeof candidateBody === 'string') {
    const trimmed = candidateBody.trim();
    if (trimmed) {
      const parsed = safeJsonParse(trimmed);
      if (parsed !== undefined && typeof parsed === 'object' && parsed !== null) {
        const redactedObj = redact(parsed, options.redactKeys);
        formatted = safeJsonStringify(redactedObj, { space: 2 }) ?? trimmed;
      } else {
        formatted = redactWithRegex(trimmed, options.redactKeys);
      }
    }
  } else if (typeof candidateBody === 'object') {
    const redactedObj = redact(candidateBody, options.redactKeys);
    formatted =
      safeJsonStringify(redactedObj, { space: 2 }) ?? JSON.stringify(candidateBody, null, 2);
  } else {
    formatted = String(candidateBody);
  }

  if (formatted && formatted.trim()) {
    const maxLen = options.maxBodyLength ?? DEFAULT_OPTIONS.maxBodyLength;
    if (formatted.length > maxLen) {
      formatted = truncateBody(formatted, maxLen);
    }
  }

  return formatted;
}
