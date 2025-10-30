const Mesure = require('../models/Mesure');

const Capteur = require('../models/Capteur');
const logger = require('../config/logger');

// Simulation MQTT - génère des données aléatoires
class MQTTService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  // Générer données aléatoires réalistes
  generateRandomMesure(capteur_id) {
    return {
      capteur_id,
      ph: (Math.random() * (8.5 - 6.5) + 6.5).toFixed(2), // pH entre 6.5 et 8.5
      temperature: (Math.random() * (30 - 15) + 15).toFixed(2), // 15-30°C
      turbidite: (Math.random() * 50).toFixed(2), // 0-50 NTU
      oxygene: (Math.random() * (12 - 6) + 6).toFixed(2), // 6-12 mg/L
      conductivite: (Math.random() * (1000 - 200) + 200).toFixed(2), // 200-1000 µS/cm
      timestamp: new Date()
    };
  }

  // Démarrer la simulation
  async start() {
    if (this.isRunning) {
      logger.warn('⚠️ MQTT simulation déjà en cours');
      return;
    }

    logger.info('🚀 Démarrage simulation MQTT...');
    this.isRunning = true;

    // Générer une mesure toutes les 30 secondes pour chaque capteur
    this.interval = setInterval(async () => {
      try {
        // Récupérer tous les capteurs actifs
        const capteurs = await Capteur.findAll({
          where: { status: 'active' }
        });

        // Générer mesure pour chaque capteur
        for (const capteur of capteurs) {
          const mesureData = this.generateRandomMesure(capteur.capteur_id);
          
          await Mesure.create(mesureData);
          
          logger.info(`📊 Mesure générée: ${capteur.capteur_id} - pH: ${mesureData.ph}, Temp: ${mesureData.temperature}°C`);
        }
      } catch (error) {
        logger.error('❌ Erreur génération mesures:', error);
      }
    }, 30000); // Toutes les 30 secondes

    logger.info('✅ Simulation MQTT démarrée (mesures toutes les 30s)');
  }

  // Arrêter la simulation
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.isRunning = false;
      logger.info('🛑 Simulation MQTT arrêtée');
    }
  }
}

module.exports = new MQTTService();
