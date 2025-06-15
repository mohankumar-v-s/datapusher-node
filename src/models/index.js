const { Sequelize } = require('sequelize');
const path = require('path');

const isTest = process.env.NODE_ENV === 'test';
const dbPath = isTest ? ':memory:' : path.join(__dirname, '../../database.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: !isTest
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database: ", error);
  });

const Account = require('./account.model')(sequelize);
const User = require('./user.model')(sequelize);
const Role = require('./role.model')(sequelize);
const AccountMember = require('./accountMember.model')(sequelize);
const Destination = require('./destination.model')(sequelize);
const Log = require('./log.model')(sequelize);

// AccountMember relationships
AccountMember.belongsTo(Account, { foreignKey: 'account_id', targetKey: 'id', as: 'account' });
Account.hasMany(AccountMember, { foreignKey: 'account_id', sourceKey: 'id', as: 'members' });

AccountMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(AccountMember, { foreignKey: 'user_id', as: 'accountMemberships' });

AccountMember.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(AccountMember, { foreignKey: 'role_id', as: 'accountMembers' });

// Destination relationships
Destination.belongsTo(Account, { foreignKey: 'account_id', targetKey: 'id', as: 'account' });
Account.hasMany(Destination, { foreignKey: 'account_id', sourceKey: 'id', as: 'destinations' });

// Log relationships
Log.belongsTo(Account, { foreignKey: 'account_id', targetKey: 'id', as: 'account' });
Account.hasMany(Log, { foreignKey: 'account_id', sourceKey: 'id', as: 'logs' });

Log.belongsTo(Destination, { foreignKey: 'destination_id', as: 'destination' });
Destination.hasMany(Log, { foreignKey: 'destination_id', as: 'logs' });

module.exports = { sequelize, Account, Destination, AccountMember, User, Log, Role };

