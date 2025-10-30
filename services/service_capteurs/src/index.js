require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./config/logger');
const { connectDatabase, syncDatabase } = require('./config/database');
const capteursRoutes = require('./routes/capteurs');
const mqttService = require('./services/mqttService');

const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(helmet()); // Sécurité
app.use(cors()); // CORS
app.use(express.json()); // Parser JSON
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    service: 'Service Capteurs - AquaWatch',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      capteurs: '/api/capteurs',
      positions: '/api/capteurs/positions',
      latest_data: '/api/capteurs/data/latest',
      add_mesure: 'POST /api/capteurs/mesures'
    }
  });
});

// API Routes
app.use('/api', capteursRoutes);

// Route de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('❌ Erreur:', err);
  res.status(500).json({
    success: false,
    error: 'Erreur serveur interne'
  });
});

// Démarrage du serveur
const startServer = async () => {
  try {
    // 1. Connexion database
    logger.info('🔌 Connexion à la base de données...');
    const dbConnected = await connectDatabase();
    
    if (!dbConnected) {
      logger.error('❌ Impossible de se connecter à la database');
      process.exit(1);
    }

    // 2. Synchronisation des modèles
    await syncDatabase();

    // 3. Démarrer simulation MQTT
    await mqttService.start();

    // 4. Démarrer le serveur
    app.listen(PORT, () => {
      logger.info('='.repeat(50));
      logger.info(`🚀 Service Capteurs démarré sur port ${PORT}`);
      logger.info(`📡 API: http://localhost:${PORT}/api`);
      logger.info(`🏥 Health: http://localhost:${PORT}/health`);
      logger.info('='.repeat(50));
    });
  } catch (error) {
    logger.error('❌ Erreur démarrage serveur:', error);
    process.exit(1);
  }
};

// Gestion arrêt propre
process.on('SIGINT', () => {
  logger.info('⚠️ Arrêt du serveur...');
  mqttService.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('⚠️ Arrêt du serveur...');
  mqttService.stop();
  process.exit(0);
});

// Lancer le serveur
startServer();
