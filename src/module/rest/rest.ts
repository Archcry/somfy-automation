import bodyParser from 'body-parser';
import { Express } from 'express';
import basicAuth from 'express-basic-auth';
import { commandToSomfyEvent, Somfy as SomfyEvents, SomfyEventData } from '../../events';
import { IEventAggregator } from '../../lib/eventaggregator/eventAggregator';
import { Device, DeviceGroup, Schedule } from '../../types';

export interface RestModuleOptions {
  app: Pick<Express, 'get' | 'post' | 'use'>;
  eventAggregator: Pick<IEventAggregator, 'publish'>;
  users: { [username: string]: string };
  deviceGroups: DeviceGroup[];
  devices: Device[];
  schedules: Schedule[];
}

export interface DevicesReq {
  devices: string[];
}

export const Rest = ({ app, users, eventAggregator, deviceGroups, devices, schedules }: RestModuleOptions) => {
  const filterUndefined = <T>(entry: T | undefined): entry is T => !!entry;

  const toDeviceUrls = (deviceUids: string[]) => {
    const deviceUrls = deviceUids
      .map((uid) => devices.find((dev) => dev.uid === uid))
      .filter(filterUndefined)
      .map(({ deviceUrl }) => deviceUrl);

    return Array.from(new Set(deviceUrls));
  };

  const mapDevices = (deviceUids: string[]) =>
    deviceUids.map((deviceUid) => devices.find(({ uid }) => uid === deviceUid)).filter(filterUndefined);

  return {
    start: () => {
      app.use(
        basicAuth({
          users: users,
          challenge: true,
        })
      );

      app.use(bodyParser.json());

      app.get('/', (_, res) => {
        res.send('Hello World!');
      });

      type DeviceGroupResp = Array<Omit<DeviceGroup, 'devices'> & { devices: Array<Omit<Device, 'deviceUrl'>> }>;
      app.get<unknown, DeviceGroupResp>('/shutter/deviceGroups', (_, res) => {
        res.send(
          deviceGroups.map(({ devices, ...rest }) => ({
            ...rest,
            devices: mapDevices(devices).map(({ uid, name }) => ({ uid, name })),
          }))
        );
      });

      type ScheduleResp = Array<Omit<Schedule, 'deviceGroups'> & { deviceGroups: DeviceGroupResp }>;
      app.get<unknown, ScheduleResp>('/shutter/schedules', (_, res) => {
        const mapDeviceGroups = (deviceGroupUids: string[]) =>
          deviceGroupUids
            .map((deviceGroupUid) => deviceGroups.find(({ uid }) => uid === deviceGroupUid))
            .filter(filterUndefined)
            .map(({ devices: devUids, ...rest }) => ({
              ...rest,
              devices: mapDevices(devUids).map(({ uid, name }) => ({ uid, name })),
            }));

        res.send(
          schedules.map(({ deviceGroups: dgs, ...rest }) => ({
            ...rest,
            deviceGroups: mapDeviceGroups(dgs),
          }))
        );
      });

      app.post<unknown, string, { schedule: string }>('/schedule/execute', (req, res) => {
        const schedule = schedules.find(({ uid }) => req.body.schedule === uid);

        if (schedule) {
          const deviceUrls = toDeviceUrls(
            schedule.deviceGroups
              .flatMap((deviceGroupUid) => deviceGroups.find(({ uid }) => deviceGroupUid === uid)?.devices)
              .filter(filterUndefined)
          );

          const event = commandToSomfyEvent(schedule.command.name);

          eventAggregator.publish(event, { devices: deviceUrls });

          res.send('ok');
        }

        res.status(404).send();
      });

      app.post<unknown, string, DevicesReq>('/shutter/up', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Up, { devices: toDeviceUrls(req.body.devices) });

        res.send('ok');
      });

      app.post<unknown, string, DevicesReq>('/shutter/down', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Down, { devices: toDeviceUrls(req.body.devices) });

        res.send('ok');
      });

      app.post<unknown, string, DevicesReq>('/shutter/wink', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Wink, { devices: toDeviceUrls(req.body.devices) });

        res.send('ok');
      });

      app.post<unknown, string, DevicesReq>('/shutter/identify', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Identify, { devices: toDeviceUrls(req.body.devices) });

        res.send('ok');
      });

      app.post<unknown, string, DevicesReq>('/shutter/stop', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Stop, { devices: toDeviceUrls(req.body.devices) });

        res.send('ok');
      });

      app.post<unknown, string, DevicesReq>('/shutter/my', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.My, { devices: toDeviceUrls(req.body.devices) });

        res.send('ok');
      });
    },
  };
};
