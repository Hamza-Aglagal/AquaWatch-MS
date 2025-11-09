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

// Fonction pour tester la connexion avec retry
const connectDatabase = async (maxRetries = 5, retryDelay = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      logger.info('✅ Connexion à TimescaleDB réussie!');
      return true;
    } catch (error) {
      logger.warn(`⚠️ Tentative ${attempt}/${maxRetries} échouée: ${error.message}`);
      if (attempt === maxRetries) {
        logger.error('❌ Impossible de se connecter à la database après plusieurs tentatives');
        return false;
      }
      logger.info(`⏳ Nouvelle tentative dans ${retryDelay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  return false;
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
