const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const Account = (sequelize) => {
    const AccountModel = sequelize.define('Account', {
        account_id: {
            type: DataTypes.STRING,
            defaultValue: uuidv4,
            unique: true
        },
        account_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        app_secret_token: {
            type: DataTypes.STRING,
            defaultValue: uuidv4
        },
        website: {
            type: DataTypes.STRING
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

    AccountModel.associate = (models) => {
        AccountModel.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });
        AccountModel.belongsTo(models.User, {
            foreignKey: 'updated_by',
            as: 'updater'
        });
    };

    return AccountModel;
};

module.exports = Account;