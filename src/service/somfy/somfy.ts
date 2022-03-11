import { RequestInfo, RequestInit, Response } from 'node-fetch';

export interface SomfyOptions {
  host: string;
  apiKey: string;
}

export interface SomfyConstructorArgs {
  httpClient: HttpClient;
  options: SomfyOptions;
}

export type HttpClient = (url: RequestInfo, init?: RequestInit) => Promise<Response>;

export type CommandParameter = string | number;

export interface SomfyResponse {
  execId: string;
}

export interface SomfyDevice {
  deviceUrl: string;
  isMoving: boolean;
}

export interface ISomfy {
  exec: (commands: Command[]) => Promise<SomfyResponse>;
  getDevices: () => Promise<SomfyDevice[]>;
}

export interface Command {
  deviceUrl: string;
  command: string;
  parameters?: CommandParameter[];
}

interface State {
  type: number;
  name: string;
  value: number;
}

interface GetDevicesResponse {
  deviceURL: string;
  states: State[];
}

export const Somfy = ({ httpClient, options }: SomfyConstructorArgs) => {
  const exec = (commands: Command[]) => {
    const url = `http://${options.host}/enduser-mobile-web/1/enduserAPI/exec/apply`;

    const actions = commands.map((command) => ({
      deviceURL: command.deviceUrl,
      commands: [
        {
          name: command.command,
          parameters: command.parameters,
        },
      ],
    }));

    const request = {
      method: 'POST',
      body: JSON.stringify({
        actions,
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': options.apiKey,
      },
    };

    return httpClient(url, request).then((response) => response.json());
  };

  const mapToDevice = ({ deviceURL, states }: GetDevicesResponse) => {
    const state = states.find((state: State) => state.name === 'core:MovingState');

    return {
      deviceUrl: deviceURL,
      isMoving: Boolean(state?.value),
    };
  };

  const getDevices = async () => {
    const url = `http://${options.host}/enduser-mobile-web/1/enduserAPI/setup/devices`;

    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': options.apiKey,
      },
    };

    return await httpClient(url, requestOptions)
      .then((res) => res.json())
      .then((devices) => devices.map(mapToDevice));
  };

  return {
    exec,
    getDevices,
  };
};
