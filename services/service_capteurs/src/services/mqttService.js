const mqtt = require('mqtt');
const Joi = require('joi');
const Mesure = require('../models/Mesure');
const Capteur = require('../models/Capteur');
const logger = require('../config/logger');

// Service MQTT: mode réel (broker) ou mode simulation
class MQTTService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.client = null;
  }

  // --------- Utils
  getMode() {
    const sim = (process.env.ENABLE_SIMULATOR || 'true').toLowerCase();
    const broker = process.env.MQTT_BROKER_URL;
    if (sim === 'true') return 'simulation';
    if (broker) return 'mqtt';
    return 'none';
  }

  // Valider payload IoT (supporte turbidity ou turbidite)
  validatePayload(payload) {
    const schema = Joi.object({
      time: Joi.date().iso().optional(),
      gps: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lon: Joi.number().min(-180).max(180).required()
      }).required(),
      mesures: Joi.object({
        ph: Joi.number().min(0).max(14).optional(),
        turbidity: Joi.number().min(0).optional(),
        turbidite: Joi.number().min(0).optional(),
        temperature: Joi.number().min(-10).max(60).optional(),
        oxygene: Joi.number().min(0).max(20).optional(),
        conductivite: Joi.number().min(0).optional()
      }).required(),
      unit: Joi.object().unknown(true).optional()
    }).required();

    return schema.validate(payload, { abortEarly: false, allowUnknown: true });
  }

  async upsertCapteur(capteur_id, gps) {
    // Créer le capteur s'il n'existe pas; mettre à jour coords si manquantes
    const [capteur, created] = await Capteur.findOrCreate({
      where: { capteur_id },
      defaults: {
        capteur_id,
        nom: `Capteur ${capteur_id}`,
        latitude: gps?.lat ?? 0,
        longitude: gps?.lon ?? 0,
        type_capteur: 'multiparameter',
        status: 'active'
      }
    });
    // Mettre à jour GPS si fournis et différents
    if (!created && gps && (Number(capteur.latitude) !== gps.lat || Number(capteur.longitude) !== gps.lon)) {
      capteur.latitude = gps.lat;
      capteur.longitude = gps.lon;
      await capteur.save();
    }
    return capteur;
  }

  // --------- Mode SIMULATION
  generateRandomMesure(capteur_id) {
    return {
      capteur_id,
      ph: Number((Math.random() * (8.5 - 6.5) + 6.5).toFixed(2)),
      temperature: Number((Math.random() * (30 - 15) + 15).toFixed(2)),
      turbidite: Number((Math.random() * 50).toFixed(2)),
      oxygene: Number((Math.random() * (12 - 6) + 6).toFixed(2)),
      conductivite: Number((Math.random() * (1000 - 200) + 200).toFixed(2)),
      timestamp: new Date()
    };
  }

  async startSimulation() {
    logger.info('🚀 Démarrage simulation MQTT...');
    this.isRunning = true;
    this.interval = setInterval(async () => {
      try {
        const capteurs = await Capteur.findAll({ where: { status: 'active' } });
        for (const capteur of capteurs) {
          const mesureData = this.generateRandomMesure(capteur.capteur_id);
          await Mesure.create(mesureData);
          logger.info(`📊 Mesure simulée: ${capteur.capteur_id} - pH: ${mesureData.ph}, Temp: ${mesureData.temperature}°C`);
        }
      } catch (error) {
        logger.error('❌ Erreur simulation mesures:', error);
      }
    }, 30000);
    logger.info('✅ Simulation MQTT démarrée (mesures toutes les 30s)');
  }

  // --------- Mode MQTT RÉEL
  async startMqtt() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org:1883';
    const topic = process.env.MQTT_TOPIC || 'aquawatch/capteur/+/data';
    const username = process.env.MQTT_USERNAME;
    const password = process.env.MQTT_PASSWORD;

    logger.info(`📡 Connexion au broker MQTT: ${brokerUrl}`);
    this.client = mqtt.connect(brokerUrl, {
      username,
      password,
      protocolVersion: 5,
      reconnectPeriod: 5000,
      connectTimeout: 15_000
    });

    this.client.on('connect', () => {
      logger.info('✅ Connecté au broker MQTT');
      this.client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          logger.error('❌ Erreur subscription MQTT:', err);
        } else {
          logger.info(`📥 Abonné au topic: ${topic}`);
        }
      });
    });

    this.client.on('error', (err) => {
      logger.error('❌ Erreur client MQTT:', err);
    });

    this.client.on('close', () => {
      logger.warn('⚠️ Connexion MQTT fermée');
    });

    this.client.on('message', async (topic, message) => {
      try {
        // Extraire capteur_id depuis le topic: aquawatch/capteur/<id>/data
        const parts = topic.toString().split('/');
        const capteur_id = parts[2];
        if (!capteur_id) {
          logger.warn(`⚠️ capteur_id introuvable dans topic: ${topic}`);
          return;
        }

        // Parse JSON
        let payload;
        try {
          payload = JSON.parse(message.toString());
        } catch (e) {
          logger.warn(`⚠️ Message non JSON pour ${capteur_id}: ${message.toString().slice(0, 200)}`);
          return;
        }

        // Valider
        const { error, value } = this.validatePayload(payload);
        if (error) {
          logger.warn(`⚠️ Payload invalide pour ${capteur_id}: ${error.message}`);
          return;
        }

        // Assurer capteur en base
        await this.upsertCapteur(capteur_id, value.gps);

        // Mapper champs pour DB (turbidity -> turbidite)
        const mesures = value.mesures || {};
        const data = {
          capteur_id,
          ph: mesures.ph ?? null,
          temperature: mesures.temperature ?? null,
          turbidite: (mesures.turbidite ?? mesures.turbidity) ?? null,
          oxygene: mesures.oxygene ?? null,
          conductivite: mesures.conductivite ?? null,
          timestamp: value.time ? new Date(value.time) : new Date()
        };

        await Mesure.create(data);
        logger.info(`✅ Mesure MQTT stockée pour ${capteur_id} @ ${data.timestamp.toISOString()}`);
      } catch (err) {
        logger.error('❌ Erreur traitement message MQTT:', err);
      }
    });
  }

  // --------- Entrée principale
  async start() {
    if (this.isRunning) {
      logger.warn('⚠️ Service MQTT déjà en cours');
      return;
    }
    const mode = this.getMode();
    if (mode === 'simulation') {
      this.isRunning = true;
      await this.startSimulation();
    } else if (mode === 'mqtt') {
      this.isRunning = true;
      await this.startMqtt();
    } else {
      logger.warn('⚠️ Aucun mode MQTT actif (ni SIMULATION ni MQTT_BROKER_URL).');
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.client) {
      try { this.client.end(true); } catch (e) { /* noop */ }
      this.client = null;
    }
    if (this.isRunning) {
      logger.info('🛑 Service MQTT arrêté');
      this.isRunning = false;
    }
  }
}

module.exports = new MQTTService();
