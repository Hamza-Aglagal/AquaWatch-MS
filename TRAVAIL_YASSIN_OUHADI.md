# 📋 TRAVAIL DE YASSIN OUHADI - AQUAWATCH PROJECT

**Développeur:** Yassin Ouhadi  
**Services assignés:** Service Alertes (Port 8004) + Service API-SIG (Port 8005)  
**Technologies:** Node.js/Express.js, PostgreSQL, PostGIS, Leaflet.js, Redis, Nodemailer  
**Date:** Décembre 2024

---

## 🎯 RÉSUMÉ GÉNÉRAL

Yassin est responsable de **la couche utilisateur et notifications** du système AquaWatch. Il gère deux services microservices critiques qui transforment les prédictions ML en actions concrètes (alertes email) et fournissent l'interface visuelle cartographique pour monitoring en temps réel.

**Mission principale:** Écouter les prédictions de qualité d'eau publiées par Hamza sur Redis, déclencher des alertes automatiques par email quand la qualité est mauvaise, et créer une interface web cartographique interactive avec Leaflet.js pour visualiser les zones surveillées et les capteurs en temps réel.

---

## 🚨 SERVICE 1 : SERVICE ALERTES (Port 8004)

### 🏗️ ARCHITECTURE ET STRUCTURE

**Chemin du service:** `services/service_alertes/`

**Structure des fichiers:**
```
service_alertes/
├── src/
│   ├── index.js                      # Point d'entrée Express
│   ├── config/
│   │   ├── database.js               # Connexion PostgreSQL
│   │   ├── email.js                  # Configuration Nodemailer SMTP
│   │   └── redis.js                  # Configuration client Redis
│   ├── models/
│   │   ├── Alert.js                  # Modèle Sequelize alertes
│   │   └── AlertRecipient.js         # Modèle Sequelize destinataires
│   ├── services/
│   │   ├── predictionListener.js     # Redis subscriber écoute prédictions
│   │   └── alertService.js           # Logique envoi alertes
│   ├── routes/
│   │   └── alerts.js                 # Routes API historique alertes
│   └── scripts/
│       └── publishTest.js            # Script test publication Redis
├── package.json                       # Dépendances Node.js
├── Dockerfile                         # Image Docker service
└── README.md                          # Documentation
```

### 🔧 TECHNOLOGIES ET OUTILS UTILISÉS

**Backend:**
- **Node.js 20** - Runtime JavaScript serveur
- **Express.js 4.18** - Framework web léger
- **Sequelize 6.33** - ORM pour PostgreSQL
- **IORedis 5.3** - Client Redis performant

**Base de données:**
- **PostgreSQL 14** - Base de données relationnelle
  - Port: 5435 (externe), 5432 (interne)
  - Database: `alerts_db`
  - User: `alerts_user`

**Notifications:**
- **Nodemailer 6.9** - Envoi emails professionnels
- **SMTP Gmail** - Serveur mail (smtp.gmail.com:587)
- **TLS/STARTTLS** - Sécurisation connexion email

**Messaging:**
- **Redis 5.0** - Message broker pub/sub
- **IORedis** - Client Redis avec retry automatique
- **Canal:** `new_prediction` (écoute messages de Hamza)

**Sécurité:**
- **Helmet** - Sécurisation headers HTTP
- **CORS** - Gestion Cross-Origin
- **Environment Variables** - Credentials sécurisés

### 📋 PROCESSUS DE FONCTIONNEMENT

**Étape 1 : Connexion à PostgreSQL**
```javascript
// config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'db_alerts',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'alerts_db',
  username: process.env.DB_USER || 'alerts_user',
  password: process.env.DB_PASSWORD || 'alerts_pass',
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test connexion avec retry
async function connectDatabase(maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Connexion PostgreSQL alerts_db réussie');
      return true;
    } catch (error) {
      console.log(`❌ Tentative ${attempt}/${maxRetries} échouée`);
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

module.exports = { sequelize, connectDatabase };
```

**Étape 2 : Définition des modèles de données**

**Modèle Alert:**
```javascript
// models/Alert.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  alert_id: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  prediction_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  zone_latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  zone_longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  alert_data: {
    type: DataTypes.JSONB,  // Stockage JSON des détails
    allowNull: true
  },
  severity: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'medium'  // low, medium, high
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending'  // pending, sent, failed
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'alerts',
  timestamps: false,
  freezeTableName: true
});

module.exports = Alert;
```

**Modèle AlertRecipient (destinataires emails):**
```javascript
// models/AlertRecipient.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertRecipient = sequelize.define('AlertRecipient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  role: {
    type: DataTypes.STRING(50),
    defaultValue: 'observer'  // admin, manager, observer
  },
  zones: {
    type: DataTypes.JSONB,  // Liste zones géographiques surveillées
    defaultValue: []
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'alert_recipients',
  timestamps: false,
  freezeTableName: true
});

module.exports = AlertRecipient;
```

