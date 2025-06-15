// src/config/redis.js
require('dotenv').config();

const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  username:"default",
  password: process.env.REDIS_PASSWORD
};

module.exports = { redisOptions };
