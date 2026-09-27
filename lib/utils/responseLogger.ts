import type { IncomingMessage, ServerResponse } from 'http';
import type { LoggerOptions } from '../types';
import type { ReturnLogger } from './resolveLogger';
import { formatMessage } from '../formatMessage';
import { safeExec } from './safe-exec';
import { safeJsonStringify } from './json.utils';
import { redact } from './redact';
import { writeLogToFile } from './file.utils';
import { extractRequestBody, formatRequestBody, type RequestWithBody } from './body.utils';

export interface InterceptResponseOptions {
  options: LoggerOptions;
  logger: ReturnLogger;
  req: IncomingMessage;
  res: ServerResponse;
  url: string;
  method: string;
  startTime: number;
  getRawBody: () => string;
}

/**
 * Monkey-patches `res.end` to capture response status, calculate duration,
 * assemble formatted log message (with headers and body), and dispatch to logger/transports.
 */
export function interceptResponseEnd({
  options,
  logger,
  req,
  res,
  url,
  method,
  startTime,
  getRawBody,
}: InterceptResponseOptions): void {
  const originalEnd = res.end;

  res.end = function interceptedEnd(...args: unknown[]) {
    safeExec(
      () => {
        const duration = (performance.now() - startTime).toFixed(2);
        const status = res.statusCode;

        let logMessage = formatMessage({
          format: options.format,
          method,
          url,
          status,
          responseTimeMs: duration,
          colors: options.colors,
          timezone: options.timezone,
        });

        // Append custom message suffix if customMsg callback is provided
        if (options.customMsg) {
          safeExec(
            () => {
              const custom = options.customMsg?.(req, res, parseFloat(duration));
              if (custom && typeof custom === 'string' && custom.trim()) {
                logMessage += ` ${custom.trim()}`;
              }
            },
            undefined,
            (customMsgErr: unknown) => {
              if (!options.silentOnError) {
                logger.error(
                  '[vite-plugin-request-logger] customMsg callback threw an error:',
                  customMsgErr,
                );
              }
            },
          );
        }

        // Append redacted headers if enabled
        if (options.logHeaders) {
          let headers = req.headers;
          if (options.redactKeys && options.redactKeys.length > 0) {
            headers = redact(headers, options.redactKeys);
          }
          logMessage += `\n  Headers: ${safeJsonStringify(headers, '{}')}`;
        }

        // Append redacted and formatted body if enabled
        if (options.logBody) {
          const candidate = extractRequestBody(req as RequestWithBody, getRawBody());
          const formattedBody = formatRequestBody(candidate, options);
          if (formattedBody) {
            logMessage += `\n  Body: ${formattedBody}`;
          }
        }

        // Print the final log message using resolved logger
        logger.info(logMessage);

        // Optionally persist to a log file (async, non-blocking)
        if (options.logToFile) {
          void writeLogToFile(options.logToFile, logMessage, logger.error);
        }
      },
      undefined,
      (loggingErr: unknown) => {
        if (!options.silentOnError) {
          logger.error('[vite-plugin-request-logger] Logging failed:', loggingErr);
        }
      },
    );

    // Invoke the original res.end to complete the HTTP response
    return originalEnd.apply(this, args as never);
  };
}
