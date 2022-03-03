import express from 'express';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { environment } from './environment';
import { EventAggregator } from './lib/eventaggregator/eventAggregator';
import { Logger, LoggerArgs } from './lib/logger/logger';
import { Rest as RestModule } from './module/rest/rest';
import { Scheduler as SchedulerModule } from './module/scheduler/scheduler';
import { Somfy as SomfyModule } from './module/somfy/somfy';
import { Somfy as SomfyService } from './service/somfy/somfy';
import { DeviceGroup, Schedule } from './types';

const deviceGroups: DeviceGroup[] = JSON.parse(fs.readFileSync(environment.paths.deviceGroups, 'utf-8'));
const schedules: Schedule[] = JSON.parse(fs.readFileSync(environment.paths.schedules, 'utf-8'));

const app = express();

const loggerOptions: Omit<LoggerArgs, 'componentName'> = {
  baseLogger: console,
  logLevel: 'info',
};

app.listen(environment.port, () => {
  const logger = Logger({
    ...loggerOptions,
    componentName: 'Main',
  });

  logger.info(`App listening on port ${environment.port}`);

  const eventAggregator = EventAggregator(console);

  const somfyService = SomfyService({
    httpClient: fetch,
    options: environment.somfy,
  });

  SomfyModule({
    logger: Logger({
      ...loggerOptions,
      componentName: 'SomfyModule',
    }),
    eventAggregator,
    somfyService,
  }).start();

  SchedulerModule({
    logger: Logger({
      ...loggerOptions,
      componentName: 'SchedulerModule',
    }),
    eventAggregator,
    schedules,
    deviceGroups,
  }).start();

  const apiUserUsername = environment.basicAuth.username;
  const apiUserPassword = environment.basicAuth.password;

  RestModule({
    app,
    eventAggregator,
    deviceGroups,
    schedules,
    users: {
      [apiUserUsername]: apiUserPassword,
    },
  }).start();
});
