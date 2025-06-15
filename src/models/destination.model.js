const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('Destination', {
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Accounts',
        key: 'id'
      }
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    method: {
      type: DataTypes.ENUM('GET', 'POST', 'PUT'),
      allowNull: false,
      validate: {
        isIn: [['GET', 'POST', 'PUT']]
      }
    },
    headers: {
      type: DataTypes.JSON,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
  });
