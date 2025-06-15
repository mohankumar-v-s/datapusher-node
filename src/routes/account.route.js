const router = require('express').Router();
const accountController = require('../controller/account.controller');
const { authenticate, authorizeRole } = require('../middleware/auth.middleware');
const destinationRoutes = require('./destination.route')
const accountMembersRoutes = require('./accountMember.route')
const logRoutes = require('./log.route')

// Create Account
router.post('/', authenticate, accountController.createAccount);

// Read All Accounts
router.get('/', authenticate, accountController.getAllAccount);

// Read Account by ID
router.get('/:accountId', authenticate, authorizeRole(['Admin', 'User']), accountController.getAccountById);

// Update Account
router.put('/:accountId', authenticate, authorizeRole(['Admin', 'User']), accountController.updateAccount);

// Delete Account (cascade delete Destinations)
router.delete('/:accountId', authenticate, accountController.deleteAccount);

router.use(
  '/:accountId/destinations',
  authenticate,
  destinationRoutes
);

router.use(
  '/:accountId/members',
  authenticate,
  accountMembersRoutes
);

router.use(
  '/:accountId/logs',
  authenticate,
  logRoutes
);


module.exports = router;
