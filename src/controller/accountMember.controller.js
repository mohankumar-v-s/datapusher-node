const { AccountMember, User, Role, } = require('../models');
const controller = {}

controller.addMemberToAccount = async (req, res) => {
  const account_id = req.params.accountId;
  const { email, role_name } = req.body;

  try {
    const userIsExist = await User.findOne({ where: { email } });
    if (!userIsExist) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const roleToAssign = await Role.findOne({ where: { role_name } });
    if (!roleToAssign) {
      return res.status(404).json({ message: `Role '${role_name}' not found.` });
    }
    const existingMember = await AccountMember.findOne({
      where: {
        account_id: account_id,
        user_id: userIsExist.id,
      },
    });

    if (existingMember) {
      return res.status(409).json({ success: false, message: 'User is already a member of this account.' });
    }

    const newMember = await AccountMember.create({
      account_id: account_id,
      user_id: userIsExist.id,
      role_id: roleToAssign.id,
      created_by: req.user.id,
      updated_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'User added to account successfully.',
      data: {
        id: newMember.id,
        account_id: newMember.account_id,
        user_id: newMember.user_id,
        email: userIsExist.email,
        role_id: newMember.role_id,
        role_name: roleToAssign.role_name,
        createdAt: newMember.createdAt,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to Add Member',
      error: error.message
    });
  }
}

controller.listAllAccountMembers = async (req, res) => {
  try {
    const account_id = req.params.accountId;
    const { limit = 10, offset = 0 } = req.query;
    const { count, rows: members } = await AccountMember.findAndCountAll({
      where: { account_id: account_id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email']
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'role_name']
        },
      ],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'ASC']],
    });

    const formattedMembers = members.map(m => ({
      id: m.id,
      user_id: m.user.id,
      email: m.user.email,
      role_id: m.role.id,
      role_name: m.role.role_name,
      joined_at: m.createdAt,
    }));

    res.status(200).json({
      success: true,
      message: "All Members Fetched Successfully",
      data: {
        members: formattedMembers,
        pagination: {
          total: count,
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
          pages: Math.ceil(count / limit),
        },
      }
    });
  } catch (error) {
    console.error('List account members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to List Member',
      error: error.message
    });
  }
}

controller.listMemberById = async (req, res) => {
  try {
    const account_id = req.params.accountId;
    const memberUserId = parseInt(req.params.memberUserId, 10);
    if (isNaN(memberUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid member User ID format.' });
    }

    const member = await AccountMember.findOne({
      where: { account_id: account_id, user_id: memberUserId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email']
        },
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'role_name']
        },
      ],
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in this account.' });
    }

    res.status(200).json({
      success: true,
      message: "Member By Id Fetched Successfully",
      data: member
    });
  } catch (error) {
    console.error('List member by id error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get member',
      error: error.message
    });
  }
}

controller.updateMemberRole = async (req, res) => {
  try {
    const account_id = req.params.accountId;
    const memberUserId = parseInt(req.params.memberUserId, 10);
    if (isNaN(memberUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid member User ID format.' });
    }

    const { role_name } = req.body;

    const roleToAssign = await Role.findOne({ where: { role_name } });
    if (!roleToAssign) {
      return res.status(404).json({ message: `Role '${role_name}' not found.` });
    }

    const member = await AccountMember.findOne({
      where: {
        account_id: account_id,
        user_id: memberUserId,
      },
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Account member not found.' });
    }

    if (
      memberUserId === req.user.id &&
      role_name !== 'Admin'
    ) {
      const adminRole = await Role.findOne({ where: { role_name: 'Admin' } });
      const adminCount = await AccountMember.count({
        where: { account_id: account_id, role_id: adminRole.id }
      });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot change the role of the last admin.' });
      }
    }

    member.role_id = roleToAssign.id;
    member.updated_by = req.user.id;
    console.log(member.dataValues.updated_by, "hi")
    await member.save();

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully.',
      member: {
        id: member.id,
        account_id: member.account_id,
        user_id: member.user_id,
        role_id: member.role_id,
        role_name: roleToAssign.role_name,
        updatedAt: member.updatedAt,
      },
    });


  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed To Update Member',
      error: error.message
    });
  }
}

controller.removeMemberFromAccount = async (req, res) => {
  try {
    const account_id = req.params.accountId;
    const memberUserId = parseInt(req.params.memberUserId, 10);
    if (isNaN(memberUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid member User ID format.' });
    }

    const adminRole = await Role.findOne({ where: { role_name: 'Admin' } });
    if (!adminRole) {
      res.status(500).json({
        success: false,
        message: 'Admin role not found',
        error: error.message
      });
    }

    const memberToRemove = await AccountMember.findOne({
      where: { account_id: account_id, user_id: memberUserId }
    });

    if (!memberToRemove) {
      return res.status(404).json({ success: false, message: 'Member not found in this account.' });
    }

    // Prevent removing the last admin
    if (memberToRemove.role_id === adminRole.id) {
      const adminCount = await AccountMember.count({
        where: { account_id: account_id, role_id: adminRole.id }
      });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot remove the last admin from the account.' });
      }
    }

    await memberToRemove.destroy();

    res.status(200).json({ success: true, message: 'Member removed from account successfully.' });

  } catch (error) {
    console.error('Remove member from account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed To Remove Member',
      error: error.message
    });
  }
}

module.exports = controller