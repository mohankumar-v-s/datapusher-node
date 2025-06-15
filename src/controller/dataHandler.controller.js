const controller = {}
const { Account, Destination } = require('../models');
const { addDataToDispatchQueue } = require('../jobs/dataDispatchQueue');
const { validate: uuidValidate } = require('uuid');
const { getCache, setCache } = require('../utils/cache');

controller.handleIncommingData = async (req, res) => {
    const appSecretToken = req.headers['cl-x-token'];
    const eventId = req.headers['cl-x-event-id'];

    // Header Validation
    if (!appSecretToken || !eventId) {
        return res.status(400).json({
            success: false,
            message: 'Invalid Data',
            errors: ['CL-X-TOKEN and CL-X-EVENT-ID headers are required.'],
        });
    }

    if (!uuidValidate(eventId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid Data',
            errors: ['CL-X-EVENT-ID header must be a valid UUID.'],
        });
    }

    // Body Validation
    if (req.body == null || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid Data',
            errors: ['Request body must be valid, non-empty JSON.'],
        });
    }

    try {
        // app_secret_token in db (with caching)
        const cacheKey = `account_token:${appSecretToken}`;
        let accountJson = await getCache(cacheKey);
        let account;

        if (accountJson) {
            account = accountJson;
            console.log(`Account PK ${account.id} for token ${appSecretToken} found in cache.`);
        } else {
            const accountInstance = await Account.findOne({ where: { app_secret_token: appSecretToken } });
            if (accountInstance) {
                account = accountInstance.toJSON();
                await setCache(cacheKey, account, 600);
                console.log(`Account PK ${account.id} for token ${appSecretToken} fetched from DB and cached.`);
            }
        }

        if (!account) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Use findAll destinations By AccountId
        const destinations = await Destination.findAll({
            where: { account_id: account.id }
        });

        if (!destinations || destinations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No destinations found for the account.'
            });
        }

        const receivedTimestamp = new Date();

        // Add Job Queue Data
        const jobData = {
            eventId: eventId,
            accountId: account.id,
            destinationId: destinations[0].id,
            incomingData: req.body,
            receivedTimestamp: receivedTimestamp.toISOString()
        };

        await addDataToDispatchQueue(jobData);

        return res.status(202).json({ success: true, message: 'Data Received' });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed To Handle Incomming Data',
            error: error.message
        });
    }
};

module.exports = controller