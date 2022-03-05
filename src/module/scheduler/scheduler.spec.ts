import { DateTime } from 'luxon';
import suncalc from 'suncalc';
import { Somfy as SomfyEvents } from '../../events';
import { FixedTimeSchedule, SunCalcSchedule } from '../../types';
import { Scheduler } from './scheduler';

jest.mock('suncalc', () => {
  const originalSunCalc = jest.requireActual('suncalc');

  return {
    ...originalSunCalc,
    getTimes: jest.fn(),
  };
});

describe('Scheduler Module', () => {
  const timeZone = 'Europe/Amsterdam';
  const dateTimeObj = {
    year: 2022,
    month: 3,
    day: 7,
    hour: 10,
    minute: 59,
    second: 59,
  };

  const logger = {
    info: jest.fn(),
    debug: jest.fn(),
  };

  const eventAggregator = {
    publish: jest.fn(),
  };

  const deviceGroups = [
    {
      uid: '831f2cb7-3208-4c6d-8915-f27360de39e3',
      devices: ['068dfc0e-9c63-11ec-b909-0242ac120002'],
      name: 'testLocation',
    },
    {
      uid: '5cd6c40a-9c64-11ec-b909-0242ac120002',
      devices: ['2f9cb9e0-9c64-11ec-b909-0242ac120002'],
      name: 'testLocation2',
    },
  ];

  const devices = [
    {
      uid: '068dfc0e-9c63-11ec-b909-0242ac120002',
      name: 'testDevice',
      deviceUrl: 'io://1234-5678-9101/1234567',
    },
    {
      uid: '2f9cb9e0-9c64-11ec-b909-0242ac120002',
      name: 'testDevice2',
      deviceUrl: 'io://4321-8765-1019/7654321',
    },
  ];

  beforeEach(() => {
    jest.useFakeTimers();

    jest.setSystemTime(DateTime.fromObject(dateTimeObj, { zone: timeZone }).toJSDate());
  });

  afterEach(() => jest.useRealTimers());

  afterEach(() => jest.clearAllMocks());

  it("should fire an event when it's a configured time", () => {
    // Arrange
    const schedule: FixedTimeSchedule = {
      type: 'fixed_time',
      dow: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      deviceGroups: ['831f2cb7-3208-4c6d-8915-f27360de39e3', '5cd6c40a-9c64-11ec-b909-0242ac120002'],
      timezone: timeZone,
      time: '11:00',
      command: {
        name: 'up',
        parameters: [],
      },
    };

    // Act
    Scheduler({
      logger,
      eventAggregator,
      schedules: [schedule],
      deviceGroups: deviceGroups,
      devices: devices,
    }).start();

    // Assert
    expect(eventAggregator.publish).not.toBeCalled();

    jest.advanceTimersByTime(30000);

    expect(eventAggregator.publish).toBeCalledTimes(1);
    expect(eventAggregator.publish).toBeCalledWith(
      SomfyEvents.Up,
      expect.objectContaining({
        devices: expect.arrayContaining(['io://1234-5678-9101/1234567', 'io://4321-8765-1019/7654321']),
      })
    );

    expect(logger.info).toBeCalledTimes(1);
    expect(logger.info).toBeCalledWith(
      'Firing command "up" for device groups [831f2cb7-3208-4c6d-8915-f27360de39e3, 5cd6c40a-9c64-11ec-b909-0242ac120002]'
    );
  });

  it('should fire an event at sunrise', () => {
    // Arrange
    const schedule: SunCalcSchedule = {
      type: 'suncalc',
      dow: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      deviceGroups: ['831f2cb7-3208-4c6d-8915-f27360de39e3', '5cd6c40a-9c64-11ec-b909-0242ac120002'],
      kind: 'sunrise',
      coordinates: {
        longitude: 5.111568,
        latitude: 50.87946,
      },
      command: {
        name: 'up',
        parameters: [],
      },
    };

    const sunriseTime = DateTime.fromObject(dateTimeObj)
      .set({ day: 8, hour: 7, minute: 2 })
      .setZone(timeZone)
      .toJSDate();

    (suncalc.getTimes as jest.Mock).mockImplementation(() => ({
      sunrise: sunriseTime,
    }));

    // Act
    Scheduler({
      logger,
      eventAggregator,
      schedules: [schedule],
      deviceGroups: deviceGroups,
      devices: devices,
    }).start();

    // Assert
    expect(eventAggregator.publish).not.toBeCalled();

    jest.setSystemTime(sunriseTime);
    jest.advanceTimersByTime(1500);

    expect(eventAggregator.publish).toBeCalledTimes(1);
    expect(eventAggregator.publish).toBeCalledWith(
      SomfyEvents.Up,
      expect.objectContaining({
        devices: expect.arrayContaining(['io://1234-5678-9101/1234567', 'io://4321-8765-1019/7654321']),
      })
    );

    expect(logger.info).toBeCalledTimes(1);
    expect(logger.info).toBeCalledWith(
      'Firing command "up" for device groups [831f2cb7-3208-4c6d-8915-f27360de39e3, 5cd6c40a-9c64-11ec-b909-0242ac120002]'
    );
  });

  it('should not fire an event on a day that is not on the schedule', () => {
    // Arrange
    const schedule: FixedTimeSchedule = {
      type: 'fixed_time',
      dow: ['sun', 'tue', 'wed', 'thu', 'fri', 'sat'],
      deviceGroups: ['831f2cb7-3208-4c6d-8915-f27360de39e3'],
      timezone: timeZone,
      time: '11:00',
      command: {
        name: 'up',
        parameters: [],
      },
    };

    // Act
    Scheduler({
      logger,
      eventAggregator,
      schedules: [schedule],
      deviceGroups: deviceGroups,
      devices: devices,
    }).start();

    jest.advanceTimersByTime(30000);

    // Assert
    expect(eventAggregator.publish).not.toBeCalled();
  });
});
