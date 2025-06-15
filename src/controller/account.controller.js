const { Account, AccountMember, sequelize } = require('../models');
const { accountSchema, accountUpdateSchema } = require('../utils/validationSchema');
const controller = {}

controller.createAccount = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        if (!req.user?.userId) {
            console.log('User ID missing:', req.user);
            return res.status(401).json({ success: false, message: 'User ID is required' });
        }

        const { error, value } = accountSchema.validate(req.body);
        if (error) {
            console.log('Validation error:', error.details);
            return res.status(400).json({ success: false, message: 'Validation error', details: error.details[0].message });
        }
        const { account_name, website } = value;

        console.log('Creating account with data:', {
            account_name,
            website,
            created_by: req.user.userId,
            updated_by: req.user.userId
        });

        const account = await Account.create({
            account_name,
            website,
            created_by: req.user.userId,
            updated_by: req.user.userId
        }, { transaction: t });

        console.log('Account created:', account.toJSON());

        const accountMembers = await AccountMember.create({
            account_id: account.id,
            user_id: req.user.userId,
            role_id: 1, // Default Admin
            created_by: req.user.userId,
            updated_by: req.user.userId
        }, { transaction: t });

        console.log('Account member created:', accountMembers.toJSON());

        await t.commit();

        res.json({
            success: true,
            message: "Account Created Successfully",
            data: { account, accountMembers }
        });
    } catch (error) {
        await t.rollback();
        console.error('Account creation error:', error);
        console.error('Error stack:', error.stack);
        res.status(400).json({ success: false, error: error.message });
    }
}

controller.getAllAccount = async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({ success: false, message: 'User ID is required' });
        }

        const accounts = await Account.findAll({
            include: [{
                model: AccountMember,
                as: 'members',
                required: false,
                where: { user_id: req.user.userId }
            }],
            attributes: { exclude: ['app_secret_token'] }
        });

        res.json({
            success: true,
            message: "Get All Accounts",
            data: accounts
        });
    } catch (error) {
        console.error('Error getting accounts:', error);
        res.status(500).json({ success: false, message: 'Error Getting All Accounts', error: error.message });
    }
}

controller.getAccountById = async (req, res) => {
    try {
        const account = await Account.findByPk(req.params.accountId);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        res.json({
            success: true,
            message: "Fetched Account Successfully",
            data: account
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error Getting Account By Id', error: error.message });
    }
}

controller.updateAccount = async (req, res) => {
    try {
        const account = await Account.findByPk(req.params.accountId);
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        const { error, value } = accountUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: 'Validation error', details: error.details[0].message });
        }

        await account.update(value);
        res.json({
            success: true,
            message: "Updated Account By Id",
            data: account
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error Updating Accounts', error: error.message });
    }
}

controller.deleteAccount = async (req, res) => {
    try {
        const account = await Account.findByPk(req.params.accountId);

        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }

        await AccountMember.destroy({
            where: {
                account_id: req.params.accountId
            }
        });

        await account.destroy();
        res.json({ success: true, message: 'Account and related members deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error Deleting Accounts', error: error.message });
    }
}


module.exports = controller