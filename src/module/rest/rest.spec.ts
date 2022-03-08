import { Somfy as SomfyEvents } from '../../events';
import { IEventAggregator } from '../../lib/eventaggregator/eventAggregator';
import { FixedTimeSchedule } from '../../types';
import { Rest } from './rest';

const endpointToSomfyEventMap: { [key: string]: SomfyEvents } = {
  '/shutter/up': SomfyEvents.Up,
  '/shutter/down': SomfyEvents.Down,
  '/shutter/wink': SomfyEvents.Wink,
  '/shutter/identify': SomfyEvents.Identify,
  '/shutter/stop': SomfyEvents.Stop,
  '/shutter/my': SomfyEvents.My,
};

const logger = {
  info: jest.fn(),
};

const getEndpointMethods = (app: { get: jest.Mock; post: jest.Mock }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reduceFn = (prev: any, cur: any[]) => ({
    ...prev,
    [cur[0]]: cur[1],
  });

  return {
    post: app.post.mock.calls.reduce(reduceFn, {}),
    get: app.get.mock.calls.reduce(reduceFn, {}),
  };
};

describe('Rest Module', () => {
  const app = {
    post: jest.fn(),
    get: jest.fn(),
    use: jest.fn(),
  };

  const eventAggregator: Pick<IEventAggregator, 'publish'> = {
    publish: jest.fn(),
  };

  const deviceGroups = [
    {
      uid: '831f2cb7-3208-4c6d-8915-f27360de39e3',
      devices: ['068dfc0e-9c63-11ec-b909-0242ac120002'],
      name: 'testLocation',
    },
    {
      uid: '5cd6c40a-9c64-11ec-b909-0242ac120002',
      devices: ['2f9cb9e0-9c64-11ec-b909-0242ac120002'],
      name: 'testLocation2',
    },
  ];

  const devices = [
    {
      uid: '068dfc0e-9c63-11ec-b909-0242ac120002',
      name: 'testDevice',
      deviceUrl: 'io://1234-5678-9101/1234567',
    },
    {
      uid: '2f9cb9e0-9c64-11ec-b909-0242ac120002',
      name: 'testDevice2',
      deviceUrl: 'io://4321-8765-1019/7654321',
    },
  ];

  it('should register the correct handlers', () => {
    // Arrange
    const expectedEndpoints = {
      post: [
        '/shutter/up',
        '/shutter/down',
        '/shutter/wink',
        '/shutter/identify',
        '/shutter/stop',
        '/shutter/my',
        '/schedule/execute',
      ],
      get: ['/', '/shutter/deviceGroups', '/shutter/schedules'],
    };

    // Act
    Rest({
      schedules: [],
      deviceGroups,
      devices,
      users: {},
      eventAggregator,
      app,
      logger,
      allowedOrigins: '',
    }).start();

    // Assert
    expect(app.get).toBeCalledTimes(expectedEndpoints.get.length);
    expectedEndpoints.get.forEach((endpoint) => expect(app.get).toBeCalledWith(endpoint, expect.any(Function)));

    expect(app.post).toBeCalledTimes(expectedEndpoints.post.length);
    expectedEndpoints.post.forEach((endpoint) => expect(app.post).toBeCalledWith(endpoint, expect.any(Function)));

    expect(app.use).toBeCalledTimes(3);
  });

  it('should return "hello world!" on "/"', () => {
    // Arange
    Rest({
      schedules: [],
      deviceGroups,
      devices,
      users: {},
      eventAggregator,
      app,
      logger,
      allowedOrigins: '',
    }).start();

    const rootEndpoint = getEndpointMethods(app).get['/'];
    const resHandler = { send: jest.fn() };

    // Act
    rootEndpoint({}, resHandler);

    // Assert
    expect(resHandler.send).toBeCalledTimes(1);
    expect(resHandler.send).toBeCalledWith({ hello: 'world' });
  });

  it('should return the schedules on GET /shutter/schedules', () => {
    // Arrange
    const schedules: FixedTimeSchedule[] = [
      {
        uid: '7c958d28-9c7b-11ec-b909-0242ac120002',
        type: 'fixed_time',
        dow: ['mon'],
        deviceGroups: ['831f2cb7-3208-4c6d-8915-f27360de39e3'],
        timezone: 'Europe/Amsterdam',
        time: '11:00',
        command: {
          name: 'up',
          parameters: [],
        },
      },
    ];

    Rest({
      schedules,
      deviceGroups,
      devices,
      users: {},
      eventAggregator,
      app,
      logger,
      allowedOrigins: '',
    }).start();

    const schedulesEndpoint = getEndpointMethods(app).get['/shutter/schedules'];
    const res = { send: jest.fn() };

    // Act
    schedulesEndpoint({}, res);

    // Assert
    expect(res.send).toBeCalledTimes(1);
    expect(res.send).toBeCalledWith([
      {
        uid: '7c958d28-9c7b-11ec-b909-0242ac120002',
        type: 'fixed_time',
        dow: ['mon'],
        deviceGroups: [
          {
            uid: '831f2cb7-3208-4c6d-8915-f27360de39e3',
            devices: [
              {
                uid: '068dfc0e-9c63-11ec-b909-0242ac120002',
                name: 'testDevice',
              },
            ],
            name: 'testLocation',
          },
        ],
        timezone: 'Europe/Amsterdam',
        time: '11:00',
        command: {
          name: 'up',
          parameters: [],
        },
      },
    ]);
  });

  it('should return the deviceGroups on GET /shutter/deviceGroups', () => {
    // Arrange
    Rest({
      schedules: [],
      deviceGroups,
      devices,
      users: {},
      eventAggregator,
      app,
      logger,
      allowedOrigins: '',
    }).start();

    const deviceGroupsEndpoint = getEndpointMethods(app).get['/shutter/deviceGroups'];
    const res = { send: jest.fn() };

    // Act
    deviceGroupsEndpoint({}, res);

    // Assert
    expect(res.send).toBeCalledTimes(1);
    expect(res.send).toBeCalledWith([
      {
        uid: '831f2cb7-3208-4c6d-8915-f27360de39e3',
        devices: [{ uid: '068dfc0e-9c63-11ec-b909-0242ac120002', name: 'testDevice' }],
        name: 'testLocation',
      },
      {
        uid: '5cd6c40a-9c64-11ec-b909-0242ac120002',
        devices: [{ uid: '2f9cb9e0-9c64-11ec-b909-0242ac120002', name: 'testDevice2' }],
        name: 'testLocation2',
      },
    ]);
  });

  it('should fire an event on all post handlers', () => {
    // Arrange
    const endpointsUnderTest = [
      '/shutter/up',
      '/shutter/down',
      '/shutter/wink',
      '/shutter/identify',
      '/shutter/stop',
      '/shutter/my',
    ];

    Rest({
      schedules: [],
      deviceGroups,
      devices,
      users: {},
      eventAggregator,
      app,
      logger,
      allowedOrigins: '',
    }).start();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postEndpoints: { [key: string]: any } = getEndpointMethods(app).post;

    // Act & Assert
    Object.entries(postEndpoints)
      .filter(([url]) => endpointsUnderTest.includes(url))
      .forEach(([url, endpoint]) => {
        const req = {
          body: { devices: ['068dfc0e-9c63-11ec-b909-0242ac120002', '2f9cb9e0-9c64-11ec-b909-0242ac120002'] },
        };
        const res = { send: jest.fn() };

        endpoint(req, res);

        expect(res.send).toBeCalledTimes(1);
        expect(res.send).toBeCalledWith({ success: true });

        expect(logger.info).toBeCalledWith(
          `Received "${endpointToSomfyEventMap[url].split(':')[1]}" command for devices with uids [${devices
            .map(({ uid }) => uid)
            .join(', ')}]`
        );

        expect(eventAggregator.publish).toBeCalledWith(
          endpointToSomfyEventMap[url],
          expect.objectContaining({
            devices: expect.arrayContaining(devices.map(({ deviceUrl }) => deviceUrl)),
          })
        );
      });
  });

  it('should execute the schedule immidiately upon calling /schedule/execute', () => {
    // Arrange
    const schedule: FixedTimeSchedule = {
      uid: '7c958d28-9c7b-11ec-b909-0242ac120002',
      type: 'fixed_time',
      dow: ['mon'],
      deviceGroups: ['831f2cb7-3208-4c6d-8915-f27360de39e3'],
      timezone: 'Europe/Amsterdam',
      time: '11:00',
      command: {
        name: 'up',
        parameters: [],
      },
    };

    Rest({
      schedules: [schedule],
      deviceGroups,
      devices,
      users: {},
      eventAggregator,
      app,
      logger,
      allowedOrigins: '',
    }).start();

    const post = getEndpointMethods(app).post['/schedule/execute'];

    const sendResFn = jest.fn();
    const res = {
      send: sendResFn,
      status: jest.fn().mockImplementation(() => ({
        send: sendResFn,
      })),
    };

    // Act
    const req = { body: { schedule: '7c958d28-9c7b-11ec-b909-0242ac120002' } };

    post(req, res);

    // Assert
    expect(res.send).toBeCalledWith({ success: true });
    expect(eventAggregator.publish).toBeCalledWith(SomfyEvents.Up, {
      devices: ['io://1234-5678-9101/1234567'],
    });
  });
});
