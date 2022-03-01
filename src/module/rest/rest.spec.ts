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

  it('should register the correct handlers', () => {
    // Arrange
    const expectedEndpoints = {
      post: ['/shutter/up', '/shutter/down', '/shutter/wink', '/shutter/identify', '/shutter/stop', '/shutter/my'],
      get: ['/', '/shutter/deviceGroups', '/shutter/schedules'],
    };

    // Act
    Rest({
      schedules: [],
      deviceGroups: [],
      users: {},
      eventAggregator,
      app,
    }).start();

    // Assert
    expect(app.get).toBeCalledTimes(expectedEndpoints.get.length);
    expectedEndpoints.get.forEach((endpoint) => expect(app.get).toBeCalledWith(endpoint, expect.any(Function)));

    expect(app.post).toBeCalledTimes(expectedEndpoints.post.length);
    expectedEndpoints.post.forEach((endpoint) => expect(app.post).toBeCalledWith(endpoint, expect.any(Function)));

    expect(app.use).toBeCalledTimes(2);
  });

  it('should return "hello world!" on "/"', () => {
    // Arange
    Rest({
      schedules: [],
      deviceGroups: [],
      users: {},
      eventAggregator,
      app,
    }).start();

    const rootEndpoint = getEndpointMethods(app).get['/'];
    const resHandler = { send: jest.fn() };

    // Act
    rootEndpoint({}, resHandler);

    // Assert
    expect(resHandler.send).toBeCalledTimes(1);
    expect(resHandler.send).toBeCalledWith('Hello World!');
  });

  it('should return the schedules on GET /shutter/schedules', () => {
    // Arrange
    const schedules: FixedTimeSchedule[] = [
      {
        type: 'fixed_time',
        dow: ['mon'],
        deviceGroups: ['fbd0dbbe-9998-11ec-b909-0242ac120002'],
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
      deviceGroups: [],
      users: {},
      eventAggregator,
      app,
    }).start();

    const schedulesEndpoint = getEndpointMethods(app).get['/shutter/schedules'];
    const res = { send: jest.fn() };

    // Act
    schedulesEndpoint({}, res);

    // Assert
    expect(res.send).toBeCalledTimes(1);
    expect(res.send).toBeCalledWith(schedules);
  });

  it('should return the deviceGroups on GET /shutter/deviceGroups', () => {
    // Arrange
    const devices = ['5fbc547c-7e92-445a-bb6a-71fb8ef65e62'];

    Rest({
      schedules: [],
      deviceGroups: [
        {
          uid: 'fbd0dbbe-9998-11ec-b909-0242ac120002',
          devices: devices.map((device) => Buffer.from(device, 'utf8').toString('base64')),
          name: 'test',
        },
      ],
      users: {},
      eventAggregator,
      app,
    }).start();

    const deviceGroupsEndpoint = getEndpointMethods(app).get['/shutter/deviceGroups'];
    const res = { send: jest.fn() };

    // Act
    deviceGroupsEndpoint({}, res);

    // Assert
    expect(res.send).toBeCalledTimes(1);
    expect(res.send).toBeCalledWith([
      {
        uid: 'fbd0dbbe-9998-11ec-b909-0242ac120002',
        name: 'test',
      },
    ]);
  });

  it('should fire an event on all post handlers', () => {
    // Arrange
    const devices = ['5fbc547c-7e92-445a-bb6a-71fb8ef65e62'];

    Rest({
      schedules: [],
      deviceGroups: [
        {
          uid: 'fbd0dbbe-9998-11ec-b909-0242ac120002',
          devices: devices.map((device) => Buffer.from(device, 'utf8').toString('base64')),
          name: 'test',
        },
      ],
      users: {},
      eventAggregator,
      app,
    }).start();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postEndpoints: { [key: string]: any } = getEndpointMethods(app).post;

    // Act & Assert
    Object.entries(postEndpoints).forEach(([url, endpoint]) => {
      const req = { body: { deviceGroups: ['fbd0dbbe-9998-11ec-b909-0242ac120002'] } };
      const res = { send: jest.fn() };

      endpoint(req, res);

      expect(res.send).toBeCalledTimes(1);
      expect(res.send).toBeCalledWith('ok');

      expect(eventAggregator.publish).toBeCalledWith(endpointToSomfyEventMap[url], {
        devices: devices,
      });
    });
  });
});
