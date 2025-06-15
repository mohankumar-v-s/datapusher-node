const router = require('express').Router({ mergeParams: true });
const controller = require('../controller/log.controller');
const { authenticate, authorizeRole } = require('../middleware/auth.middleware');

// Get all logs for an account
router.get(
    '/',
    authenticate,
    authorizeRole(['Admin']),
    controller.getLogs
);

// Get specific log by event ID
router.get(
    '/:eventId',
    authenticate,
    authorizeRole(['Admin', 'User']),
    controller.getLogById
);

module.exports = router;