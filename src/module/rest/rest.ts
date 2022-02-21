import bodyParser from 'body-parser';
import { Express } from 'express';
import basicAuth from 'express-basic-auth';
import { Somfy as SomfyEvents, SomfyEventData } from '../../events';
import { IEventAggregator } from '../../lib/eventaggregator/eventAggregator';
import { DeviceGroup } from '../../types';

export interface RestModuleOptions {
  app: Express;
  eventAggregator: IEventAggregator;
  users: { [username: string]: string };
  deviceGroups: DeviceGroup[];
}

export interface DeviceGroupReq {
  deviceGroups: string[];
}

export const Rest = ({ app, users, eventAggregator, deviceGroups }: RestModuleOptions) => {
  const toSomfyEventData = (deviceGroupUids: string[]) => {
    const devices = new Set(
      deviceGroupUids
        .map((uid) => deviceGroups.filter((dg) => dg.uid === uid))
        .flatMap((dg) => dg)
        .map((dg) => dg.devices)
        .flatMap((devices) => devices)
        .map((device) => Buffer.from(device, 'base64'))
        .map((buff) => buff.toString('utf-8'))
    );

    return {
      devices: Array.from(devices),
    };
  };

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

      app.get<Array<Omit<DeviceGroup, 'devices'>>>('/shutter/deviceGroups', (req, res) => {
        res.send(
          deviceGroups.map((dg) => ({
            uid: dg.uid,
            name: dg.name,
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
