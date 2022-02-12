import { RequestInfo, RequestInit, Response } from 'node-fetch';

export interface SomfyOptions {
  host: string;
  apiKey: string;
}

export type HttpClient = (url: RequestInfo, init?: RequestInit) => Promise<Response>;

export type CommandParameter = string | number;

export interface Command {
  deviceUrl: string;
  command: string;
  parameters?: CommandParameter[];
}

export const Somfy = (logger: Pick<Console, 'error'>, httpClient: HttpClient, options: SomfyOptions) => {
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

  return {
    exec,
  };
};
