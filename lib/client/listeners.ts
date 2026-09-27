import type { ResolvedConfig, VPRLEvent } from './types';
import { sanitizeValue } from './sanitizer';
import { runWhenIdle } from './utils';

export interface ListenerHandlers {
  trackEvent: (event: VPRLEvent) => void;
  isPaused: () => boolean;
}

/**
 * Sets up global DOM listeners (click, change, error) and registers handlers
 * that sanitize payloads and dispatch VPRLEvents to the client queue.
 */
export function setupClientListeners(config: ResolvedConfig, handlers: ListenerHandlers): void {
  if (typeof window === 'undefined') return;

  if (config.enableClickTracking) {
    window.addEventListener(
      'click',
      (e) =>
        runWhenIdle(() => {
          if (handlers.isPaused()) return;
          const target = e.target as HTMLElement;
          if (!target) return;

          const interactiveEl =
            (target.closest('button, a, input, [role="button"]') as HTMLElement) || target;
          const testId = interactiveEl.getAttribute('data-testid');
          let targetIdentifier = interactiveEl.tagName.toLowerCase();
          if (interactiveEl.id) targetIdentifier += `#${interactiveEl.id}`;
          else if (testId) targetIdentifier += `[data-testid="${testId}"]`;

          handlers.trackEvent({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'click',
            target: targetIdentifier,
            payload: {
              text: sanitizeValue(
                interactiveEl,
                interactiveEl.innerText || (interactiveEl as HTMLInputElement).value || '',
                config.maskInputValues,
                config.maskSelectors,
                config.customSanitizer,
                config.sensitiveInputTypes,
              ),
              classes:
                typeof interactiveEl.className === 'string' ? interactiveEl.className : undefined,
            },
          });
        }),
      true,
    );
  }

  if (config.enableInputTracking) {
    window.addEventListener(
      'change',
      (e) =>
        runWhenIdle(() => {
          if (handlers.isPaused()) return;
          const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
          if (!target || !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

          const testId = target.getAttribute('data-testid');
          let targetIdentifier = target.tagName.toLowerCase();
          if (target.name) targetIdentifier += `[name="${target.name}"]`;
          else if (target.id) targetIdentifier += `#${target.id}`;
          else if (testId) targetIdentifier += `[data-testid="${testId}"]`;

          const safeValue = sanitizeValue(
            target,
            target.value,
            config.maskInputValues,
            config.maskSelectors,
            config.customSanitizer,
            config.sensitiveInputTypes,
          );

          handlers.trackEvent({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'input',
            target: targetIdentifier,
            payload: { inputType: target.type, value: safeValue },
          });
        }),
      true,
    );
  }

  if (config.enableErrorTracking) {
    window.addEventListener('error', (e) => {
      runWhenIdle(() => {
        handlers.trackEvent({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'error',
          payload: { message: e.message, filename: e.filename, lineno: e.lineno },
        });
      });
    });
  }
}
