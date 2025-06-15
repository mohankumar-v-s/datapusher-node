const router = require('express').Router({ mergeParams: true });
const controller = require('../controller/destination.controller');
const { authorizeRole } = require('../middleware/auth.middleware');

// Create Destination
router.post('/', authorizeRole(['Admin']), controller.createDestination);

// Get All Destinations For The Account
router.get('/', authorizeRole(['Admin']), controller.getAllDestination);

// Get Destination by Id
router.get('/:id', authorizeRole(['Admin', 'User']), controller.getDestinationByID);

// Update Destination
router.put('/:id', authorizeRole(['Admin', 'User']), controller.updateDestinationById);

// Delete Destination
router.delete('/:id', authorizeRole(['Admin']), controller.deleteDestinationById);

module.exports = router;
