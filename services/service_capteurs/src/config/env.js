const logger = require('./logger');

/**
 * Validate required environment variables at startup
 */
function validateEnv() {
  const required = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('❌ Variables d\'environnement manquantes:', missing);
    logger.error('💡 Vérifiez votre fichier .env');
    process.exit(1);
  }

  // Warn about optional but recommended vars
  if (!process.env.MQTT_BROKER_URL && process.env.ENABLE_SIMULATOR !== 'true') {
    logger.warn('⚠️ MQTT_BROKER_URL non défini et ENABLE_SIMULATOR=false');
    logger.warn('💡 Le service MQTT ne démarrera pas. Définissez MQTT_BROKER_URL ou ENABLE_SIMULATOR=true');
  }

  logger.info('✅ Variables d\'environnement validées');
}

module.exports = { validateEnv };
