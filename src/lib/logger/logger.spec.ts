import { Logger, LogLevel } from './logger';

describe('Logger', () => {
  const baseLogger = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const componentName = 'LoggerTest';
  const logLevel = LogLevel.Trace;

  afterEach(() => jest.resetAllMocks());

  it('should prefix the logged message with the componentName and logLevel', () => {
    // Arrange
    const logger = Logger({
      baseLogger,
      componentName,
      logLevel,
    });

    // Act
    logger.trace('test');
    logger.debug('test');
    logger.info('test');
    logger.warn('test');
    logger.error('test');

    // Assert
    expect(baseLogger.trace).toBeCalledWith('[TRACE][LOGGERTEST]: test');
    expect(baseLogger.debug).toBeCalledWith('[DEBUG][LOGGERTEST]: test');
    expect(baseLogger.info).toBeCalledWith('[INFO][LOGGERTEST]: test');
    expect(baseLogger.warn).toBeCalledWith('[WARN][LOGGERTEST]: test');
    expect(baseLogger.error).toBeCalledWith('[ERROR][LOGGERTEST]: test');
  });

  it('should not log trace messages on loglevel debug', () => {
    // Arrange
    const logLevel = LogLevel.Debug;

    const logger = Logger({
      baseLogger,
      componentName,
      logLevel,
    });

    // Act
    logger.trace('test');
    logger.debug('test');
    logger.info('test');
    logger.warn('test');
    logger.error('test');

    // Assert
    expect(baseLogger.trace).not.toBeCalled();
    expect(baseLogger.debug).toBeCalledWith('[DEBUG][LOGGERTEST]: test');
    expect(baseLogger.info).toBeCalledWith('[INFO][LOGGERTEST]: test');
    expect(baseLogger.warn).toBeCalledWith('[WARN][LOGGERTEST]: test');
    expect(baseLogger.error).toBeCalledWith('[ERROR][LOGGERTEST]: test');
  });

  it('should not log trace & debug messages on loglevel info', () => {
    // Arrange
    const logLevel = LogLevel.Info;

    const logger = Logger({
      baseLogger,
      componentName,
      logLevel,
    });

    // Act
    logger.trace('test');
    logger.debug('test');
    logger.info('test');
    logger.warn('test');
    logger.error('test');

    // Assert
    expect(baseLogger.trace).not.toBeCalled();
    expect(baseLogger.debug).not.toBeCalled();
    expect(baseLogger.info).toBeCalledWith('[INFO][LOGGERTEST]: test');
    expect(baseLogger.warn).toBeCalledWith('[WARN][LOGGERTEST]: test');
    expect(baseLogger.error).toBeCalledWith('[ERROR][LOGGERTEST]: test');
  });

  it('should not log info, trace & debug messages on loglevel warn', () => {
    // Arrange
    const logLevel = LogLevel.Warn;

    const logger = Logger({
      baseLogger,
      componentName,
      logLevel,
    });

    // Act
    logger.trace('test');
    logger.debug('test');
    logger.info('test');
    logger.warn('test');
    logger.error('test');

    // Assert
    expect(baseLogger.trace).not.toBeCalled();
    expect(baseLogger.debug).not.toBeCalled();
    expect(baseLogger.info).not.toBeCalled();
    expect(baseLogger.warn).toBeCalledWith('[WARN][LOGGERTEST]: test');
    expect(baseLogger.error).toBeCalledWith('[ERROR][LOGGERTEST]: test');
  });

  it('should not log warn, info, trace & debug messages on loglevel error', () => {
    // Arrange
    const logLevel = LogLevel.Error;

    const logger = Logger({
      baseLogger,
      componentName,
      logLevel,
    });

    // Act
    logger.trace('test');
    logger.debug('test');
    logger.info('test');
    logger.warn('test');
    logger.error('test');

    // Assert
    expect(baseLogger.trace).not.toBeCalled();
    expect(baseLogger.debug).not.toBeCalled();
    expect(baseLogger.info).not.toBeCalled();
    expect(baseLogger.warn).not.toBeCalled();
    expect(baseLogger.error).toBeCalledWith('[ERROR][LOGGERTEST]: test');
  });

  it('should append all additional parameters to the baselogger on log', () => {
    // Arrange
    const logger = Logger({
      baseLogger,
      componentName,
      logLevel,
    });

    // Act
    logger.info('test', 1, ['test2'], { hello: 'world' });

    // Assert
    expect(baseLogger.info).toBeCalledTimes(1);
    expect(baseLogger.info).toBeCalledWith('[INFO][LOGGERTEST]: test', 1, ['test2'], { hello: 'world' });
  });
});
