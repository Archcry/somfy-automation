export interface SomfyEventData {
  devices: string[];
}

export interface SomfySetDeploymentData {
  devices: [
    {
      deviceUrl: string;
      percentage: number;
    }
  ];
}

export enum Somfy {
  Up = 'somfy:up',
  Down = 'somfy:down',
  SetDeployment = 'somfy:setDeployment',
  Wink = 'somfy:wink',
  Identify = 'somfy:identify',
  Stop = 'somfy:stop',
  My = 'somfy:my',
}
