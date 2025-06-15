// src/jobs/dataDispatchQueue.js
const Queue = require('bull');
const { redisOptions } = require('../config/redis');

const DATA_DISPATCH_QUEUE_NAME = 'data-dispatch';
const dataDispatchQueue = new Queue(DATA_DISPATCH_QUEUE_NAME, { redis: redisOptions });

const addDataToDispatchQueue = async (jobData) => {
  try {
    await dataDispatchQueue.add(jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
      removeOnComplete: true,
      removeOnFail: 500
    });
    console.log(`Job added to ${DATA_DISPATCH_QUEUE_NAME} queue with eventId: ${jobData.eventId}`);
  } catch (error) {
    console.error(`Error adding job to ${DATA_DISPATCH_QUEUE_NAME}:`, error);
    throw error;
  }
};

module.exports = {
  DATA_DISPATCH_QUEUE_NAME,
  dataDispatchQueue,
  addDataToDispatchQueue,
};
