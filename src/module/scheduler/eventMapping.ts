import { Somfy as SomfyEvents } from '../../events';

export const eventMapping = {
  up: SomfyEvents.Up,
  down: SomfyEvents.Down,
  setDeploymenty: SomfyEvents.SetDeployment,
  wink: SomfyEvents.Wink,
  identify: SomfyEvents.Identify,
  stop: SomfyEvents.Stop,
  my: SomfyEvents.My,
};
