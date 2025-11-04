const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertRecipient = sequelize.define('AlertRecipient', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    zone_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = AlertRecipient;