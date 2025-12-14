const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alert = sequelize.define('Alert', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    alert_id: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
    },
    prediction_id: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    zone_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false
    },
    zone_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false
    },
    alert_data: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    severity: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'medium'
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    sent_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'alerts',
    timestamps: false,
    freezeTableName: true
});

module.exports = Alert;