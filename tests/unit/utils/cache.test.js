const { getCache, setCache, delCache, delCacheByPattern } = require('../../../src/utils/cache');

// Mock Redis client
jest.mock('ioredis', () => {
  const RedisMock = require('ioredis-mock');
  return jest.fn().mockImplementation(() => {
    const mock = new RedisMock();
    mock.status = 'ready';
    return mock;
  });
});

describe('Cache Utilities', () => {
  let mockRedis;
  let originalConsoleError;

  beforeEach(() => {
    const Redis = require('ioredis-mock');
    mockRedis = new Redis();
    mockRedis.status = 'ready';
    jest.clearAllMocks();
    originalConsoleError = console.error;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('getCache', () => {
    it('should return null for non-existent key', async () => {
      const result = await getCache('non-existent-key');
      expect(result).toBeNull();
    });

    it('should return parsed data for existing key', async () => {
      const testData = { test: 'data' };
      await mockRedis.set('test-key', JSON.stringify(testData));
      
      const result = await getCache('test-key');
      expect(result).toEqual(testData);
    });

    it('should handle invalid JSON data', async () => {
      console.error = jest.fn(); // Mock console.error
      await mockRedis.set('invalid-key', 'invalid-json');
      
      const result = await getCache('invalid-key');
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('setCache', () => {
    it('should successfully set cache with data', async () => {
      const testData = { test: 'data' };
      const result = await setCache('test-key', testData);
      
      expect(result).toBe('OK');
      const storedData = await mockRedis.get('test-key');
      expect(JSON.parse(storedData)).toEqual(testData);
    });

    it('should set cache with custom expiration', async () => {
      const testData = { test: 'data' };
      const customExpiration = 60; // 1 minute
      
      await setCache('test-key', testData, customExpiration);
      
      const ttl = await mockRedis.ttl('test-key');
      expect(ttl).toBeLessThanOrEqual(customExpiration);
      expect(ttl).toBeGreaterThan(0);
    });
  });

  describe('delCache', () => {
    it('should delete existing key', async () => {
      await mockRedis.set('test-key', 'test-value');
      
      const result = await delCache('test-key');
      expect(result).toBe(1);
      
      const exists = await mockRedis.exists('test-key');
      expect(exists).toBe(0);
    });

    it('should return 0 for non-existent key', async () => {
      const result = await delCache('non-existent-key');
      expect(result).toBe(0);
    });
  });

  describe('delCacheByPattern', () => {
    it('should delete all keys matching pattern', async () => {
      // Set up test data
      await mockRedis.set('test:1', 'value1');
      await mockRedis.set('test:2', 'value2');
      await mockRedis.set('other:1', 'value3');
      
      const result = await delCacheByPattern('test:*');
      expect(result).toBe(2);
      
      const test1Exists = await mockRedis.exists('test:1');
      const test2Exists = await mockRedis.exists('test:2');
      const other1Exists = await mockRedis.exists('other:1');
      
      expect(test1Exists).toBe(0);
      expect(test2Exists).toBe(0);
      expect(other1Exists).toBe(1);
    });

    it('should return 0 when no keys match pattern', async () => {
      const result = await delCacheByPattern('nonexistent:*');
      expect(result).toBe(0);
    });
  });
}); 