import { Somfy, SomfyOptions } from './somfy';

describe('Somfy', () => {
  const somfyOptions: SomfyOptions = {
    host: '127.0.0.1',
    apiKey: '123abc',
  };

  afterEach(() => jest.clearAllMocks());

  describe('Execute command', () => {
    const httpClient = jest.fn().mockResolvedValue({
      json: () => ({ execId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }),
    });

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

  describe('Get devices', () => {
    const fakeResponse = [
      {
        deviceURL: 'io://1234-5678-9101/1234567',
        states: [
          {
            type: 6,
            name: 'core:MovingState',
            value: false,
          },
        ],
      },
      {
        deviceURL: 'io://4321-8765-1019/7654321',
        states: [
          {
            type: 6,
            name: 'core:MovingState',
            value: false,
          },
        ],
      },
    ];

    const httpClient = jest.fn().mockResolvedValue({
      json: () => fakeResponse,
    });

    it('should retrieve the devices', async () => {
      // Arrange
      const somfy = Somfy({
        httpClient,
        options: somfyOptions,
      });

      // Act
      const devices = await somfy.getDevices();

      // Assert
      expect(devices).toHaveLength(2);
      expect(devices).toStrictEqual([
        {
          deviceUrl: 'io://1234-5678-9101/1234567',
          isMoving: false,
        },
        {
          deviceUrl: 'io://4321-8765-1019/7654321',
          isMoving: false,
        },
      ]);
    });

    it('should correctly map when movind state is true', async () => {
      // Arrange
      const httpClient = jest.fn().mockResolvedValue({
        json: () => [
          {
            deviceURL: 'io://1234-5678-9101/1234567',
            states: [
              {
                type: 6,
                name: 'core:MovingState',
                value: true,
              },
            ],
          },
        ],
      });

      const somfy = Somfy({
        httpClient,
        options: somfyOptions,
      });

      // Act
      const devices = await somfy.getDevices();

      // Assert
      expect(devices).toHaveLength(1);
      expect(devices).toStrictEqual([
        {
          deviceUrl: 'io://1234-5678-9101/1234567',
          isMoving: true,
        },
      ]);
    });

    it('should call the devices endpoint with the correct url', async () => {
      // Arrange
      const somfy = Somfy({
        httpClient,
        options: somfyOptions,
      });

      // Act
      await somfy.getDevices();

      // Assert
      expect(httpClient).toBeCalledWith('http://127.0.0.1/enduser-mobile-web/1/enduserAPI/setup/devices', {
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': '123abc' },
      });
    });

    it('should default to "isMoving: false" when no state could be received for device', async () => {
      // Arrange
      const httpClient = jest.fn().mockResolvedValue({
        json: () => [
          {
            deviceURL: 'io://1234-5678-9101/1234567',
            states: [],
          },
        ],
      });

      const somfy = Somfy({
        httpClient,
        options: somfyOptions,
      });

      // Act
      const devices = await somfy.getDevices();

      // Assert
      expect(devices).toHaveLength(1);
      expect(devices).toStrictEqual([
        {
          deviceUrl: 'io://1234-5678-9101/1234567',
          isMoving: false,
        },
      ]);
    });
  });
});