**Étape 3 : Configuration Redis listener**
```javascript
// services/predictionListener.js
const Redis = require('ioredis');
const alertService = require('./alertService');

class PredictionListener {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://redis_queue:6379');
    this.channel = 'new_prediction';
    this.subscribe();
  }
  
  subscribe() {
    console.log(`📡 Abonnement au canal Redis: ${this.channel}`);
    
    this.redis.subscribe(this.channel, (err, count) => {
      if (err) {
        console.error('❌ Erreur abonnement Redis:', err);
        return;
      }
      console.log(`✅ Abonné à ${count} canal(s)`);
    });
    
    this.redis.on('message', async (channel, message) => {
      if (channel === this.channel) {
        await this.handlePrediction(message);
      }
    });
  }
  
  async handlePrediction(message) {
    try {
      const prediction = JSON.parse(message);
      console.log('📩 Prédiction reçue:', prediction.prediction_id);
      
      // Extraction données
      const { 
        prediction_id,
        zone,
        predictions,
        confidence,
        timestamp 
      } = prediction;
      
      const qualite = predictions.qualite_eau;
      const score = predictions.score_qualite;
      
      // Vérifier si alerte nécessaire
      if (qualite === 'MAUVAISE' || qualite === 'MOYENNE') {
        console.log(`🚨 Qualité ${qualite} détectée - Création alerte`);
        
        // Déterminer sévérité
        let severity = 'medium';
        if (qualite === 'MAUVAISE' || score < 4) {
          severity = 'high';
        }
        
        // Créer et envoyer alerte
        await alertService.createAndSendAlert({
          prediction_id,
          latitude: zone.latitude,
          longitude: zone.longitude,
          qualite,
          score,
          severity,
          confidence,
          timestamp
        });
      } else {
        console.log(`✅ Qualité ${qualite} - Pas d'alerte nécessaire`);
      }
    } catch (error) {
      console.error('❌ Erreur traitement prédiction:', error);
    }
  }
}

module.exports = new PredictionListener();
```

**Étape 4 : Configuration Nodemailer**
```javascript
// config/email.js
const nodemailer = require('nodemailer');

// Configuration SMTP
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,  // true pour port 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,  // yassineouhadi99@gmail.com
    pass: process.env.SMTP_PASSWORD  // App Password Gmail
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Vérifier configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Erreur configuration SMTP:', error);
  } else {
    console.log('✅ Serveur SMTP prêt');
  }
});

module.exports = transporter;
```

**Étape 5 : Logique d'envoi alertes**
```javascript
// services/alertService.js
const nodemailer = require('../config/email');
const Alert = require('../models/Alert');
const AlertRecipient = require('../models/AlertRecipient');
const { v4: uuidv4 } = require('uuid');

class AlertService {
  
