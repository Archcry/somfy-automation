const getFromEnvOrThrow = (key: string): string => {
  if (process.env[key]) {
    return process.env[key] as string;
  }

  throw new Error(`Could not retrieve value for key "${key}" from environment`);
};

export const environment = {
  port: process.env['PORT'] ?? 3000,
  cors: {
    allowedOrigins: process.env['CORS_ALLOWED_ORIGINS'],
  },
  somfy: {
    host: getFromEnvOrThrow('SOMFY_API_HOST'),
    apiKey: getFromEnvOrThrow('SOMFY_API_KEY'),
  },
  basicAuth: {
    username: getFromEnvOrThrow('API_BASIC_AUTH_USERNAME'),
    password: getFromEnvOrThrow('API_BASIC_AUTH_PASSWORD'),
  },
  paths: {
    devices: process.env['DEVICES_PATH'] ?? '/opt/somfy-automation/devices.json',
    deviceGroups: process.env['DEVICE_GROUPS_PATH'] ?? '/opt/somfy-automation/deviceGroups.json',
    schedules: process.env['SCHEDULE_PATH'] ?? '/opt/somfy-automation/schedules.json',
  },
};
