import { EventAggregator, IEventAggregator } from '../../lib/eventaggregator/eventAggregator';
import { Somfy } from './somfy';
import { Somfy as SomfyEvents } from '../../events';

const toCallableMethods = (spy: jest.SpyInstance) => {
  return spy.mock.calls.reduce(
    (obj, call) => ({
      ...obj,
      [call[0]]: call[1],
    }),
    {}
  );
};

const eventNameToCommandName: { [key in SomfyEvents]: string } = {
  [SomfyEvents.Up]: 'up',
  [SomfyEvents.Down]: 'down',
  [SomfyEvents.Stop]: 'stop',
  [SomfyEvents.Identify]: 'identify',
  [SomfyEvents.Wink]: 'wink',
  [SomfyEvents.My]: 'my',
  [SomfyEvents.SetDeployment]: 'setDeployment',
};

describe('Somfy Module', () => {
  let eventAggregator: IEventAggregator;

  const logger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  const somfyService = {
    exec: jest.fn(),
  };

  beforeEach(() => {
    eventAggregator = EventAggregator(console);
    somfyService.exec.mockResolvedValue({ execId: 'some id' });
  });

  afterEach(() => jest.clearAllMocks());

  it('should subscribe to all events', () => {
    const subscribeSpy = jest.spyOn(eventAggregator, 'subscribe');

    Somfy({ eventAggregator, logger, somfyService }).start();

    const subscribedEvents = Object.keys(toCallableMethods(subscribeSpy));

    Object.values(SomfyEvents).forEach((eventName) => {
      expect(subscribedEvents).toContain(eventName);
    });
  });

  it('should send the command when the command is published through the eventAggregator', async () => {
    // Arrange
    const deviceUrl = 'io://io://AAAA-BBBB-CCCC/DDDDDDD';
    const spy = jest.spyOn(eventAggregator, 'subscribe');

    Somfy({ eventAggregator, logger, somfyService }).start();

    const subscriptions = toCallableMethods(spy);

    const toBeTestedEvents = Object.values(SomfyEvents).filter((eventName) => eventName !== SomfyEvents.SetDeployment);

    // Act
    await Promise.all(
      toBeTestedEvents.map((eventName) => subscriptions[eventName](eventName, { devices: [deviceUrl] }))
    );

    // Assert
    expect(somfyService.exec).toBeCalledTimes(toBeTestedEvents.length);
    expect(logger.info).toBeCalledTimes(toBeTestedEvents.length);

    toBeTestedEvents.forEach((somfyEvent) => {
      expect(logger.info).toBeCalledWith(`Succesfully send command "${eventNameToCommandName[somfyEvent]}"`);
      expect(somfyService.exec).toBeCalledWith([
        {
          deviceUrl: deviceUrl,
          command: eventNameToCommandName[somfyEvent],
          parameters: undefined,
        },
      ]);
    });
  });

  it('should log an error when execution of a command fails', async () => {
    // Arrange
    somfyService.exec.mockRejectedValue(new Error('error'));

    const deviceUrl = 'io://io://AAAA-BBBB-CCCC/DDDDDDD';
    const subscriptionSpy = jest.spyOn(eventAggregator, 'subscribe');

    Somfy({ eventAggregator, logger, somfyService }).start();

    const subscriptions = toCallableMethods(subscriptionSpy);

    const toBeTestedEvents = Object.values(SomfyEvents).filter((eventName) => eventName !== SomfyEvents.SetDeployment);

    // Act
    await Promise.all(
      toBeTestedEvents.map((eventName) => subscriptions[eventName](eventName, { devices: [deviceUrl] }))
    );

    // Assert
    expect(somfyService.exec).toBeCalledTimes(toBeTestedEvents.length);
    expect(logger.error).toBeCalledTimes(toBeTestedEvents.length);

    toBeTestedEvents.forEach((somfyEvent) => {
      expect(logger.error).toBeCalledWith(`Failed to send command "${eventNameToCommandName[somfyEvent]}"`);
      expect(somfyService.exec).toBeCalledWith([
        {
          deviceUrl: deviceUrl,
          command: eventNameToCommandName[somfyEvent],
          parameters: undefined,
        },
      ]);
    });
  });

  it('should call "setDeployment" when the "setDeployment" event is triggered', async () => {
    // Arrange
    const deviceUrl = 'io://io://AAAA-BBBB-CCCC/DDDDDDD';
    const subscriptionSpy = jest.spyOn(eventAggregator, 'subscribe');

    Somfy({ eventAggregator, logger, somfyService }).start();

    const subscriptions = toCallableMethods(subscriptionSpy);

    const percentage = 20;

    // Act
    await subscriptions[SomfyEvents.SetDeployment](SomfyEvents.SetDeployment, {
      devices: [
        {
          deviceUrl,
          percentage,
        },
      ],
    });

    // Assert
    expect(logger.info).toBeCalledTimes(1);
    expect(logger.info).toBeCalledWith(`Succesfully send command "setDeployment"`);
    expect(somfyService.exec).toBeCalledTimes(1);
    expect(somfyService.exec).toBeCalledWith([
      {
        deviceUrl,
        command: eventNameToCommandName[SomfyEvents.SetDeployment],
        parameters: [percentage],
      },
    ]);
  });
});
