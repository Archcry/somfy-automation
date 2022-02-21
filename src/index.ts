import express from 'express';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { environment } from './environment';
import { EventAggregator } from './lib/eventaggregator/eventAggregator';
import { Rest as RestModule } from './module/rest/rest';
import { Somfy as SomfyModule } from './module/somfy/somfy';
import { Somfy as SomfyService } from './service/somfy/somfy';
import { DeviceGroup, Schedule } from './types';

const deviceGroups: DeviceGroup[] = JSON.parse(fs.readFileSync(environment.paths.deviceGroups, 'utf-8'));
const schedules: Schedule[] = JSON.parse(fs.readFileSync(environment.paths.schedules, 'utf-8'));

const app = express();

app.listen(environment.port, () => {
  console.log(`App listening on port ${environment.port}`);

  const eventAggregator = EventAggregator(console);

  const somfyService = SomfyService({
    httpClient: fetch,
    options: environment.somfy,
  });

  SomfyModule({
    logger: console,
    eventAggregator,
    somfyService,
  }).start();

  const apiUserUsername = environment.basicAuth.username;
  const apiUserPassword = environment.basicAuth.password;

  RestModule({
    app,
    eventAggregator,
    deviceGroups,
    users: {
      [apiUserUsername]: apiUserPassword,
    },
  }).start();
});
