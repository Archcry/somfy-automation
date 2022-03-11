import { Somfy as SomfyEvents, SomfyEventData, SomfySetDeploymentData } from '../../events';
import { IEventAggregator } from '../../lib/eventaggregator/eventAggregator';
import { ILogger } from '../../lib/logger/logger';
import { CommandParameter, ISomfy as SomfyService } from '../../service/somfy/somfy';

export interface SomfyModuleArgs {
  eventAggregator: Pick<IEventAggregator, 'subscribe'>;
  somfyService: Pick<SomfyService, 'exec' | 'getDevices'>;
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

  const execMyForDevices = async (devices: string[]) => {
    if (devices.length > 0) {
      const isMoving = await somfyService
        .getDevices()
        .then((somfyDevices) => somfyDevices.filter((device) => devices.includes(device.deviceUrl)))
        .then((somfyDevices) => somfyDevices.find((device) => device.isMoving))
        .then((somfyDevice) => !!somfyDevice)
        .catch((err) => logger.error(err));

      if (isMoving) {
        logger.info('Sending "stop" instead of "my" because at least one of the shutters is moving');
      }

      const command = isMoving ? 'stop' : 'my';

      if (command) {
        somfyService
          .exec(devices.map(createCommand(command)))
          .then(logSuccess(command))
          .catch(logError(command));
      }
    }
  };

  return {
    start: () => {
      ea.subscribe(SomfyEvents.Up, (_, { devices }: SomfyEventData) => execForDevices(devices)('up'));
      ea.subscribe(SomfyEvents.Down, (_, { devices }: SomfyEventData) => execForDevices(devices)('down'));
      ea.subscribe(SomfyEvents.Stop, (_, { devices }: SomfyEventData) => execForDevices(devices)('stop'));
      ea.subscribe(SomfyEvents.Identify, (_, { devices }: SomfyEventData) => execForDevices(devices)('identify'));
      ea.subscribe(SomfyEvents.Wink, (_, { devices }: SomfyEventData) => execForDevices(devices)('wink'));
      ea.subscribe(SomfyEvents.My, (_, { devices }: SomfyEventData) => execMyForDevices(devices));

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
