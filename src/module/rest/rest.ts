import bodyParser from 'body-parser';
import cors from 'cors';
import { Express } from 'express';
import basicAuth from 'express-basic-auth';
import { commandToSomfyEvent, Somfy as SomfyEvents, SomfyEventData } from '../../events';
import { IEventAggregator } from '../../lib/eventaggregator/eventAggregator';
import { ILogger } from '../../lib/logger/logger';
import { Device, DeviceGroup, Schedule } from '../../types';

export interface RestModuleOptions {
  app: Pick<Express, 'get' | 'post' | 'use'>;
  eventAggregator: Pick<IEventAggregator, 'publish'>;
  users: { [username: string]: string };
  deviceGroups: DeviceGroup[];
  devices: Device[];
  logger: Pick<ILogger, 'info'>;
  schedules: Schedule[];
  allowedOrigins: string;
}

export interface DevicesReq {
  devices: string[];
}

export const Rest = ({
  app,
  users,
  eventAggregator,
  deviceGroups,
  devices,
  schedules,
  logger,
  allowedOrigins,
}: RestModuleOptions) => {
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
        cors({
          origin: (_, callback) => {
            callback(null, allowedOrigins.split(','));
          },
        })
      );

      app.use(
        basicAuth({
          users: users,
          challenge: true,
        })
      );

      app.use(bodyParser.json());

      app.get<unknown, { hello: 'world' }>('/', (_, res) => {
        res.send({ hello: 'world' });
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

      app.post<unknown, { success: boolean }, { schedule: string }>('/schedule/execute', (req, res) => {
        logger.info(`Received schedule execute command for schedule with uid "${req.body.schedule}"`);

        const schedule = schedules.find(({ uid }) => req.body.schedule === uid);

        if (schedule) {
          const deviceUrls = toDeviceUrls(
            schedule.deviceGroups
              .flatMap((deviceGroupUid) => deviceGroups.find(({ uid }) => deviceGroupUid === uid)?.devices)
              .filter(filterUndefined)
          );

          const event = commandToSomfyEvent(schedule.command.name);

          eventAggregator.publish(event, { devices: deviceUrls });

          res.send({ success: true });
        }

        res.status(404).send();
      });

      app.post<unknown, { success: boolean }, DevicesReq>('/shutter/up', (req, res) => {
        logger.info(`Received "up" command for devices with uids [${req.body.devices.join(', ')}]`);

        eventAggregator.publish<SomfyEventData>(SomfyEvents.Up, { devices: toDeviceUrls(req.body.devices) });

        res.send({ success: true });
      });

      app.post<unknown, { success: boolean }, DevicesReq>('/shutter/down', (req, res) => {
        logger.info(`Received "down" command for devices with uids [${req.body.devices.join(', ')}]`);

        eventAggregator.publish<SomfyEventData>(SomfyEvents.Down, { devices: toDeviceUrls(req.body.devices) });

        res.send({ success: true });
      });

      app.post<unknown, { success: boolean }, DevicesReq>('/shutter/wink', (req, res) => {
        logger.info(`Received "wink" command for devices with uids [${req.body.devices.join(', ')}]`);

        eventAggregator.publish<SomfyEventData>(SomfyEvents.Wink, { devices: toDeviceUrls(req.body.devices) });

        res.send({ success: true });
      });

      app.post<unknown, { success: boolean }, DevicesReq>('/shutter/identify', (req, res) => {
        logger.info(`Received "identify" command for devices with uids [${req.body.devices.join(', ')}]`);

        eventAggregator.publish<SomfyEventData>(SomfyEvents.Identify, { devices: toDeviceUrls(req.body.devices) });

        res.send({ success: true });
      });

      app.post<unknown, { success: boolean }, DevicesReq>('/shutter/stop', (req, res) => {
        logger.info(`Received "stop" command for devices with uids [${req.body.devices.join(', ')}]`);

        eventAggregator.publish<SomfyEventData>(SomfyEvents.Stop, { devices: toDeviceUrls(req.body.devices) });

        res.send({ success: true });
      });

      app.post<unknown, { success: boolean }, DevicesReq>('/shutter/my', (req, res) => {
        logger.info(`Received "my" command for devices with uids [${req.body.devices.join(', ')}]`);

        eventAggregator.publish<SomfyEventData>(SomfyEvents.My, { devices: toDeviceUrls(req.body.devices) });

        res.send({ success: true });
      });
    },
  };
};
