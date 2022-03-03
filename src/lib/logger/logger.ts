// We disable the linting rule here because this is essentially the same interface as console
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LoggerArgs {
  baseLogger: Pick<Console, 'debug' | 'trace' | 'error' | 'warn' | 'info'>;
  componentName: string;
  logLevel: 'debug' | 'trace' | 'error' | 'warn' | 'info';
}

export interface ILogger {
  trace: (message?: any, ...optionalParams: any[]) => void;
  debug: (message?: any, ...optionalParams: any[]) => void;
  info: (message?: any, ...optionalParams: any[]) => void;
  warn: (message?: any, ...optionalParams: any[]) => void;
  error: (message?: any, ...optionalParams: any[]) => void;
}

export const Logger = ({ baseLogger, componentName, logLevel }: LoggerArgs): ILogger => ({
  trace: (message?: any, ...optionalParams: any[]) => {
    if (['trace'].includes(logLevel)) {
      return baseLogger.warn(`[TRACE][${componentName.toUpperCase()}]: ${message}`, ...optionalParams);
    }
  },

  debug: (message?: any, ...optionalParams: any[]) => {
    if (['trace', 'debug'].includes(logLevel)) {
      return baseLogger.warn(`[WARN][${componentName.toUpperCase()}]: ${message}`, ...optionalParams);
    }
  },

  info: (message?: any, ...optionalParams: any[]) => {
    if (['trace', 'debug', 'info'].includes(logLevel)) {
      return baseLogger.info(`[INFO][${componentName.toUpperCase()}]: ${message}`, ...optionalParams);
    }
  },

  warn: (message?: any, ...optionalParams: any[]) => {
    if (['trace', 'debug', 'info', 'warn'].includes(logLevel)) {
      return baseLogger.warn(`[WARN][${componentName.toUpperCase()}]: ${message}`, ...optionalParams);
    }
  },

  error: (message?: any, ...optionalParams: any[]) => {
    if (['trace', 'debug', 'info', 'warn', 'error'].includes(logLevel)) {
      return baseLogger.warn(`[WARN][${componentName.toUpperCase()}]: ${message}`, ...optionalParams);
    }
  },
});
