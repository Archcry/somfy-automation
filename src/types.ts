export interface DeviceGroup {
  uid: string;
  name: string;
  devices: string[];
}

export interface Command {
  name: string;
  parameters: string[];
}

export interface BaseSchedule {
  dow: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
  deviceGroups: string[];
  command: Command;
}

export interface FixedTimeSchedule {
  type: 'fixed_time';
  time: string;
  timezone: string;
}

export interface SunCalcSchedule extends BaseSchedule {
  type: 'suncalc';
  kind: 'sunrise' | 'sunset';
}

export type Schedule = FixedTimeSchedule | SunCalcSchedule;
