import { appendFile } from 'node:fs/promises';
import type { LogFunction } from '../types';

/**
 * Regular expression matching ANSI escape codes (colors, formatting, cursor movements, etc.).
 */
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /[\u001b\u009b][\\[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=>]/g;

/**
 * Removes all ANSI escape sequences from a string, returning clean, plain readable text.
 * Ideal for stripping color and formatting codes before persisting logs to files or external databases.
 *
 * @param {string} str - The input string containing text with potential ANSI escape codes.
 * @returns {string} The cleansed string with all ANSI control sequences removed.
 *
 * @example
 * stripAnsi('\u001b[32mHello World\u001b[0m');
 * // => 'Hello World'
 *
 * @example
 * stripAnsi('\u001b[1;31mError:\u001b[0m \u001b[4mFile not found\u001b[0m');
 * // => 'Error: File not found'
 */
export function stripAnsi(str: string): string {
  if (!str || typeof str !== 'string') return '';

  return str.replace(ANSI_REGEX, '');
}

/**
 * Appends a single log line to a file asynchronously.
 * ANSI color codes are stripped before writing so the file contains plain text.
 *
 * @param {string} filePath - Absolute or relative path to the log file.
 * @param {string} message - The log message to append (may contain ANSI codes).
 * @param {LogFunction} [logError] - Optional error logger function.
 * @returns {Promise<void>}
 */
export async function writeLogToFile(
  filePath: string,
  message: string,
  logError: LogFunction = console.error.bind(console),
): Promise<void> {
  if (!message) return;
  const cleanLine = stripAnsi(message) + '\n';
  try {
    await appendFile(filePath, cleanLine, 'utf-8');
  } catch (error) {
    logError(`[vite-plugin-request-logger] Failed to write log file "${filePath}":`, error);
  }
}
