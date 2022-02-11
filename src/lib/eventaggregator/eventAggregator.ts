export type EventHandler<T> = (eventName: string, data: T) => void;

interface EventLookup {
  [key: string]: EventHandler<any>[];
}

export interface ISubscription {
  dispose: () => void;
}

export interface IEventAggregator {
  subscribe: <T>(event: string, eventHandler: EventHandler<T>) => ISubscription;
  subscribeOnce: <T>(event: string, eventHandler: EventHandler<T>) => void;
  publish: <T>(event: string, data: T) => void;
}

export const EventAggregator = (logger: Pick<Console, 'error'>): IEventAggregator => {
  const eventLookup: EventLookup = {};

  const withErrorHandling = (handler: () => void) => {
    try {
      handler();
    } catch (err) {
      logger.error(err);
    }
  };

  const subscribe = <T>(event: string, eventHandler: EventHandler<T>) => {
    eventLookup[event] = [eventHandler, ...(eventLookup[event] ?? [])];

    return {
      dispose: () => {
        eventLookup[event] = eventLookup[event].filter((handler) => handler !== eventHandler);
      },
    };
  };

  const subscribeOnce = <T>(event: string, eventHandler: EventHandler<T>) => {
    const subscription = subscribe<T>(event, (eventName, data) => {
      subscription.dispose();

      return eventHandler(eventName, data);
    });

    return subscription;
  };

  const publish = <T>(event: string, data: T) => {
    const handlers = eventLookup[event] ?? [];

    handlers.forEach((handler) => withErrorHandling(() => handler(event, data)));
  };

  return {
    subscribe,
    subscribeOnce,
    publish,
  };
};
