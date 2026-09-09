import { viteRequestLogger } from './plugin';

// Main Vite plugin and client interceptor exports
export { viteRequestLogger, PLUGIN_NAME } from './plugin';
export { CLIENT_INTERCEPTOR_SCRIPT } from './client-interceptor';
export type { VitePluginObject, InjectedHtmlTag, MiddlewareServer } from './plugin';

// Standalone Connect / Express middleware export
export { createRequestLoggerMiddleware, getShouldLog, shouldSkip } from './middleware';
export type { ConnectMiddleware } from './middleware';

// Body extraction and formatting utilities
export { extractRequestBody, formatRequestBody } from './utils/body.utils';
export type { RequestWithBody } from './utils/body.utils';

// Format message utility and options
export { formatMessage } from './formatMessage';
export type { FormatMessageOptions } from './formatMessage';

// Redaction utilities
export { redact, redactWithRegex } from './utils/redact';

// Constants & HTTP types
export { DEFAULT_OPTIONS } from './constants/default-options';
export { METHODS_WITH_BODY } from './http-method';
export type { HttpMethodType, HttpMethodWithBody, StatusType } from './http-method';

// General Types
export type {
  LoggerOptions,
  LoggerFormat,
  LoggerOption,
  LogFunction,
  CustomLogger,
} from './types';

// Default export
export default viteRequestLogger;
 