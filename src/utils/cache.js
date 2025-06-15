// src/utils/cache.js
const Redis = require('ioredis');
const { redisOptions } = require('../config/redis');

let cacheClient;
let connectionAttempted = false;

const getCacheClient = () => {
  if (!connectionAttempted && (!cacheClient || !cacheClient.status || cacheClient.status === 'end')) {
    connectionAttempted = true;
    console.log('Attempting to connect to Redis cache client...');
    const newClient = new Redis(redisOptions);

    newClient.on('connect', () => {
      console.log('Redis cache client connected successfully.');
      cacheClient = newClient;
      connectionAttempted = false;
    });

    newClient.on('error', (err) => {
      console.error('Redis cache client connection error:', err.message);
      cacheClient = null;
      connectionAttempted = false;
    });

    newClient.on('end', () => {
      console.log('Redis cache client connection ended.');
      cacheClient = null;
    });
    cacheClient = newClient;
  } else if (cacheClient && cacheClient.status === 'connecting' || cacheClient.status === 'reconnecting') {
    console.log(`Redis cache client is currently ${cacheClient.status}. Waiting for connection.`);
  }
  return cacheClient;
};

if (process.env.NODE_ENV !== 'test') {
  getCacheClient();
}


const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

const getCache = async (key) => {
  const client = getCacheClient();
  if (!client || client.status !== 'ready') {
    console.warn('Redis cache not ready, skipping getCache for key:', key);
    return null;
  }
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  }
};

const setCache = async (key, value, expiration = DEFAULT_EXPIRATION) => {
  const client = getCacheClient();
  if (!client || client.status !== 'ready') {
    console.warn('Redis cache not ready, skipping setCache for key:', key);
    return null;
  }
  try {
    return await client.setex(key, expiration, JSON.stringify(value));
  } catch (error) {
    console.error('Redis setCache error:', error);
    return null;
  }
};

const delCache = async (key) => {
  const client = getCacheClient();
  if (!client || client.status !== 'ready') {
    console.warn('Redis cache not ready, skipping delCache for key:', key);
    return null;
  }
  try {
    return await client.del(key);
  } catch (error) {
    console.error('Redis delCache error:', error);
    return null;
  }
};

const delCacheByPattern = async (pattern) => {
  const client = getCacheClient();
  if (!client || client.status !== 'ready') {
    console.warn('Redis cache not ready, skipping delCacheByPattern for pattern:', pattern);
    return 0;
  }

  let cursor = '0';
  let keysDeleted = 0;
  const BATCH_SIZE = '100';

  try {
    do {
      const scanResult = await client.scan(cursor, 'MATCH', pattern, 'COUNT', BATCH_SIZE);
      cursor = scanResult[0];
      const keys = scanResult[1];

      if (keys.length > 0) {
        await client.del(keys);
        keysDeleted += keys.length;
      }
    } while (cursor !== '0');

    console.log(`Deleted ${keysDeleted} keys matching pattern: ${pattern}`);
    return keysDeleted;
  } catch (error) {
    console.error('Redis delCacheByPattern error:', error);
    return 0;
  }
};

module.exports = {
  getCache,
  setCache,
  delCache,
  delCacheByPattern,
  getCacheClient,
};
