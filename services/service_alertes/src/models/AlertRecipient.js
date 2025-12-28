const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertRecipient = sequelize.define('AlertRecipient', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    name: {
        type: DataTypes.STRING(100),
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
        defaultValue: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'alert_recipients',
    timestamps: false,
    freezeTableName: true
});

module.exports = AlertRecipient;