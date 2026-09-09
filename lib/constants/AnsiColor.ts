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

export type AnsiColorKeyType = keyof typeof ANSI_COLORS;

/**
 * A union type representing any valid ANSI escape-code string
 * produced by {@link ANSI_COLORS}.
 */
export type AnsiColor = (typeof ANSI_COLORS)[AnsiColorKeyType];
