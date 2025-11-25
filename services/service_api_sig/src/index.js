const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const mapRoutes = require('./routes/mapRoutes');
const predictionListener = require('./services/predictionListener');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/map', mapRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'api-sig' });
});

// Page d'accueil avec carte
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connexion à la base de données et démarrage du serveur
sequelize.authenticate()
    .then(() => {
        console.log('✅ Connexion à PostGIS établie');
        return sequelize.sync({ alter: false });
    })
    .then(() => {
        console.log('✅ Modèles synchronisés');
        
        // Démarrer le listener Redis pour les prédictions
        predictionListener.start();
        
        app.listen(PORT, () => {
            console.log(`🗺️  Service API-SIG en écoute sur le port ${PORT}`);
            console.log(`📍 Carte interactive: http://localhost:${PORT}`);
            console.log(`🔍 API zones: http://localhost:${PORT}/api/map/zones`);
            console.log(`📊 API points: http://localhost:${PORT}/api/map/points`);
        });
    })
    .catch(err => {
        console.error('❌ Erreur connexion PostGIS:', err);
        process.exit(1);
    });

