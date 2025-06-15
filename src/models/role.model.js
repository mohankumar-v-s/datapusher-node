const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Role',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      role_name: {
        type: DataTypes.ENUM('Admin', 'User'),
        allowNull: false,
        unique: true,
      },
    },
    {
      timestamps: true,
      tableName: 'Roles',
    }
  );
