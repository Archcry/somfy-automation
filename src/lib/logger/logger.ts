// We disable the linting rule here because this is essentially the same interface as console
/* eslint-disable @typescript-eslint/no-explicit-any */

export enum LogLevel {
  Trace = 400,
  Debug = 300,
  Info = 200,
  Warn = 100,
  Error = 0,
  Disabled = -1,
}

export interface LoggerArgs {
  baseLogger: Pick<Console, 'debug' | 'trace' | 'error' | 'warn' | 'info'>;
  componentName: string;
  logLevel: LogLevel;
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
    if (logLevel > LogLevel.Disabled && logLevel >= LogLevel.Trace) {
      return baseLogger.trace(`[TRACE][${componentName.toUpperCase()}]: ${message}`, ...optionalParams);
    }
  },

  debug: (message?: any, ...optionalParams: any[]) => {
    if (logLevel > LogLevel.Disabled && logLevel >= LogLevel.Debug) {
      return baseLogger.debug(`[DEBUG][${componentName.toUpperCase()}]: ${message}`, ...optionalParams);
    }
  },

  info: (message?: any, ...optionalParams: any[]) => {
    if (logLevel > LogLevel.Disabled && logLevel >= LogLevel.Info) {
      return baseLogger.info(`[INFO][${componentName.toUpperCase()}]: ${message}`, ...optionalParams);
    }
  },

  warn: (message?: any, ...optionalParams: any[]) => {
    if (logLevel > LogLevel.Disabled && logLevel >= LogLevel.Warn) {
      return baseLogger.warn(`[WARN][${componentName.toUpperCase()}]: ${message}`, ...optionalParams);
    }
  },

  error: (message?: any, ...optionalParams: any[]) => {
    if (logLevel >= LogLevel.Error) {
      return baseLogger.error(`[ERROR][${componentName.toUpperCase()}]: ${message}`, ...optionalParams);
    }
  },
});
