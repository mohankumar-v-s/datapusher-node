const router = require('express').Router({ mergeParams: true });
const controller = require('../controller/accountMember.controller');
const { authorizeRole } = require('../middleware/auth.middleware');

// Add Member To Account
router.post('/', authorizeRole(['Admin']), controller.addMemberToAccount);

router.get(
  '/',
  authorizeRole(['Admin']),
  controller.listAllAccountMembers
);

router.get(
  '/:memberUserId',
  authorizeRole(['Admin', 'User']),
  controller.listMemberById
);

router.put(
  '/:memberUserId',
  authorizeRole(['Admin']),
  controller.updateMemberRole
);

router.delete(
  '/:memberUserId',
  authorizeRole(['Admin']),
  controller.removeMemberFromAccount
);


module.exports = router