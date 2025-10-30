const { Sequelize } = require('sequelize');
const logger = require('./logger');

// Configuration Sequelize pour TimescaleDB (PostgreSQL)
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'db_capteurs',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'capteurs_db',
  username: process.env.DB_USER || 'capteurs_user',
  password: process.env.DB_PASSWORD || 'capteurs_pass',
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Fonction pour tester la connexion
const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Connexion à TimescaleDB réussie!');
    return true;
  } catch (error) {
    logger.error('❌ Erreur connexion database:', error);
    return false;
  }
};

// Fonction pour synchroniser les modèles (en développement uniquement)
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: false }); // alter: false = ne modifie pas la structure existante
    logger.info('✅ Synchronisation des modèles réussie!');
  } catch (error) {
    logger.error('❌ Erreur synchronisation:', error);
  }
};

module.exports = {
  sequelize,
  connectDatabase,
  syncDatabase
};
