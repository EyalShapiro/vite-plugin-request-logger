import type { IncomingMessage, ServerResponse } from 'http';

import type { LoggerOptions } from '../types';
import { safeJsonParse } from './json.utils';
import { safeExec } from './safe-exec';
import { formatMessage } from '../formatMessage';

/** Endpoint path used by browser client script to send client-side request telemetry. */
export const CLIENT_LOG_ENDPOINT = '/__vprl_log';

/**
 * Interface representing client log payload data sent from browser.
 */
export interface ClientLogPayload {
  method?: string;
  url?: string;
  status?: number;
  duration?: string | number;
}

/**
 * Handles incoming client log beacon requests POSTed to `/__vprl_log`.
 * Formats the log message and writes it to the server logger.
 *
 * @param req Incoming HTTP request.
 * @param res Server HTTP response.
 * @param options LoggerOptions configuration.
 * @param logger Logger instance.
 */
export function handleClientLogEndpoint(
  req: IncomingMessage,
  res: ServerResponse,
  options: LoggerOptions,
  logger: { info: (msg: string) => void },
): void {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    safeExec(() => {
      const data = safeJsonParse<ClientLogPayload>(body, {});
      if (data && data.url) {
        const method = data.method || 'GET';
        const url = data.url;
        const status = data.status ?? 200;
        const duration = String(data.duration ?? '0');

        const formatted = formatMessage({
          format: options.format,
          method: `[CLIENT] ${method}`,
          url,
          status,
          responseTimeMs: duration,
          colors: options.colors,
          timezone: options.timezone,
        });

        logger.info(formatted);
      }
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('ok');
  });
}
