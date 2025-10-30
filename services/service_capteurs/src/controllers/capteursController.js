const Capteur = require('../models/Capteur');
const Mesure = require('../models/Mesure');
const logger = require('../config/logger');
const { Op } = require('sequelize');

// GET /api/capteurs - Liste tous les capteurs
const getAllCapteurs = async (req, res) => {
  try {
    const capteurs = await Capteur.findAll({
      order: [['created_at', 'DESC']]
    });
    
    logger.info(`📋 ${capteurs.length} capteurs récupérés`);
    
    res.json({
      success: true,
      count: capteurs.length,
      data: capteurs
    });
  } catch (error) {
    logger.error('❌ Erreur récupération capteurs:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// GET /api/capteurs/positions - Positions GPS des capteurs (pour Yassin)
const getCapteurPositions = async (req, res) => {
  try {
    const capteurs = await Capteur.findAll({
      attributes: ['capteur_id', 'nom', 'latitude', 'longitude', 'status'],
      where: { status: 'active' }
    });
    
    const positions = capteurs.map(c => ({
      capteur_id: c.capteur_id,
      nom: c.nom,
      latitude: parseFloat(c.latitude),
      longitude: parseFloat(c.longitude),
      status: c.status
    }));
    
    logger.info(`📍 ${positions.length} positions capteurs envoyées`);
    
    res.json({
      success: true,
      count: positions.length,
      positions
    });
  } catch (error) {
    logger.error('❌ Erreur positions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// GET /api/capteurs/data/latest - Dernières mesures (pour Hamza)
const getLatestData = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const hours = parseInt(req.query.hours) || 24;
    
    // Calcul timestamp pour filtrer (dernières X heures)
    const since = new Date();
    since.setHours(since.getHours() - hours);
    
    // Récupérer les dernières mesures avec info capteur
    const mesures = await Mesure.findAll({
      where: {
        timestamp: {
          [Op.gte]: since
        }
      },
      include: [{
        model: Capteur,
        attributes: ['capteur_id', 'nom', 'latitude', 'longitude']
      }],
      order: [['timestamp', 'DESC']],
      limit
    });
    
    // Formatter pour Hamza
    const capteurs = mesures.map(m => ({
      capteur_id: m.capteur_id,
      latitude: m.Capteur ? parseFloat(m.Capteur.latitude) : null,
      longitude: m.Capteur ? parseFloat(m.Capteur.longitude) : null,
      mesures: {
        ph: m.ph ? parseFloat(m.ph) : null,
        temperature: m.temperature ? parseFloat(m.temperature) : null,
        turbidite: m.turbidite ? parseFloat(m.turbidite) : null,
        oxygene: m.oxygene ? parseFloat(m.oxygene) : null,
        conductivite: m.conductivite ? parseFloat(m.conductivite) : null
      },
      timestamp: m.timestamp
    }));
    
    logger.info(`📊 ${capteurs.length} mesures envoyées (dernières ${hours}h)`);
    
    res.json({
      success: true,
      count: capteurs.length,
      period: `${hours}h`,
      capteurs
    });
  } catch (error) {
    logger.error('❌ Erreur latest data:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// POST /api/capteurs/mesures - Ajouter mesure manuelle
const addMesure = async (req, res) => {
  try {
    const { capteur_id, ph, temperature, turbidite, oxygene, conductivite } = req.body;
    
    // Vérifier que le capteur existe
    const capteur = await Capteur.findOne({ where: { capteur_id } });
    if (!capteur) {
      return res.status(404).json({
        success: false,
        error: 'Capteur non trouvé'
      });
    }
    
    // Créer la mesure
    const mesure = await Mesure.create({
      capteur_id,
      ph,
      temperature,
      turbidite,
      oxygene,
      conductivite,
      timestamp: new Date()
    });
    
    logger.info(`✅ Mesure ajoutée pour capteur ${capteur_id}`);
    
    res.status(201).json({
      success: true,
      data: mesure
    });
  } catch (error) {
    logger.error('❌ Erreur ajout mesure:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// GET /api/capteurs/:capteurId/mesures - Historique mesures d'un capteur
const getCapteurMesures = async (req, res) => {
  try {
    const { capteurId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    const mesures = await Mesure.findAll({
      where: { capteur_id: capteurId },
      order: [['timestamp', 'DESC']],
      limit
    });
    
    logger.info(`📊 ${mesures.length} mesures récupérées pour ${capteurId}`);
    
    res.json({
      success: true,
      capteur_id: capteurId,
      count: mesures.length,
      data: mesures
    });
  } catch (error) {
    logger.error('❌ Erreur historique mesures:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

module.exports = {
  getAllCapteurs,
  getCapteurPositions,
  getLatestData,
  addMesure,
  getCapteurMesures
};
