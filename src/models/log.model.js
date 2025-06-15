const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Log',
    {
      event_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Accounts',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      destination_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Destinations',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      received_timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      processed_timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      received_data: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'success',
          'failed',
          'failed_ECONNREFUSED',
          'failed_ETIMEDOUT',
          'failed_unknown',
          'header_parse_error',
          'no_destinations',
          'invalid_event_id'
        ),
        allowNull: false,
      },
      response_details: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      retry_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      }
    },
    {
      timestamps: true,
      tableName: 'Logs',
      indexes: [
        {
          fields: ['account_id']
        },
        {
          fields: ['destination_id']
        },
        {
          fields: ['received_timestamp']
        },
        {
          fields: ['status']
        }
      ]
    }
  );
