const express = require('express');
const router = express.Router();
const {
  getAllCapteurs,
  getCapteurPositions,
  getLatestData,
  addMesure,
  getCapteurMesures
} = require('../controllers/capteursController');

// Routes pour les capteurs
router.get('/capteurs', getAllCapteurs);
router.get('/capteurs/positions', getCapteurPositions);
router.get('/capteurs/data/latest', getLatestData);
router.get('/capteurs/:capteurId/mesures', getCapteurMesures);
router.post('/capteurs/mesures', addMesure);

module.exports = router;
