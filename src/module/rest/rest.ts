import bodyParser from 'body-parser';
import { Express } from 'express';
import basicAuth from 'express-basic-auth';
import { Somfy as SomfyEvents, SomfyEventData, SomfySetDeploymentData } from '../../events';
import { IEventAggregator } from '../../lib/eventaggregator/eventAggregator';

export interface RestModuleOptions {
  app: Express;
  eventAggregator: IEventAggregator;
  users: { [username: string]: string };
}

export const Rest = ({ app, users, eventAggregator }: RestModuleOptions) => {
  return {
    start: () => {
      app.use(
        basicAuth({
          users: users,
          challenge: true,
        })
      );

      app.use(bodyParser.json());

      app.post<SomfyEventData>('/shutter/up', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Up, req.body);

        res.send('ok');
      });

      app.post<SomfyEventData>('/shutter/down', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Down, req.body);

        res.send('ok');
      });

      app.post<SomfyEventData>('/shutter/wink', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Wink, req.body);

        res.send('ok');
      });

      app.post<SomfyEventData>('/shutter/identify', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Identify, req.body);

        res.send('ok');
      });

      app.post<SomfyEventData>('/shutter/stop', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.Stop, req.body);

        res.send('ok');
      });

      app.post<SomfyEventData>('/shutter/my', (req, res) => {
        eventAggregator.publish<SomfyEventData>(SomfyEvents.My, req.body);

        res.send('ok');
      });

      app.post<SomfySetDeploymentData>('/shutter/setDeployment', (req, res) => {
        eventAggregator.publish<SomfySetDeploymentData>(SomfyEvents.SetDeployment, req.body);

        res.send('ok');
      });
    },
  };
};
