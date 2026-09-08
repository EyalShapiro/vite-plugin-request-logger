import { viteRequestLogger } from './plugin';

// Main Vite plugin export
export { viteRequestLogger, PLUGIN_NAME } from './plugin';
export type { VitePluginObject } from './plugin';

// Standalone Connect / Express middleware export
export { createRequestLoggerMiddleware, getShouldLog, shouldSkip } from './middleware';
export type { ConnectMiddleware } from './middleware';

// Format message utility and options
export { formatMessage } from './formatMessage';
export type { FormatMessageOptions } from './formatMessage';

// Constants
export { DEFAULT_OPTIONS } from './constants/default-options';
export { METHODS_WITH_BODY } from './http-method';
export type { HttpMethodType, HttpMethodWithBody, StatusType } from './http-method';

// Types
export type {
  LoggerOptions,
  LoggerFormat,
  LoggerOption,
  LogFunction,
  CustomLogger,
} from './types';

// Default export
export default viteRequestLogger;
