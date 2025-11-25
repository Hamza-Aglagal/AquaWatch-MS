const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'aquawatch_geo',
    process.env.DB_USER || 'aquawatch_user',
    process.env.DB_PASSWORD || 'AquaWatch2024!',
    {
        host: process.env.DB_HOST || 'db_geo',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;

