// We disable the linting rule here because this is essentially the same interface as console
/* eslint-disable @typescript-eslint/no-explicit-any */

import { DateTime } from 'luxon';

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

const getCurrentTime = () => DateTime.now().toUTC().toFormat('yyyy-MM-dd HH:mm:ss,SSS');

export const Logger = ({ baseLogger, componentName, logLevel }: LoggerArgs): ILogger => ({
  trace: (message?: any, ...optionalParams: any[]) => {
    if (logLevel > LogLevel.Disabled && logLevel >= LogLevel.Trace) {
      return baseLogger.trace(
        `[TRACE][${getCurrentTime()}][${componentName.toUpperCase()}]: ${message}`,
        ...optionalParams
      );
    }
  },

  debug: (message?: any, ...optionalParams: any[]) => {
    if (logLevel > LogLevel.Disabled && logLevel >= LogLevel.Debug) {
      return baseLogger.debug(
        `[DEBUG][${getCurrentTime()}][${componentName.toUpperCase()}]: ${message}`,
        ...optionalParams
      );
    }
  },

  info: (message?: any, ...optionalParams: any[]) => {
    if (logLevel > LogLevel.Disabled && logLevel >= LogLevel.Info) {
      return baseLogger.info(
        `[INFO][${getCurrentTime()}][${componentName.toUpperCase()}]: ${message}`,
        ...optionalParams
      );
    }
  },

  warn: (message?: any, ...optionalParams: any[]) => {
    if (logLevel > LogLevel.Disabled && logLevel >= LogLevel.Warn) {
      return baseLogger.warn(
        `[WARN][${getCurrentTime()}][${componentName.toUpperCase()}]: ${message}`,
        ...optionalParams
      );
    }
  },

  error: (message?: any, ...optionalParams: any[]) => {
    if (logLevel >= LogLevel.Error) {
      return baseLogger.error(
        `[ERROR][${getCurrentTime()}][${componentName.toUpperCase()}]: ${message}`,
        ...optionalParams
      );
    }
  },
});
