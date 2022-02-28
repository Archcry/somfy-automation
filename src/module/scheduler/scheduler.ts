import { debounce } from 'debounce';
import { DateTime } from 'luxon';
import SunCalc from 'suncalc';
import { IEventAggregator } from '../../lib/eventaggregator/eventAggregator';
import { DeviceGroup, FixedTimeSchedule, Schedule, SunCalcSchedule } from '../../types';

export interface SchedulerArgs {
  logger: Pick<Console, 'info' | 'debug'>;
  eventAggregator: IEventAggregator;
  schedules: Schedule[];
  deviceGroups: DeviceGroup[];
}

interface Executable {
  execute: () => void;
}

type ExecutableFixedTimeSchedule = FixedTimeSchedule & Executable;
type ExecutableSunCalcSchedule = SunCalcSchedule & Executable;
type ExecutableSchedule = Schedule & Executable;

const checkIntervalMs = 500;
const debounceMs = 60000;
const debounceImmidiate = true;

export const Scheduler = ({ logger, eventAggregator, schedules, deviceGroups }: SchedulerArgs) => {
  const isFixedTimeSchedule = (schedule: ExecutableSchedule): schedule is ExecutableFixedTimeSchedule =>
    schedule.type === 'fixed_time';

  const isSuncalcSchedule = (schedule: ExecutableSchedule): schedule is ExecutableSunCalcSchedule =>
    schedule.type === 'suncalc';

  const isCorrectDow = (now: DateTime) => (schedule: Schedule) => {
    return schedule.dow.includes(now.weekdayShort.toLocaleLowerCase());
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

    eventAggregator.publish(`somfy:${schedule.command.name}`, { devices });
  };

  return {
    start: () => {
      const scheduledTasks: ExecutableSchedule[] = schedules.map((schedule) => ({
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
