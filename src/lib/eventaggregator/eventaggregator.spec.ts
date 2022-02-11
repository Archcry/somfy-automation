import { EventAggregator } from './eventAggregator';

describe('EventAggregator', () => {
  it('should inform subscribers when an event was published', () => {
    // Arrange
    const callback = jest.fn();

    const ea = EventAggregator(console);

    // Act
    ea.subscribe('testEvent', callback);
    ea.publish('testEvent', 'data');

    // Assert
    expect(callback.mock.calls.length).toBe(1);
  });

  it('should log an error when invoking a callback returns an error', () => {
    // Arrange
    const callback = jest.fn().mockImplementation(() => {
      throw new Error('error!');
    });

    const logger = {
      error: jest.fn(),
    };

    const ea = EventAggregator(logger);

    // Act
    ea.subscribe('testEvent', callback);
    ea.publish('testEvent', 'data');

    // Assert
    expect(logger.error).toHaveBeenCalled();
    expect(logger.error.mock.calls[0][0].message).toBe('error!');
  });

  it('should dispose of the subscription after the first invokation when using subscribeOnce', () => {
    // Arrange
    const callback = jest.fn();
    const ea = EventAggregator(console);

    // Act
    ea.subscribeOnce('test', callback);
    ea.publish('test', 'first event');
    ea.publish('test', 'second event');

    // Assert
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0]).toEqual(['test', 'first event']);
  });

  it('should return a subscription that can be dispose of at any time', () => {
    // Arrange
    const callback = jest.fn();
    const ea = EventAggregator(console);

    // Act
    const subscription = ea.subscribe('test', callback);

    ea.publish('test', 'first event');
    ea.publish('test', 'second event');

    subscription.dispose();

    ea.publish('test', 'third event');

    // Assert
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback.mock.calls[0]).toEqual(['test', 'first event']);
    expect(callback.mock.calls[1]).toEqual(['test', 'second event']);
  });

  it('should allow multiple subscriptions on one topic', () => {
    // Arrange
    const callbacks = [jest.fn(), jest.fn()];

    const ea = EventAggregator(console);

    // Act
    callbacks.forEach((callback) => ea.subscribe('test', callback));
    ea.publish('test', 'Hello World!');

    // Assert
    callbacks.forEach((cb) => expect(cb).toHaveBeenCalledTimes(1));
    callbacks.forEach((cb) => expect(cb.mock.calls[0]).toEqual(['test', 'Hello World!']));
  });

  it('should be able to publish events to a topic where nobody is subscribed on', () => {
    // Arrange
    const ea = EventAggregator(console);

    // Act
    ea.publish('test', 'Hello World!');
  });
});
