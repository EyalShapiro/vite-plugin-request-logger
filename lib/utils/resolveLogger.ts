import { noop } from './heleprs';

import type { LoggerOption, LogFunction } from '../types';
export type ReturnLogger = { info: LogFunction; error: LogFunction };

/**
 * Resolves a LoggerOption into bound info and error functions.
 * Handles 'silent', 'console', and custom objects (with Pino/Winston .bind context preservation).
 */
export function resolveLogger(option?: LoggerOption): ReturnLogger {
  if (option === 'silent') return { info: noop, error: noop };

  if (typeof option === 'object' && option !== null) {
    const infoFn = option.info ?? option.log ?? console.info;
    const errorFn = option.error ?? option.log ?? console.error;

    return { info: infoFn.bind(option), error: errorFn.bind(option) };
  }

  return { info: console.info.bind(console), error: console.error.bind(console) };
}
