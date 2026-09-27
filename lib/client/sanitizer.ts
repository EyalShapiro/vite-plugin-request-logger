import { DEFAULT_SENSITIVE_INPUT_TYPES } from './constants';

/**
 * Redacts sensitive content from DOM element values based on input type,
 * CSS selector matching, and optional custom sanitizer logic.
 *
 * @param element - The HTML element whose value is being captured.
 * @param value - The raw text/value to potentially redact.
 * @param maskInputValues - Whether input masking is globally enabled for all inputs.
 * @param maskSelectors - CSS selectors that mark elements for redaction.
 * @param customSanitizer - Optional override function for the default redaction logic.
 * @param sensitiveInputTypes - Input types whose values are always redacted.
 * @returns The sanitized (possibly redacted) value string.
 *
 * @example Default sensitive types
 * ```ts
 * const safe = sanitizeValue(inputEl, inputEl.value, false, ['.pii']);
 * // Returns '[REDACTED]' for password/email/tel/card fields or elements matching '.pii'
 * ```
 *
 * @example Custom sensitive types
 * ```ts
 * const safe = sanitizeValue(inputEl, inputEl.value, false, [], undefined, ['password', 'ssn', 'pin']);
 * ```
 */
export function sanitizeValue(
  element: HTMLElement,
  value: string,
  maskInputValues: boolean = true,
  maskSelectors: string[] = [],
  customSanitizer?: (element: HTMLElement, value: string) => string,
  sensitiveInputTypes: readonly string[] | string[] = DEFAULT_SENSITIVE_INPUT_TYPES,
): string {
  // If a custom sanitizer is provided, delegate entirely to it
  if (customSanitizer) {
    return customSanitizer(element, value);
  }

  // Auto-redact sensitive input types safely across Browser & Node/SSR
  const isInput =
    (typeof HTMLInputElement !== 'undefined' && element instanceof HTMLInputElement) ||
    element?.tagName === 'INPUT';

  if (isInput) {
    const input = element as HTMLInputElement;
    const inputType = (input.type || input.getAttribute?.('type') || '').toLowerCase();
    if (maskInputValues || sensitiveInputTypes.includes(inputType)) {
      return '[REDACTED]';
    }
  }

  // Redact content matching any configured CSS selector
  if (maskSelectors.some((selector) => element.matches?.(selector))) {
    return '[REDACTED]';
  }

  return value;
}
