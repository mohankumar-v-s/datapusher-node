const jwt = require('jsonwebtoken');
const { Account, AccountMember, Role } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    console.log('Verifying token with secret:', process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    console.error('Error stack:', error.stack);
    res.status(401).json({ success: false, message: 'Invalid token', error: error.message });
  }
};

const authorizeRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Check for authentication
      if (!req.user?.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const userId = req.user.userId;
      const accountId = req.params.accountId;

      console.log('Checking authorization for:', { userId, accountId, allowedRoles });

      // Validate accountId
      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: 'Account ID is required.'
        });
      }

      // First check if account exists
      const account = await Account.findByPk(accountId);
      if (!account) {
        console.log('Account not found:', accountId);
        return res.status(404).json({
          success: false,
          message: 'Account not found.'
        });
      }

      // Then check membership
      const accountMember = await AccountMember.findOne({
        where: {
          user_id: userId,
          account_id: accountId
        },
        include: [
          {
            model: Role,
            as: 'role',
            required: true,
            attributes: ['role_name']
          }
        ]
      });

      console.log('Account member check result:', accountMember ? {
        userId: accountMember.user_id,
        accountId: accountMember.account_id,
        roleId: accountMember.role_id,
        roleName: accountMember?.role?.role_name
      } : 'No membership found');

      // Check if user is a member of the account
      if (!accountMember) {
        return res.status(403).json({
          success: false,
          message: 'User is not a member of this account.'
        });
      }

      // Check if user has a valid role
      if (!accountMember?.role?.role_name) {
        return res.status(403).json({
          success: false,
          message: 'User role is undefined.'
        });
      }

      const userRoleName = accountMember.role.role_name;

      // Check if user's role is allowed
      if (!allowedRoles.includes(userRoleName)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }

      // Add resolved data to request object
      req.resolvedAccount = account;
      req.accountMembership = {
        accountId: accountMember.account_id,
        userId: accountMember.user_id,
        roleId: accountMember.role_id,
        roleName: userRoleName
      };

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authorization.',
        error: error.message
      });
    }
  };
};

module.exports = { authorizeRole, authenticate }