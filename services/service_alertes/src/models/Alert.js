const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alert = sequelize.define('Alert', {
    alert_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    prediction_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    zone_latitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    zone_longitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed'),
        defaultValue: 'pending'
    },
    score_qualite: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
});

module.exports = Alert;