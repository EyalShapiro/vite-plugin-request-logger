/**
 * A map of named ANSI escape codes used to colorize terminal output.
 *
 * Each value is a raw escape sequence string (e.g. `\x1b[32m` for green).
 * Use `ANSI_COLORS.reset` at the end of a colored segment to restore the
 * default terminal color.
 *
 * @example
 * console.log(`${ANSI_COLORS.green}OK${ANSI_COLORS.reset}`);
 */
export const ANSI_COLORS = {
  /** Resets all styles and colors to the terminal default. */
  reset: '\x1b[0m',
  /** Dim / faint text. */
  dim: '\x1b[2m',
  /** Bold text. */
  bold: '\x1b[1m',
  /** Bright green foreground. */
  green: '\x1b[32m',
  /** Bright yellow foreground. */
  yellow: '\x1b[33m',
  /** Bright red foreground. */
  red: '\x1b[31m',
  /** Cyan foreground. */
  cyan: '\x1b[36m',
  /** Magenta foreground. */
  magenta: '\x1b[35m',
} as const;

/**
 * A union type representing any valid ANSI escape-code string
 * produced by {@link ANSI_COLORS}.
 */
export type AnsiColor = (typeof ANSI_COLORS)[keyof typeof ANSI_COLORS];

/**
 * Maps HTTP method names to their corresponding ANSI terminal color.
 *
 * Used to colorize the method token in `dev` format log lines.
 *
 * | Method | Color  |
 * |--------|--------|
 * | GET    | green  |
 * | POST   | cyan   |
 * | PUT    | yellow |
 * | PATCH  | yellow |
 * | DELETE | red    |
 */
export const METHOD_COLORS = {
  /** GET requests are displayed in green. */
  GET: ANSI_COLORS.green,
  /** POST requests are displayed in cyan. */
  POST: ANSI_COLORS.cyan,
  /** PUT requests are displayed in yellow. */
  PUT: ANSI_COLORS.yellow,
  /** PATCH requests are displayed in yellow. */
  PATCH: ANSI_COLORS.yellow,
  /** DELETE requests are displayed in red. */
  DELETE: ANSI_COLORS.red,
} as const satisfies Record<string, AnsiColor>;

/**
 * Removes all ANSI escape codes from a string, producing plain readable text.
 *
 * This is applied before writing log lines to a file so that log files
 * contain clean text without terminal color sequences.
 *
 * @param str - Input string that may contain ANSI escape codes.
 * @returns The same string with all ANSI sequences stripped.
 *
 * @example
 * stripAnsi('\x1b[32mHello\x1b[0m'); // => 'Hello'
 */
export function stripAnsi(str: string): string {
  const esc = String.fromCharCode(0x1b);
  const regex = new RegExp(`${esc}\\[[0-9;]*m`, 'g');
  return str.replace(regex, '');
}
