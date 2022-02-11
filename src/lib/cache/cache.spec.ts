import { Cache } from './cache';

describe('Cache', () => {
  it('should return the value that was set', () => {
    // Arrange
    const cache = Cache(() => new Date().getTime(), 180);

    // Act
    cache.put('test', 'Hello World!');

    // Assert
    expect(cache.get('test')).toBe('Hello World!');
  });

  it('should fetch the value when no value is present', () => {
    // Arrange
    const cache = Cache(() => new Date().getTime(), 180);

    // Act
    const value = cache.getOrFetch('test', () => 'Hello World!');

    // Assert
    expect(value).toBe('Hello World!');
  });

  it('should cache the cache entry for a certain ttl', () => {
    // Arrange
    const nowTimeStampFn = jest
      .fn()
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => 60)
      .mockImplementationOnce(() => 181);

    const cache = Cache(nowTimeStampFn, 180);

    // Act & Assert
    cache.put('test', 'Hello World!');

    expect(cache.get('test')).toBe('Hello World!');
    expect(cache.get('test')).toBeUndefined();
  });

  it('should delete the item from cache when del is called', () => {
    // Arrange
    const nowTimeStampFn = jest.fn().mockImplementation(() => 0);

    const cache = Cache(nowTimeStampFn, 180);

    // Act
    cache.put('test', 'Hello World!');
    cache.del('test');

    // Assert
    expect(cache.get('test')).toBeUndefined();
  });

  it('should delete the cached entry when take is called', () => {
    // Arrange
    const nowTimeStampFn = jest.fn().mockImplementation(() => 0);

    const cache = Cache(nowTimeStampFn, 180);

    // Act
    cache.put('test', 'Hello World!');
    const value = cache.take('test');

    // Assert
    expect(value).toBe('Hello World!');
    expect(cache.get('test')).toBeUndefined();
  });

  it('should not call the fetch function when the cached entry is present', () => {
    // Arrange
    const nowTimeStampFn = jest.fn().mockImplementation(() => 0);

    const cache = Cache(nowTimeStampFn, 180);

    const fetchFn = jest.fn().mockImplementation(() => "I shouldn't have been called!");

    // Act
    cache.put('test', 'Hello World!');
    const value = cache.getOrFetch('test', fetchFn);

    // Assert
    expect(value).toBe('Hello World!');
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
