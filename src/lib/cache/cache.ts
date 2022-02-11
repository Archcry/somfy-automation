interface CacheEntry<T> {
  name: string;
  data: T;
  expires: number;
}

interface CacheLookup {
  [key: string]: CacheEntry<unknown>;
}

export const Cache = (nowTimeStampFn: () => number, ttl: number) => {
  const cacheLookup: CacheLookup = {};

  const put = <T>(name: string, data: T): T => {
    const expires = nowTimeStampFn() + ttl;

    cacheLookup[name] = {
      expires,
      name,
      data,
    };

    return data;
  };

  const get = <T>(name: string): T | undefined => {
    const entry = cacheLookup[name];

    if (!isExpired(entry)) {
      return entry.data as T;
    }
  };

  const take = <T>(name: string): T | undefined => {
    if (cacheLookup[name]) {
      cacheLookup[name] = {
        ...cacheLookup[name],
        expires: nowTimeStampFn(),
      };

      return cacheLookup[name].data as T;
    }
  };

  const del = (name: string) => {
    if (cacheLookup[name]) {
      cacheLookup[name] = {
        ...cacheLookup[name],
        expires: nowTimeStampFn(),
      };
    }
  };

  const isExpired = <T>(entry: CacheEntry<T>) => {
    return entry.expires <= nowTimeStampFn();
  };

  const getOrFetch = <T>(name: string, fetchFn: () => T): T => {
    if (cacheLookup[name]) {
      return cacheLookup[name].data as T;
    }

    return put<T>(name, fetchFn());
  };

  return {
    put,
    get,
    take,
    del,
    getOrFetch,
  };
};
