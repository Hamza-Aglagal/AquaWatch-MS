const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertRecipient = sequelize.define('AlertRecipient', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    zone_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
    },
    zone_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
    },
    alert_radius_km: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'alert_recipients',
    underscored: true,
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = AlertRecipient;