  async createAndSendAlert(data) {
    const {
      prediction_id,
      latitude,
      longitude,
      qualite,
      score,
      severity,
      confidence,
      timestamp
    } = data;
    
    // Génération ID alerte
    const alert_id = `ALERT${Date.now()}`;
    
    // Message alerte
    const message = this.generateAlertMessage(qualite, score, latitude, longitude);
    
    try {
      // 1. Créer alerte en base
      const alert = await Alert.create({
        alert_id,
        prediction_id,
        zone_latitude: latitude,
        zone_longitude: longitude,
        alert_data: {
          qualite,
          score,
          confidence,
          prediction_timestamp: timestamp
        },
        severity,
        status: 'pending',
        message,
        created_at: new Date()
      });
      
      console.log(`📝 Alerte créée: ${alert_id}`);
      
      // 2. Récupérer destinataires actifs
      const recipients = await AlertRecipient.findAll({
        where: { is_active: true }
      });
      
      if (recipients.length === 0) {
        console.log('⚠️ Aucun destinataire actif');
        return;
      }
      
      // 3. Envoyer emails
      const emailPromises = recipients.map(recipient => 
        this.sendAlertEmail(recipient, alert, data)
      );
      
      const results = await Promise.allSettled(emailPromises);
      
      // 4. Compter succès/échecs
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`📧 Emails envoyés: ${successful} succès, ${failed} échecs`);
      
      // 5. Mettre à jour statut alerte
      if (successful > 0) {
        await alert.update({
          status: 'sent',
          sent_at: new Date()
        });
        console.log(`✅ Alerte ${alert_id} envoyée avec succès`);
      } else {
        await alert.update({ status: 'failed' });
        console.log(`❌ Échec envoi alerte ${alert_id}`);
      }
      
    } catch (error) {
      console.error('❌ Erreur création/envoi alerte:', error);
    }
  }
  
  generateAlertMessage(qualite, score, latitude, longitude) {
    const severityText = qualite === 'MAUVAISE' ? 'CRITIQUE' : 'ATTENTION';
    return `[${severityText}] Qualité eau ${qualite} détectée (score: ${score.toFixed(1)}) 
            Zone: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`;
  }
  
  async sendAlertEmail(recipient, alert, data) {
    const { qualite, score, latitude, longitude } = data;
    
    // Construction email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .alert-box { 
            background: ${qualite === 'MAUVAISE' ? '#fee2e2' : '#fef3c7'}; 
            padding: 20px; 
            border-left: 4px solid ${qualite === 'MAUVAISE' ? '#dc2626' : '#f59e0b'};
            margin: 20px 0;
          }
          .alert-title { 
            font-size: 20px; 
            font-weight: bold; 
            color: ${qualite === 'MAUVAISE' ? '#991b1b' : '#92400e'};
            margin-bottom: 10px;
          }
          .details { margin: 10px 0; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>🚨 Alerte Qualité de l'Eau - AquaWatch</h2>
        
        <div class="alert-box">
          <div class="alert-title">
            Qualité: ${qualite} (Score: ${score.toFixed(1)}/10)
          </div>
          
          <div class="details">
            <div><span class="label">ID Alerte:</span> ${alert.alert_id}</div>
            <div><span class="label">Sévérité:</span> ${alert.severity.toUpperCase()}</div>
            <div><span class="label">Localisation:</span> ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E</div>
            <div><span class="label">Date:</span> ${new Date().toLocaleString('fr-FR')}</div>
          </div>
          
          <p><strong>Message:</strong><br>${alert.message}</p>
        </div>
        
        <p>Cette alerte a été générée automatiquement par le système AquaWatch.</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">
          Destinataire: ${recipient.name} (${recipient.email})<br>
          Pour vous désabonner, contactez l'administrateur système.
        </p>
      </body>
      </html>
    `;
    
    // Options email
    const mailOptions = {
      from: `"AquaWatch Alertes" <${process.env.SMTP_USER}>`,
      to: recipient.email,
      subject: `🚨 Alerte Qualité Eau ${qualite} - Zone ${latitude.toFixed(2)}°N`,
      html: htmlContent
    };
    
    // Envoi
    const info = await nodemailer.sendMail(mailOptions);
    console.log(`📧 Email envoyé à ${recipient.email}: ${info.messageId}`);
    
    return info;
  }
}

module.exports = new AlertService();
```

**Étape 6 : API historique alertes**
```javascript
// routes/alerts.js
const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

// GET /api/alerts/history - Historique alertes
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const alerts = await Alert.findAll({
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
    
    const total = await Alert.count();
    
    res.json({
      success: true,
      total,
      count: alerts.length,
      alerts: alerts.map(a => ({
        alert_id: a.alert_id,
        prediction_id: a.prediction_id,
        zone: {
          latitude: parseFloat(a.zone_latitude),
          longitude: parseFloat(a.zone_longitude)
        },
        severity: a.severity,
        status: a.status,
        message: a.message,
        data: a.alert_data,
        created_at: a.created_at,
        sent_at: a.sent_at
      }))
    });
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur' 
    });
  }
});

// GET /api/alerts/stats - Statistiques alertes
router.get('/stats', async (req, res) => {
  try {
    const total = await Alert.count();
    const pending = await Alert.count({ where: { status: 'pending' } });
    const sent = await Alert.count({ where: { status: 'sent' } });
    const failed = await Alert.count({ where: { status: 'failed' } });
    
    const high = await Alert.count({ where: { severity: 'high' } });
    const medium = await Alert.count({ where: { severity: 'medium' } });
    const low = await Alert.count({ where: { severity: 'low' } });
    
    res.json({
      success: true,
      stats: {
        total,
        by_status: { pending, sent, failed },
        by_severity: { high, medium, low }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur' 
    });
  }
});

module.exports = router;
```

### 🎯 RÔLE DANS L'ARCHITECTURE GLOBALE

**Consommation de données:**
- Écoute canal Redis `new_prediction` en temps réel
- Reçoit prédictions de Hamza (STModel) instantanément
- Filtre automatiquement selon sévérité (MAUVAISE/MOYENNE)

**Production d'actions:**
- Envoi emails automatiques aux destinataires configurés
- Stockage historique complet des alertes
- Tracking status envois (pending, sent, failed)

**Intégration Docker:**
```yaml
service_alertes:
  build: ./services/service_alertes
  depends_on: [db_alerts, redis_queue]
  ports: ["8004:8000"]
  environment:
    - DATABASE_URL=postgresql://alerts_user:alerts_pass@db_alerts:5432/alerts_db
    - REDIS_URL=redis://redis_queue:6379
    - SMTP_HOST=smtp.gmail.com
    - SMTP_PORT=587
    - SMTP_USER=yassineouhadi99@gmail.com
    - SMTP_PASSWORD=${SMTP_APP_PASSWORD}
    - EMAIL_ENABLED=true
```

---

## 🗺️ SERVICE 2 : SERVICE API-SIG (Port 8005)

### 🏗️ ARCHITECTURE ET STRUCTURE

**Chemin du service:** `services/service_api_sig/`

**Structure des fichiers:**
```
service_api_sig/
├── src/
│   ├── index.js                      # Point d'entrée Express
│   ├── config/
│   │   └── database.js               # Connexion PostGIS
│   ├── models/
│   │   ├── Zone.js                   # Modèle Sequelize zones géographiques
│   │   └── PointInteret.js           # Modèle Sequelize points d'intérêt (capteurs)
│   ├── routes/
│   │   └── mapRoutes.js              # Routes API cartographiques
│   ├── services/
│   │   ├── capteurSyncService.js     # Sync capteurs depuis Bilal
│   │   └── predictionListener.js     # Listener Redis maj zones
│   └── public/
│       ├── index.html                # Interface Leaflet.js
│       ├── dashboard.html            # Dashboard statistiques
│       ├── carte.html                # Carte interactive complète
│       ├── alertes.html              # Historique alertes
│       └── parametres.html           # Configuration
├── package.json                       # Dépendances Node.js
├── Dockerfile                         # Image Docker service
└── README.md                          # Documentation
```

### 🔧 TECHNOLOGIES ET OUTILS UTILISÉS

**Backend:**
- **Node.js 20** - Runtime JavaScript serveur
- **Express.js 4.18** - Framework web
- **Sequelize 6.33** - ORM avec support PostGIS
- **Axios 1.6** - Client HTTP pour APIs

**Base de données géospatiale:**
- **PostgreSQL 14 + PostGIS 3.2** - Base de données géographique
  - Port: 5436 (externe), 5432 (interne)
  - Database: `geo_db`
  - Extension PostGIS activée
  - User: `geo_user`

**Frontend cartographie:**
- **Leaflet.js 1.9.4** - Bibliothèque cartographie interactive
- **OpenStreetMap** - Fond de carte gratuit
- **GeoJSON** - Format données géographiques
- **HTML5/CSS3/JavaScript** - Interface web responsive

**Outils géospatiaux:**
- **PostGIS** - Fonctions géospatiales SQL (ST_MakePoint, ST_Distance, etc.)
- **GeoJSON** - Sérialisation données géographiques
- **WGS84 (SRID 4326)** - Système coordonnées GPS standard

**Autres:**
- **Redis** - Écoute mises à jour prédictions
- **CORS** - Partage ressources cross-origin
- **Helmet** - Sécurité headers HTTP

### 📋 PROCESSUS DE FONCTIONNEMENT

**Étape 1 : Connexion PostGIS**
```javascript
// config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'db_geo',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'geo_db',
  username: process.env.DB_USER || 'geo_user',
  password: process.env.DB_PASSWORD || 'geo_pass',
  dialect: 'postgres',
  dialectOptions: {
    // Support PostGIS
    // PostGIS installé via extension dans init.sql
  },
  logging: false
});

// Test connexion
sequelize.authenticate()
  .then(() => console.log('✅ Connexion PostGIS établie'))
  .catch(err => console.error('❌ Erreur PostGIS:', err));

module.exports = sequelize;
```

**Étape 2 : Modèles géographiques**

**Modèle Zone (zones géographiques):**
```javascript
// models/Zone.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Zone = sequelize.define('Zone', {
  zone_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),  // lac, fleuve, mer, reservoir
    allowNull: false
  },
  geometry: {
    type: DataTypes.GEOMETRY('POLYGON', 4326),  // PostGIS polygon WGS84
    allowNull: false
  },
  centre_lat: {
    type: DataTypes.DECIMAL(10, 8)
  },
  centre_lon: {
    type: DataTypes.DECIMAL(11, 8)
  },
  qualite_actuelle: {
    type: DataTypes.STRING(20),  // EXCELLENTE, BONNE, MOYENNE, MAUVAISE
    defaultValue: 'INCONNUE'
  },
  score_qualite: {
    type: DataTypes.DECIMAL(4, 2),  // 0-10
    defaultValue: null
  },
  couleur_carte: {
    type: DataTypes.STRING(20),  // green, yellow, orange, red
    defaultValue: 'gray'
  },
  derniere_mise_a_jour: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'zones_map',
  timestamps: false,
  freezeTableName: true
});

module.exports = Zone;
```

**Modèle PointInteret (capteurs):**
```javascript
// models/PointInteret.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointInteret = sequelize.define('PointInteret', {
  poi_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),  // capteur, station, point_mesure
    allowNull: false
  },
  position: {
    type: DataTypes.GEOMETRY('POINT', 4326),  // PostGIS point WGS84
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  capteur_id: {
    type: DataTypes.STRING(50),  // Référence au capteur de Bilal
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'poi_map',
  timestamps: false,
  freezeTableName: true
});

module.exports = PointInteret;
```

**Étape 3 : APIs cartographiques**

**API 1 - Récupérer zones en GeoJSON:**
```javascript
// routes/mapRoutes.js
const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');

// GET /api/map/zones - Zones géographiques en format GeoJSON
router.get('/zones', async (req, res) => {
  try {
    // Requête PostGIS avec ST_AsGeoJSON
    const zones = await sequelize.query(`
      SELECT 
        zone_id,
        nom,
        type,
        ST_AsGeoJSON(geometry)::json as geometry,
        centre_lat,
        centre_lon,
        qualite_actuelle,
        score_qualite,
        couleur_carte,
        derniere_mise_a_jour,
        actif
      FROM zones_map
      WHERE actif = true
      ORDER BY type, nom
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    // Format GeoJSON FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: zones.map(zone => ({
        type: 'Feature',
        id: zone.zone_id,
        properties: {
          nom: zone.nom,
          type: zone.type,
          qualite: zone.qualite_actuelle,
          score: zone.score_qualite,
          couleur: zone.couleur_carte,
          maj: zone.derniere_mise_a_jour
        },
        geometry: zone.geometry
      }))
    };
    
    res.json(geojson);
  } catch (error) {
    console.error('❌ Erreur récupération zones:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**API 2 - Récupérer points d'intérêt (capteurs):**
```javascript
// GET /api/map/points - Points intérêt (capteurs) en GeoJSON
router.get('/points', async (req, res) => {
  try {
    const points = await sequelize.query(`
      SELECT 
        poi_id,
        nom,
        type,
        ST_AsGeoJSON(position)::json as position,
        latitude,
        longitude,
        capteur_id,
        description,
        actif
      FROM poi_map
      WHERE actif = true
      ORDER BY type, nom
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    // Format GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: points.map(point => ({
        type: 'Feature',
        id: point.poi_id,
        properties: {
          nom: point.nom,
          type: point.type,
          capteur_id: point.capteur_id,
          description: point.description
        },
        geometry: point.position
      }))
    };
    
    res.json(geojson);
  } catch (error) {
    console.error('❌ Erreur récupération points:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**API 3 - Recherche zone par coordonnées:**
```javascript
// GET /api/map/zone-at?lat=33.5731&lon=-7.5898
router.get('/zone-at', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude et longitude requises' });
    }
    
    // Requête PostGIS ST_Contains
    const zones = await sequelize.query(`
      SELECT 
        zone_id,
        nom,
        type,
        qualite_actuelle,
        score_qualite,
        couleur_carte
      FROM zones_map
      WHERE ST_Contains(geometry, ST_MakePoint(:lon, :lat))
      AND actif = true
    `, {
      replacements: { lat: parseFloat(lat), lon: parseFloat(lon) },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (zones.length === 0) {
      return res.json({ found: false, message: 'Aucune zone à ces coordonnées' });
    }
    
    res.json({ found: true, zone: zones[0] });
  } catch (error) {
    console.error('❌ Erreur recherche zone:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**API 4 - Mise à jour qualité zone:**
```javascript
// POST /api/map/update-zone
router.post('/update-zone', async (req, res) => {
  try {
    const { zone_id, qualite, score, couleur } = req.body;
    
    if (!zone_id) {
      return res.status(400).json({ error: 'zone_id requis' });
    }
    
    const [numUpdated] = await sequelize.query(`
      UPDATE zones_map
      SET 
        qualite_actuelle = :qualite,
        score_qualite = :score,
        couleur_carte = :couleur,
        derniere_mise_a_jour = NOW()
      WHERE zone_id = :zone_id
    `, {
      replacements: { zone_id, qualite, score, couleur }
    });
    
    if (numUpdated === 0) {
      return res.status(404).json({ error: 'Zone non trouvée' });
    }
    
    res.json({ success: true, zone_id, updated: true });
  } catch (error) {
    console.error('❌ Erreur mise à jour zone:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**API 5 - Statistiques globales:**
```javascript
// GET /api/map/stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await sequelize.query(`
      SELECT 
        COUNT(*) as total_zones,
        COUNT(CASE WHEN qualite_actuelle = 'EXCELLENTE' THEN 1 END) as excellente,
        COUNT(CASE WHEN qualite_actuelle = 'BONNE' THEN 1 END) as bonne,
        COUNT(CASE WHEN qualite_actuelle = 'MOYENNE' THEN 1 END) as moyenne,
        COUNT(CASE WHEN qualite_actuelle = 'MAUVAISE' THEN 1 END) as mauvaise,
        COUNT(CASE WHEN qualite_actuelle = 'INCONNUE' THEN 1 END) as inconnue,
        AVG(score_qualite) as score_moyen
      FROM zones_map
      WHERE actif = true
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    const pointsCount = await sequelize.query(`
      SELECT COUNT(*) as total_points
      FROM poi_map
      WHERE actif = true
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      zones: stats[0],
      points: pointsCount[0].total_points
    });
  } catch (error) {
    console.error('❌ Erreur statistiques:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Étape 4 : Interface Leaflet.js**
```html
<!-- public/carte.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AquaWatch - Carte Interactive</title>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; }
        
        #map-container {
            display: flex;
            height: 100vh;
        }
        
        #sidebar {
            width: 300px;
            background: white;
            padding: 20px;
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
            overflow-y: auto;
        }
        
        #map {
            flex: 1;
            height: 100vh;
        }
        
        h2 {
            color: #1e40af;
            margin-bottom: 15px;
        }
        
        .legend {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .legend-color {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            border-radius: 4px;
        }
        
        .stats {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="map-container">
        <!-- Sidebar -->
        <div id="sidebar">
            <h2>🗺️ Carte Interactive</h2>
            
            <div class="legend">
                <h3>Légende</h3>
                <div class="legend-item">
                    <div class="legend-color" style="background: #10b981;"></div>
                    <span>Excellente / Bonne</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #f59e0b;"></div>
                    <span>Moyenne</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #ef4444;"></div>
                    <span>Mauvaise</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #3b82f6;"></div>
                    <span>🔵 Capteur actif</span>
                </div>
            </div>
            
            <div class="stats" id="stats">
                <h3>Statistiques</h3>
                <p>Chargement...</p>
            </div>
        </div>
        
        <!-- Carte -->
        <div id="map"></div>
    </div>
    
    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    <script>
        // Initialisation carte Leaflet
        const map = L.map('map').setView([33.5731, -7.5898], 6);
        
        // Fond de carte OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);
        
        // Fonction couleur selon qualité
        function getColor(qualite) {
            switch(qualite) {
                case 'EXCELLENTE':
                case 'BONNE':
                    return '#10b981';  // Vert
                case 'MOYENNE':
                    return '#f59e0b';  // Orange
                case 'MAUVAISE':
                    return '#ef4444';  // Rouge
                default:
                    return '#9ca3af';  // Gris
            }
        }
        
        // Charger zones
        async function loadZones() {
            try {
                const response = await fetch('http://localhost:8005/api/map/zones');
                const geojson = await response.json();
                
                // Ajouter couche GeoJSON à la carte
                L.geoJSON(geojson, {
                    style: function(feature) {
                        return {
                            fillColor: getColor(feature.properties.qualite),
                            weight: 2,
                            opacity: 1,
                            color: 'white',
                            fillOpacity: 0.6
                        };
                    },
                    onEachFeature: function(feature, layer) {
                        // Popup au clic
                        const props = feature.properties;
                        layer.bindPopup(`
                            <strong>${props.nom}</strong><br>
                            Type: ${props.type}<br>
                            Qualité: <strong>${props.qualite}</strong><br>
                            Score: ${props.score ? props.score.toFixed(1) : 'N/A'}/10<br>
                            Mis à jour: ${new Date(props.maj).toLocaleString('fr-FR')}
                        `);
                    }
                }).addTo(map);
                
                console.log('✅ Zones chargées:', geojson.features.length);
            } catch (error) {
                console.error('❌ Erreur chargement zones:', error);
            }
        }
        
        // Charger points (capteurs)
        async function loadPoints() {
            try {
                const response = await fetch('http://localhost:8005/api/map/points');
                const geojson = await response.json();
                
                // Icône capteur
                const capteurIcon = L.icon({
                    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjM2I4MmY2Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
                    iconSize: [25, 25],
                    iconAnchor: [12, 12],
                    popupAnchor: [0, -15]
                });
                
                L.geoJSON(geojson, {
                    pointToLayer: function(feature, latlng) {
                        return L.marker(latlng, { icon: capteurIcon });
                    },
                    onEachFeature: function(feature, layer) {
                        const props = feature.properties;
                        layer.bindPopup(`
                            <strong>📡 ${props.nom}</strong><br>
                            ID: ${props.capteur_id}<br>
                            Type: ${props.type}<br>
                            ${props.description || ''}
                        `);
                    }
                }).addTo(map);
                
                console.log('✅ Capteurs chargés:', geojson.features.length);
            } catch (error) {
                console.error('❌ Erreur chargement capteurs:', error);
            }
        }
        
        // Charger statistiques
        async function loadStats() {
            try {
                const response = await fetch('http://localhost:8005/api/map/stats');
                const data = await response.json();
                
                document.getElementById('stats').innerHTML = `
                    <h3>Statistiques</h3>
                    <div class="stat-item">
                        <span>Zones surveillées:</span>
                        <strong>${data.zones.total_zones}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Capteurs actifs:</span>
                        <strong>${data.points}</strong>
                    </div>
                    <div class="stat-item">
                        <span style="color: #10b981;">✓ Excellente/Bonne:</span>
                        <strong>${parseInt(data.zones.excellente) + parseInt(data.zones.bonne)}</strong>
                    </div>
                    <div class="stat-item">
                        <span style="color: #f59e0b;">⚠ Moyenne:</span>
                        <strong>${data.zones.moyenne}</strong>
                    </div>
                    <div class="stat-item">
                        <span style="color: #ef4444;">✗ Mauvaise:</span>
                        <strong>${data.zones.mauvaise}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Score moyen:</span>
                        <strong>${data.zones.score_moyen ? parseFloat(data.zones.score_moyen).toFixed(1) : 'N/A'}/10</strong>
                    </div>
                `;
            } catch (error) {
                console.error('❌ Erreur chargement stats:', error);
            }
        }
        
        // Chargement initial
        loadZones();
        loadPoints();
        loadStats();
        
        // Rafraîchissement automatique toutes les 30 secondes
        setInterval(() => {
            loadZones();
            loadPoints();
            loadStats();
        }, 30000);
    </script>
</body>
</html>
```

**Étape 5 : Synchronisation capteurs depuis Bilal**
```javascript
// services/capteurSyncService.js
const axios = require('axios');
const PointInteret = require('../models/PointInteret');
const sequelize = require('../config/database');

class CapteurSyncService {
  
  async syncFromBilalAPI() {
    try {
      console.log('🔄 Synchronisation capteurs depuis API Bilal...');
      
      // Récupérer positions capteurs depuis Service Capteurs de Bilal
      const response = await axios.get(
        'http://service_capteurs:8000/api/capteurs/positions',
        { timeout: 5000 }
      );
      
      if (!response.data.success) {
        console.log('❌ Erreur API capteurs');
        return;
      }
      
      const capteurs = response.data.positions;
      console.log(`📡 ${capteurs.length} capteurs reçus`);
      
      // Insertion/mise à jour en base PostGIS
      for (const capteur of capteurs) {
        const { capteur_id, nom, latitude, longitude, status } = capteur;
        
        // Requête PostGIS avec ST_MakePoint
        await sequelize.query(`
          INSERT INTO poi_map (poi_id, nom, type, position, latitude, longitude, capteur_id, actif)
          VALUES (
            :poi_id,
            :nom,
            'capteur',
            ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
            :latitude,
            :longitude,
            :capteur_id,
            :actif
          )
          ON CONFLICT (poi_id) 
          DO UPDATE SET
            nom = EXCLUDED.nom,
            position = EXCLUDED.position,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            actif = EXCLUDED.actif
        `, {
          replacements: {
            poi_id: `POI_${capteur_id}`,
            nom: nom,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            capteur_id: capteur_id,
            actif: status === 'active'
          }
        });
      }
      
      console.log(`✅ Synchronisation terminée: ${capteurs.length} capteurs`);
    } catch (error) {
      console.error('❌ Erreur synchronisation capteurs:', error.message);
    }
  }
  
  startAutoSync(intervalMinutes = 5) {
    console.log(`🔄 Auto-sync capteurs activé (intervalle: ${intervalMinutes} min)`);
    
    // Sync immédiat
    this.syncFromBilalAPI();
    
    // Sync périodique
    setInterval(() => {
      this.syncFromBilalAPI();
    }, intervalMinutes * 60 * 1000);
  }
}

module.exports = new CapteurSyncService();
```

### 🎯 RÔLE DANS L'ARCHITECTURE GLOBALE

**Consommation de données:**
- Récupère positions capteurs depuis Service Capteurs (Bilal)
- Écoute prédictions Redis pour mettre à jour couleurs zones
- Stocke données géographiques dans PostGIS

**Production d'interface:**
- Interface web Leaflet.js pour monitoring temps réel
- APIs GeoJSON pour applications tierces
- Dashboard statistiques qualité eau
- Historique alertes avec visualisation

**Intégration Docker:**
```yaml
service_api_sig:
  build: ./services/service_api_sig
  depends_on: [db_geo, redis_queue]
  ports: ["8005:8000"]
  environment:
    - DB_HOST=db_geo
    - DB_NAME=geo_db
    - DB_USER=geo_user
    - DB_PASSWORD=geo_pass
    - DATABASE_URL=postgresql://geo_user:geo_pass@db_geo:5432/geo_db
    - REDIS_URL=redis://redis_queue:6379
    - CAPTEUR_API_URL=http://service_capteurs:8000
    - STMODEL_API_URL=http://service_stmodel:8000
```

---

## 🔄 INTÉGRATION ENTRE LES DEUX SERVICES

### Communication Service Alertes ↔ Service API-SIG

**Scénario complet:**

1. **Hamza (STModel)** génère prédiction MAUVAISE
2. **Publié sur Redis** canal `new_prediction`
3. **Yassin (Alertes)** écoute Redis, crée alerte, envoie emails
4. **Yassin (API-SIG)** écoute aussi Redis, met à jour couleur zone sur carte
5. **Interface web** affiche zone rouge instantanément

```javascript
// Dans API-SIG - services/predictionListener.js
class PredictionListener {
  async handlePrediction(message) {
    const prediction = JSON.parse(message);
    const { zone, predictions } = prediction;
    
    // Mettre à jour zone sur carte
    const couleur = this.getCouleur(predictions.qualite_eau);
    
    await sequelize.query(`
      UPDATE zones_map
      SET 
        qualite_actuelle = :qualite,
        score_qualite = :score,
        couleur_carte = :couleur,
        derniere_mise_a_jour = NOW()
      WHERE ST_Contains(geometry, ST_MakePoint(:lon, :lat))
    `, {
      replacements: {
        qualite: predictions.qualite_eau,
        score: predictions.score_qualite,
        couleur: couleur,
        lat: zone.latitude,
        lon: zone.longitude
      }
    });
    
    console.log('🗺️ Zone mise à jour sur carte');
  }
  
  getCouleur(qualite) {
    switch(qualite) {
      case 'EXCELLENTE':
      case 'BONNE':
        return 'green';
      case 'MOYENNE':
        return 'yellow';
      case 'MAUVAISE':
        return 'red';
      default:
        return 'gray';
    }
  }
}
```

---

## 📊 TESTS ET VALIDATION

### Tests Service Alertes

**Test 1 - Connexion PostgreSQL:**
```powershell
docker compose exec db_alerts psql -U alerts_user -d alerts_db -c "\dt"
# Attendu: tables alerts, alert_recipients
```

**Test 2 - Redis Subscriber:**
```powershell
docker compose exec redis_queue redis-cli PUBSUB NUMSUB new_prediction
# Attendu: 1 (subscriber actif)
```

**Test 3 - Publication test:**
```powershell
docker compose exec service_alertes node src/scripts/publishTest.js
# Attendu: Email reçu avec alerte
```

**Test 4 - API Historique:**
```powershell
curl http://localhost:8004/api/alerts/history?limit=10
# Attendu: JSON avec 10 dernières alertes
```

### Tests Service API-SIG

**Test 1 - Connexion PostGIS:**
```powershell
docker compose exec db_geo psql -U geo_user -d geo_db -c "SELECT PostGIS_version();"
# Attendu: Version PostGIS 3.2
```

**Test 2 - API Zones GeoJSON:**
```powershell
curl http://localhost:8005/api/map/zones
# Attendu: GeoJSON FeatureCollection avec zones
```

**Test 3 - API Capteurs:**
```powershell
curl http://localhost:8005/api/map/points
# Attendu: GeoJSON FeatureCollection avec 3 capteurs
```

**Test 4 - Interface Web:**
```
Ouvrir http://localhost:8005/carte.html
Vérifier: Carte Leaflet avec zones colorées et capteurs
```

**Test 5 - Statistiques:**
```powershell
curl http://localhost:8005/api/map/stats
# Attendu: {zones: {...}, points: 3}
```

---

## 🎓 COMPÉTENCES DÉVELOPPÉES

### Compétences techniques Yassin

**Backend Development:**
- APIs REST avec Express.js
- ORMs (Sequelize) avec support géospatial
- Traitement asynchrone événements Redis
- Gestion état base de données PostgreSQL

**Géospatial / SIG:**
- PostGIS pour requêtes géographiques (ST_MakePoint, ST_Contains, ST_Distance)
- Format GeoJSON pour données géographiques
- Systèmes coordonnées (WGS84, SRID 4326)
- Leaflet.js pour cartographie interactive web

**Frontend Web:**
- HTML5/CSS3 moderne
- JavaScript vanilla
- Leaflet.js cartographie
- Design responsive
- Interfaces utilisateur interactives

**Notifications / Messaging:**
- Nodemailer configuration SMTP
- Templates emails HTML
- Gestion destinataires et envois groupés
- Redis pub/sub pour événements temps réel

**DevOps:**
- Docker containers multi-bases
- Gestion variables environnement sensibles
- Configuration services SMTP
- Networking Docker inter-services

---

## 📝 RÉSUMÉ STATISTIQUES

### Service Alertes
- **Endpoints API:** 3
- **Modèles de données:** 2 (Alert, AlertRecipient)
- **Canal Redis:** 1 subscriber sur `new_prediction`
- **Emails envoyés:** ~50 depuis lancement
- **Base de données:** PostgreSQL 14
- **Port:** 8004
- **Lignes de code:** ~600 lignes JavaScript

### Service API-SIG
- **Endpoints API:** 5
- **Modèles de données:** 2 (Zone, PointInteret)
- **Zones géographiques:** 10 (Agadir → Tanger)
- **Capteurs affichés:** 3
- **Pages HTML:** 5 (index, dashboard, carte, alertes, paramètres)
- **Base de données:** PostgreSQL 14 + PostGIS 3.2
- **Port:** 8005
- **Lignes de code:** ~1200 lignes JavaScript + ~2000 lignes HTML/CSS/JS

---

## 🚀 IMPACT SUR LE PROJET

**Criticité:** ⭐⭐⭐⭐⭐ (5/5)

Les services de Yassin sont la **couche interface utilisateur** du système AquaWatch:

- **Notifications proactives:** Alertes automatiques par email permettent réaction rapide aux problèmes
- **Visualisation intuitive:** Carte interactive Leaflet.js rend données compréhensibles instantanément
- **Historique traçable:** Stockage complet alertes pour audit et conformité
- **Monitoring temps réel:** Interface web montre état actuel qualité eau toutes zones
- **Géolocalisation précise:** PostGIS permet requêtes spatiales complexes (zones contenant point, distance, etc.)

**Dependencies:**
- Dépend de Hamza (STModel) pour prédictions via Redis
- Dépend de Bilal (Capteurs) pour positions GPS capteurs
- Fournit interface utilisateur finale pour tout le système

---

**Document généré le:** 14 décembre 2024  
**Version:** 1.0  
**Contact projet:** AquaWatch-MS Team
