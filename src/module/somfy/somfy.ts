import { Somfy as SomfyEvents, SomfyEventData, SomfySetDeploymentData } from '../../events';
import { IEventAggregator } from '../../lib/eventaggregator/eventAggregator';
import { ILogger } from '../../lib/logger/logger';
import { CommandParameter, ISomfy as SomfyService } from '../../service/somfy/somfy';

export interface SomfyModuleArgs {
  eventAggregator: Pick<IEventAggregator, 'subscribe'>;
  somfyService: Pick<SomfyService, 'exec'>;
  logger: Pick<ILogger, 'info' | 'error'>;
}

export const Somfy = ({ eventAggregator: ea, somfyService, logger }: SomfyModuleArgs) => {
  const logError = (command: string) => () => logger.error(`Failed to send command "${command}"`);
  const logSuccess = (command: string) => () => logger.info(`Succesfully send command "${command}"`);

  const createCommand = (command: string, parameters?: CommandParameter[]) => (deviceUrl: string) => ({
    deviceUrl,
    command,
    parameters,
  });

  const execForDevices = (devices: string[]) => (command: string) => {
    const commands = devices.map(createCommand(command));

    somfyService.exec(commands).then(logSuccess(command)).catch(logError(command));
  };

  return {
    start: () => {
      ea.subscribe(SomfyEvents.Up, (_, { devices }: SomfyEventData) => execForDevices(devices)('up'));
      ea.subscribe(SomfyEvents.Down, (_, { devices }: SomfyEventData) => execForDevices(devices)('down'));
      ea.subscribe(SomfyEvents.Stop, (_, { devices }: SomfyEventData) => execForDevices(devices)('stop'));
      ea.subscribe(SomfyEvents.Identify, (_, { devices }: SomfyEventData) => execForDevices(devices)('identify'));
      ea.subscribe(SomfyEvents.Wink, (_, { devices }: SomfyEventData) => execForDevices(devices)('wink'));
      ea.subscribe(SomfyEvents.My, (_, { devices }: SomfyEventData) => execForDevices(devices)('my'));

      ea.subscribe(SomfyEvents.SetDeployment, (_, { devices }: SomfySetDeploymentData) => {
        const command = 'setDeployment';

        const commands = devices.map((device) => ({
          deviceUrl: device.deviceUrl,
          parameters: [device.percentage],
          command,
        }));

        somfyService.exec(commands).then(logSuccess(command)).catch(logError(command));
      });
    },
  };
};
