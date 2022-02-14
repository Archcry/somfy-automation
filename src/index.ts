import express from 'express';
import { EventAggregator } from './lib/eventaggregator/eventAggregator';

import fetch from 'node-fetch';
import { Somfy as SomfyService } from './service/somfy/somfy';
import { Somfy as SomfyModule } from './module/somfy/somfy';
import { Rest as RestModule } from './module/rest/rest';

const port = process.env['PORT'] || 3000;

const app = express();

const getFromEnvOrThrow = (key: string): string => {
  if (process.env[key]) {
    return process.env[key] as string;
  }

  throw new Error(`Could not retrieve value for key "${key}" from environment`);
};

app.get('/', (_, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);

  const eventAggregator = EventAggregator(console);

  const somfyService = SomfyService({
    httpClient: fetch,
    options: {
      host: getFromEnvOrThrow('SOMFY_API_HOST'),
      apiKey: getFromEnvOrThrow('SOMFY_API_KEY'),
    },
  });

  SomfyModule({
    logger: console,
    eventAggregator,
    somfyService,
  }).start();

  const apiUserUsername = getFromEnvOrThrow('API_BASIC_AUTH_USERNAME');
  const apiUserPassword = getFromEnvOrThrow('API_BASIC_AUTH_PASSWORD');

  RestModule({
    app,
    eventAggregator,
    users: {
      [apiUserUsername]: apiUserPassword,
    },
  }).start();
});
