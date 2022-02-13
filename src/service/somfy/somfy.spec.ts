import { Somfy, SomfyOptions } from './somfy';

describe('Somfy', () => {
  const httpClient = jest.fn().mockResolvedValue({
    json: () => ({ execId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }),
  });

  const somfyOptions: SomfyOptions = {
    host: '127.0.0.1',
    apiKey: '123abc',
  };
  const apiKey = '123abc';

  afterEach(() => jest.clearAllMocks());

  it('should construct a correctly formatted request body based on input', () => {
    // Arrange
    const somfy = Somfy({
      httpClient,
      options: somfyOptions,
    });

    // Act
    somfy.exec([
      {
        deviceUrl: 'io://io://AAAA-BBBB-CCCC/DDDDDDD',
        command: 'setDeployment',
        parameters: [20],
      },
    ]);

    // Assert
    expect(httpClient).toBeCalledTimes(1);
    expect(httpClient.mock.calls[0][1].body).toEqual(
      JSON.stringify({
        actions: [
          {
            deviceURL: 'io://io://AAAA-BBBB-CCCC/DDDDDDD',
            commands: [
              {
                name: 'setDeployment',
                parameters: [20],
              },
            ],
          },
        ],
      })
    );
  });

  it('should construct a correct request for multiple devices', () => {
    // Arrange
    const somfy = Somfy({
      httpClient,
      options: somfyOptions,
    });

    // Act
    somfy.exec([
      {
        deviceUrl: 'io://io://AAAA-BBBB-CCCC/DDDDDDD',
        command: 'setDeployment',
        parameters: [20],
      },
      {
        deviceUrl: 'io://io://EEEE-FFFF-GGGG/HHHHHHH',
        command: 'up',
      },
    ]);

    // Assert
    expect(httpClient).toBeCalledTimes(1);
    expect(httpClient.mock.calls[0][1].body).toEqual(
      JSON.stringify({
        actions: [
          {
            deviceURL: 'io://io://AAAA-BBBB-CCCC/DDDDDDD',
            commands: [
              {
                name: 'setDeployment',
                parameters: [20],
              },
            ],
          },
          {
            deviceURL: 'io://io://EEEE-FFFF-GGGG/HHHHHHH',
            commands: [
              {
                name: 'up',
              },
            ],
          },
        ],
      })
    );
  });
});
