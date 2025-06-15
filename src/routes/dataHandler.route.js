const express = require('express');
const controller = require('../controller/dataHandler.controller');
const { incomingDataRateLimiter } = require('../middleware/ratelimit.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post(
  '/incoming_data',
  authenticate,
  incomingDataRateLimiter,
  controller.handleIncommingData
);

module.exports = router;
