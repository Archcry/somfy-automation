import bodyParser from 'body-parser';
import { Express } from 'express';
import basicAuth from 'express-basic-auth';
import { Somfy as SomfyEvents, SomfyEventData } from '../../events';
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

export interface DeviceGroupReq {
  deviceGroups: string[];
}

export const Rest = ({ app, users, eventAggregator, deviceGroups, devices, schedules }: RestModuleOptions) => {
  const filterUndefined = <T>(entry: T | undefined): entry is T => !!entry;

  const toSomfyEventData = (deviceGroupUids: string[]) => {
    const deviceUrls = deviceGroupUids
      .flatMap((uid) => deviceGroups.find((dg) => dg.uid === uid))
      .filter(filterUndefined)
      .flatMap(({ devices }) => devices)
      .map((uid) => devices.find((dev) => dev.uid === uid))
      .filter(filterUndefined)
      .map(({ deviceUrl }) => deviceUrl);

    return {
      devices: Array.from(new Set(deviceUrls)),
    };
  };

  const mapDevices = (deviceUids: string[]) =>
    deviceUids
      .map((deviceUid) => devices.find(({ uid }) => uid === deviceUid))
      .filter(filterUndefined)
      .map(({ uid, name }) => ({ uid, name }));

  const mapDeviceGroups = (deviceGroupUids: string[]) =>
    deviceGroupUids
      .map((deviceGroupUid) => deviceGroups.find(({ uid }) => uid === deviceGroupUid))
      .filter(filterUndefined)
      .map(({ devices: devUids, ...rest }) => ({
        ...rest,
        devices: mapDevices(devUids),
      }));

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
      app.get<DeviceGroupResp>('/shutter/deviceGroups', (req, res) => {
        res.send(
          deviceGroups.map(({ devices, ...rest }) => ({
            ...rest,
            devices: mapDevices(devices),
          }))
        );
      });

      type ScheduleResp = Array<Omit<Schedule, 'deviceGroups'> & { deviceGroups: DeviceGroupResp }>;
      app.get<ScheduleResp>('/shutter/schedules', (_, res) => {
        res.send(
          schedules.map(({ deviceGroups: dgs, ...rest }) => ({
            ...rest,
            deviceGroups: mapDeviceGroups(dgs),
          }))
        );
      });

      app.post<DeviceGroupReq>('/shutter/up', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Up, toSomfyEventData(req.body.deviceGroups));

        res.send('ok');
      });

      app.post<DeviceGroupReq>('/shutter/down', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Down, toSomfyEventData(req.body.deviceGroups));

        res.send('ok');
      });

      app.post<DeviceGroupReq>('/shutter/wink', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Wink, toSomfyEventData(req.body.deviceGroups));

        res.send('ok');
      });

      app.post<DeviceGroupReq>('/shutter/identify', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Identify, toSomfyEventData(req.body.deviceGroups));

        res.send('ok');
      });

      app.post<DeviceGroupReq>('/shutter/stop', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Stop, toSomfyEventData(req.body.deviceGroups));

        res.send('ok');
      });

      app.post<DeviceGroupReq>('/shutter/my', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.My, toSomfyEventData(req.body.deviceGroups));

        res.send('ok');
      });
    },
  };
};
