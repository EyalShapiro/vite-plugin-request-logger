export function isFunction<
  P extends unknown[] = unknown[],
  R = unknown,
  F extends (...args: P) => R = (...args: P) => R,
>(value: unknown): value is F {
  return typeof value === 'function';
}
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}
export function isPromise(value: unknown): value is Promise<unknown> {
  return value instanceof Promise;
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && value.constructor === Object;
}
