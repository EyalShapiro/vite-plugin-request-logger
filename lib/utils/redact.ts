/**
 * Recursively redacts sensitive keys in a plain object or array,
 * replacing their values with the string `'[REDACTED]'`.
 *
 * - Matching is case-insensitive.
 * - Arrays are traversed element-by-element.
 * - Nested objects are redacted recursively.
 * - Primitive values that are not inside a matched key are returned unchanged.
 *
 * @param obj  - The value to redact. Can be an object, array, or primitive.
 * @param keys - List of key names whose values should be replaced with `'[REDACTED]'`.
 * @returns A new object/array with all matching keys redacted.
 *          The original `obj` is not mutated.
 */
export function redact<T, R = T>(obj: T, keys: string[]): R {
  if (obj === null || typeof obj !== 'object') {
    return obj as unknown as R;
  }

  const lowerKeys = new Set(keys.map((key) => key.toLowerCase()));

  if (Array.isArray(obj)) {
    return obj.map((item) => redact(item, keys)) as R;
  }

  const copy: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (lowerKeys.has(key.toLowerCase())) {
      copy[key] = '[REDACTED]';
    } else {
      copy[key] = value !== null && typeof value === 'object' ? redact(value, keys) : value;
    }
  }

  return copy as R;
}
