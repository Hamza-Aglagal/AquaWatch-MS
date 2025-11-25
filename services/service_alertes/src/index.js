const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const sequelize = require('./config/database');
const alertRoutes = require('./routes/alerts');
require('./services/predictionListener'); // Start Redis listener

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.json({ 
        service: 'AquaWatch Service Alertes',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            alertHistory: '/api/alerts/history'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'alertes' });
});

// Routes
app.use('/api/alerts', alertRoutes);

// Database initialization
sequelize.sync().then(() => {
    console.log('Database synchronized');
}).catch(err => {
    console.error('Failed to sync database:', err);
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Service alertes started on port ${port}`);
});
