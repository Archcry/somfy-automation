import { debounce } from 'debounce';
import { DateTime } from 'luxon';
import SunCalc from 'suncalc';
import { Somfy as SomfyEvents } from '../../events';
import { IEventAggregator } from '../../lib/eventaggregator/eventAggregator';
import { ILogger } from '../../lib/logger/logger';
import { DeviceGroup, FixedTimeSchedule, Schedule, SunCalcSchedule } from '../../types';

export const mapToEvent = (command: string) =>
  ({
    up: SomfyEvents.Up,
    down: SomfyEvents.Down,
    setDeploymenty: SomfyEvents.SetDeployment,
    wink: SomfyEvents.Wink,
    identify: SomfyEvents.Identify,
    stop: SomfyEvents.Stop,
    my: SomfyEvents.My,
  }[command]);

export interface SchedulerArgs {
  logger: Pick<ILogger, 'info' | 'debug'>;
  eventAggregator: Pick<IEventAggregator, 'publish'>;
  schedules: Schedule[];
  deviceGroups: DeviceGroup[];
}

type Executable<T> = T & { execute: () => void };

const checkIntervalMs = 500;
const debounceMs = 60000;
const debounceImmidiate = true;

export const Scheduler = ({ logger, eventAggregator, schedules, deviceGroups }: SchedulerArgs) => {
  const isFixedTimeSchedule = (schedule: Executable<Schedule>): schedule is Executable<FixedTimeSchedule> =>
    schedule.type === 'fixed_time';

  const isSuncalcSchedule = (schedule: Executable<Schedule>): schedule is Executable<SunCalcSchedule> =>
    schedule.type === 'suncalc';

  const isCorrectDow = (now: DateTime) => (schedule: Schedule) => {
    return schedule.dow.includes(now.weekdayShort.toLowerCase());
  };

  const isCorrectTime = (now: DateTime) => (schedule: FixedTimeSchedule) => {
    const [hour, minute] = schedule.time.split(':').map((item) => parseInt(item));

    const nowInZone = now.setZone(schedule.timezone);

    return nowInZone.minute === minute && hour === nowInZone.hour;
  };

  const isSunCalcTime = (now: DateTime) => (schedule: SunCalcSchedule) => {
    const { latitude, longitude } = schedule.coordinates;

    const times = SunCalc.getTimes(now.toJSDate(), latitude, longitude);

    const suncalcTime = DateTime.fromJSDate(times[schedule.kind]);

    return now.minute === suncalcTime.minute && now.hour === suncalcTime.hour;
  };

  const fire = (schedule: Schedule) => {
    logger.info(`Firing command "${schedule.command.name}" for device groups ${schedule.deviceGroups}`);

    const devices = deviceGroups
      .filter(({ uid }) => schedule.deviceGroups.includes(uid))
      .flatMap(({ devices }) => devices)
      .map((base64) => Buffer.from(base64, 'base64'))
      .map((buff) => buff.toString('utf-8'));

    const event = mapToEvent(schedule.command.name);

    if (event) {
      eventAggregator.publish(event, { devices });
    }
  };

  return {
    start: () => {
      const scheduledTasks: Executable<Schedule>[] = schedules.map((schedule) => ({
        ...schedule,
        execute: debounce(() => fire(schedule), debounceMs, debounceImmidiate),
      }));

      setInterval(() => {
        const now = DateTime.now();

        scheduledTasks
          .filter(isFixedTimeSchedule)
          .filter(isCorrectDow(now))
          .filter(isCorrectTime(now))
          .forEach((schedule) => schedule.execute());

        scheduledTasks
          .filter(isSuncalcSchedule)
          .filter(isCorrectDow(now))
          .filter(isSunCalcTime(now))
          .forEach((schedule) => schedule.execute());
      }, checkIntervalMs);
    },
  };
};
