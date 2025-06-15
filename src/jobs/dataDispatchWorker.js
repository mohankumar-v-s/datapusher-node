const { dataDispatchQueue } = require('./dataDispatchQueue');
const { Log, Destination, Account, sequelize } = require('../models');
const axios = require('axios');
const { validate: uuidValidate } = require('uuid');

dataDispatchQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} (Event: ${job.data.eventId}) failed with error: ${err.message}`, err.stack);
});

dataDispatchQueue.on('completed', (job) => {
  console.log(`Job ${job.id} (Event: ${job.data.eventId}) completed successfully.`);
});

dataDispatchQueue.on('error', (error) => {
  console.error('Bull queue encountered an error:', error);
});


dataDispatchQueue.process(async (job) => {
  const { eventId, accountId, destinationId, incomingData, receivedTimestamp } = job.data;
  console.log(`Processing job ${job.id} for event ${eventId}, account PK ${accountId}`);

  // Start transaction
  const transaction = await sequelize.transaction();

  try {
    // UUID Validation
    if (!uuidValidate(eventId)) {
      await createOrUpdateLog({
        event_id: 'INVALID_' + job.id,
        account_id: accountId,
        destination_id: null,
        status: 'invalid_event_id',
        response_details: { error: 'Invalid event ID format' },
        incomingData,
        receivedTimestamp,
        job,
        transaction
      });
      await transaction.commit();
      return Promise.resolve();
    }

    const account = await Account.findByPk(accountId, { transaction });
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const destinations = destinationId
      ? await Destination.findAll({
        where: { account_id: accountId, id: destinationId },
        transaction
      })
      : await Destination.findAll({
        where: { account_id: accountId },
        transaction
      });

    if (destinations.length === 0) {
      await createOrUpdateLog({
        event_id: eventId,
        account_id: accountId,
        destination_id: null,
        status: 'no_destinations',
        response_details: { error: 'No destinations configured for account' },
        incomingData,
        receivedTimestamp,
        job,
        transaction
      });
      await transaction.commit();
      return Promise.resolve();
    }

    let allDispatchesSuccessful = true;

    for (const dest of destinations) {
      const processedTimestamp = new Date();
      let statusLog = 'failed';
      let responseDetails = null;

      try {
        let requestHeaders = {};
        if (dest.headers) {
          try {
            requestHeaders = typeof dest.headers === 'string'
              ? JSON.parse(dest.headers)
              : dest.headers;
          } catch (parseError) {
            await createOrUpdateLog({
              event_id: eventId,
              account_id: accountId,
              destination_id: dest.id,
              status: 'header_parse_error',
              response_details: { error: 'Header parsing failed', message: parseError.message },
              incomingData,
              receivedTimestamp,
              job,
              transaction
            });
            allDispatchesSuccessful = false;
            continue;
          }
        }

        // Validate HTTP method
        const method = (dest.http_method || 'POST').toUpperCase();
        if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          throw new Error(`Invalid HTTP method: ${method}`);
        }

        const response = await axios({
          method,
          url: dest.url,
          headers: requestHeaders,
          data: incomingData,
          timeout: 15000,
          maxContentLength: 10 * 1024 * 1024, // 10MB limit
        });

        statusLog = 'success';
        responseDetails = {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        allDispatchesSuccessful = false;
        statusLog = axios.isAxiosError(error) ? `failed_${error.code}` : 'failed_unknown';
        responseDetails = {
          error: true,
          message: error.message,
          code: axios.isAxiosError(error) ? error.code : 'UNKNOWN_ERROR',
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          timestamp: new Date().toISOString()
        };
      }

      await createOrUpdateLog({
        event_id: eventId,
        account_id: accountId,
        destination_id: dest.id,
        status: statusLog,
        response_details: responseDetails,
        incomingData,
        receivedTimestamp,
        processedTimestamp,
        job,
        transaction
      });
    }

    if (!allDispatchesSuccessful) {
      await transaction.rollback();
      throw new Error(`Job ${job.id} (Event: ${eventId}): One or more dispatches failed. Job will be retried.`);
    }

    await transaction.commit();
    return Promise.resolve();

  } catch (error) {
    await transaction.rollback();
    console.error(`Job ${job.id} (Event: ${eventId}) failed with error:`, error);
    throw error;
  }
});

async function createOrUpdateLog({
  event_id,
  account_id,
  destination_id,
  status,
  response_details,
  incomingData,
  receivedTimestamp,
  processedTimestamp = new Date(),
  job,
  transaction
}) {
  const existingLog = await Log.findOne({
    where: {
      event_id,
      account_id,
      destination_id
    },
    transaction
  });

  if (existingLog) {
    await existingLog.update({
      processed_timestamp: processedTimestamp,
      status,
      response_details,
      retry_count: job.attemptsMade
    }, { transaction });
  } else {
    await Log.create({
      event_id,
      account_id,
      destination_id,
      received_timestamp: new Date(receivedTimestamp),
      processed_timestamp: processedTimestamp,
      received_data: incomingData,
      status,
      response_details,
      retry_count: job.attemptsMade
    }, { transaction });
  }
}

if (process.env.NODE_ENV !== 'test') {
  console.log('Data dispatch worker started listening for jobs on queue: ' + dataDispatchQueue.name);
}

module.exports = {
  dataDispatchQueue
};
