import type { LoggerOptions } from '../types';

/**
 * Recursively redacts sensitive keys in a plain object or array,
 * replacing their values with the string `'[REDACTED]'`.
 *
 * - Matching is case-insensitive.
 * - Arrays are traversed element-by-element.
 * - Nested objects are redacted recursively.
 * - Primitive values that are not inside a matched key are returned unchanged.
 *
 * @template T - The input object, array, or primitive type.
 * @template R - The expected return type (defaults to `T`).
 * @param {T} obj - The value to redact. Can be an object, array, or primitive.
 * @param {LoggerOptions['redactKeys']} keys - List of key names whose values should be replaced with `'[REDACTED]'`.
 * @returns {R} A new object/array with all matching keys redacted. Original object is not mutated.
 *
 * @example
 * redact({ password: '123', name: 'John' }, ['password']);
 * // => { password: '[REDACTED]', name: 'John' }
 */
export function redact<T, R = T>(obj: T, keys: LoggerOptions['redactKeys']): R {
  if (obj === null || typeof obj !== 'object') {
    return obj as unknown as R;
  }

  if (!keys || !keys.length) return obj as unknown as R;

  const lowerKeys = new Set(keys.map((key) => key?.toLowerCase()));

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, keys)) as R;
  }

  const copy: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (lowerKeys.has(key.toLowerCase())) {
      copy[key] = '[REDACTED]';
    } else if (value !== null && typeof value === 'object') {
      copy[key] = redact(value, keys);
    } else {
      copy[key] = value;
    }
  }

  return copy as R;
}

/**
 * Redacts occurrences of sensitive keys from raw strings or malformed JSON using regular expressions.
 *
 * @param {string} text - The input raw text or malformed JSON string.
 * @param {LoggerOptions['redactKeys']} keys - List of sensitive keys to redact.
 * @returns {string} The cleansed text with matching `"key":"value"` patterns redacted.
 *
 * @example
 * redactWithRegex('{"secret":"123", invalid}', ['secret']);
 * // => '{"secret":"[REDACTED]", invalid}'
 */
export function redactWithRegex(text: string, keys: LoggerOptions['redactKeys']): string {
  if (!text || !keys || !keys.length) return text;

  let result = text;
  for (const key of keys) {
    if (!key) continue;
    const regex = new RegExp(`("${key}"\\s*:\\s*")[^"]*(")`, 'gi');
    result = result.replace(regex, `$1[REDACTED]$2`);
  }
  return result;
}
