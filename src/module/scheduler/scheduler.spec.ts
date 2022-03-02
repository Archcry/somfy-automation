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

  const deviceGroup = {
    uid: '831f2cb7-3208-4c6d-8915-f27360de39e3',
    devices: [Buffer.from('testDeviceUrl', 'utf-8').toString('base64')],
    name: 'testLocation',
  };

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
      deviceGroups: [deviceGroup],
    }).start();

    // Assert
    expect(eventAggregator.publish).not.toBeCalled();

    jest.advanceTimersByTime(30000);

    expect(eventAggregator.publish).toBeCalledTimes(1);
    expect(eventAggregator.publish).toBeCalledWith(SomfyEvents.Up, { devices: ['testDeviceUrl'] });

    expect(logger.info).toBeCalledTimes(1);
    expect(logger.info).toBeCalledWith('Firing command "up" for device groups 831f2cb7-3208-4c6d-8915-f27360de39e3');
  });

  it('should fire an event at sunrise', () => {
    // Arrange
    const schedule: SunCalcSchedule = {
      type: 'suncalc',
      dow: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
      deviceGroups: ['831f2cb7-3208-4c6d-8915-f27360de39e3'],
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
      deviceGroups: [deviceGroup],
    }).start();

    // Assert
    expect(eventAggregator.publish).not.toBeCalled();

    jest.setSystemTime(sunriseTime);
    jest.advanceTimersByTime(1500);

    expect(eventAggregator.publish).toBeCalledTimes(1);
    expect(eventAggregator.publish).toBeCalledWith(SomfyEvents.Up, { devices: ['testDeviceUrl'] });

    expect(logger.info).toBeCalledTimes(1);
    expect(logger.info).toBeCalledWith('Firing command "up" for device groups 831f2cb7-3208-4c6d-8915-f27360de39e3');
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
      deviceGroups: [deviceGroup],
    }).start();

    jest.advanceTimersByTime(30000);

    // Assert
    expect(eventAggregator.publish).not.toBeCalled();
  });
});
