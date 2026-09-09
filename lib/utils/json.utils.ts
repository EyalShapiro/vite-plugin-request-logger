/**
 * Type definition for JSON.stringify replacer parameter.
 */
export type JsonReplacer = Parameters<typeof JSON.stringify>[1];

/**
 * Safely parses a JSON string (or returns an existing object) with try/catch and casts the result to type `T`.
 *
 * If parsing fails or the input is invalid, returns the provided fallback value
 * (or `undefined` if no fallback was provided).
 *
 * @template T - The target type to cast the parsed JSON output to.
 * @param obj - The JSON string (or already parsed object) to parse and cast to `T`.
 * @param fallback - Fallback value returned if parsing throws an error.
 * @returns The parsed value cast as `T`, or the fallback value.
 *
 * @example
 * // Inferred as User | undefined
 * const user = safeJsonParse<User>('{"name": "Alice"}');
 *
 * @example
 * // Inferred as User (guaranteed fallback)
 * const user = safeJsonParse<User>('invalid json', { name: 'Default' });
 */
export function safeJsonParse<T = unknown, O = unknown>(obj: O, fallback: T): T;
export function safeJsonParse<T = unknown, O = unknown>(obj: O): T | undefined;
export function safeJsonParse<T = unknown, O = unknown>(obj: O, fallback?: T): T | undefined {
  try {
    if (typeof obj !== 'string') {
      if (obj !== null && typeof obj === 'object') {
        return obj as T;
      }
      return fallback;
    }

    return JSON.parse(obj) as T;
  } catch {
    return fallback;
  }
}

export interface SafeJsonStringifyOptions {
  /** A replacer function or array of property names/numbers to include in the output. */
  replacer?: JsonReplacer;
  /** Adds indentation and whitespace to output (e.g. 2 for pretty-printing, or '\t'). */
  space?: string | number;
  fallback?: string;
}

/**
 * Safely converts a JavaScript value or object to a JSON string using `JSON.stringify`.
 * Catches serialization errors (e.g., circular references, BigInts) without throwing.
 *
 * @template T - The type of the value being serialized.
 * @param {T} obj - The value/object to convert to a JSON string.
 * @param {SafeJsonStringifyOptions} [options] - Optional configuration object containing `replacer` and `space`.
 * @param {string} [fallback] - Fallback string returned if serialization throws or yields `undefined`.
 * @returns {string | undefined} The resulting JSON string, or the fallback value if serialization fails.
 *
 * @example
 * // Basic usage with fallback
 * safeJsonStringify(circularObj, {}, '{"error": true}');
 *
 * @example
 * // Pretty-printing with options
 * safeJsonStringify({ a: 1, b: 2 }, { space: 2 });
 */
export function safeJsonStringify<T = unknown>(
  obj: T,
  options?: SafeJsonStringifyOptions,
): string | undefined;

/**
 * Safely converts a JavaScript value or object to a JSON string with a direct fallback value.
 *
 * @template T - The type of the value being serialized.
 * @param {T} obj - The value/object to convert to a JSON string.
 * @param {string} [fallback] - Fallback string returned if serialization throws or yields `undefined`.
 * @returns {string | undefined} The resulting JSON string, or the fallback value if serialization fails.
 *
 * @example
 * safeJsonStringify(circularObj, '{"fallback": true}');
 */
export function safeJsonStringify<T = unknown>(obj: T, fallback?: string): string | undefined;

export function safeJsonStringify<T = unknown>(
  obj: T,
  optionsOrFallback?: SafeJsonStringifyOptions | string,
): string | undefined {
  const { fallback, ...options } =
    typeof optionsOrFallback === 'string'
      ? { fallback: optionsOrFallback }
      : { fallback: undefined, ...optionsOrFallback };

  try {
    const result = JSON.stringify(obj, options?.replacer, options?.space);
    return result !== undefined ? result : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Checks whether a given string is a valid JSON sequence.
 * Fails fast for empty strings, non-string types, or whitespace-only inputs.
 *
 * @param {string | null | undefined} text - The input value or string to validate.
 * @returns {boolean} `true` if the string can be parsed into valid JSON; otherwise, `false`.
 *
 * @example
 * isValidJson('{"key": "value"}'); // true
 * isValidJson('[1, 2, 3]');        // true
 * isValidJson('   ');             // false
 * isValidJson(null);              // false
 */
export function isValidJson(text: string | null | undefined): boolean {
  if (typeof text !== 'string') return false;

  const trimmed = text.trim();
  if (!trimmed) return false;

  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}
