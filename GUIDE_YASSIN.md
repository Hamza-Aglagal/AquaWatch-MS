# 🎯 GUIDE YASSIN - Alertes + API-SIG
**Votre branche : `dev_yassin`**  
**Architecture : MICROSERVICES PROFESSIONNELLE**  
**Vos services : Alertes (Notifications) + API-SIG (Cartes)**

---

## 🏗️ ARCHITECTURE MICROSERVICES

### **🗄️ VOS BASES DE DONNÉES DÉDIÉES** :

#### **Base Alertes** :
- **Nom** : `alerts_db` (PostgreSQL port 5435)
- **Tables** : 
  - `alerts` → Historique alertes (type, zone, status, destinataire)
  - `alert_recipients` → Liste emails/SMS à notifier
  - `alert_deliveries` → Suivi envois (succès/échec)

#### **Base Géographique** :
- **Nom** : `geo_db` (PostGIS port 5436)
- **Tables** : 
  - `zones_map` → Zones géographiques (polygones, noms)
  - `zone_status` → Couleurs zones selon qualité (vert/rouge)
  - `poi_map` → Points capteurs sur carte

### **📡 DONNÉES QUE VOUS RECEVEZ** :

#### **De Hamza (via Redis Message Queue)** :
```
Canal: "new_prediction"
Vous écoutez: {
  "prediction_id": "PRED001",
  "zone": {"latitude": 33.5731, "longitude": -7.5898},
  "predictions": {
    "qualite_eau": "MAUVAISE",
    "score_qualite": 3.2,
    "ph_predit": 8.7,
    "risque_pollution": "ELEVE"
  },
  "confidence": 0.85,
  "timestamp": "2025-10-26T10:35:00Z"
}
```

#### **De Bilal (API REST pour cartes)** :
```
GET http://service_capteurs:8000/api/capteurs/positions
Vous recevez: {
  "positions": [
    {
      "capteur_id": "CAP001",
      "latitude": 33.5731,
      "longitude": -7.5898,
      "nom": "Capteur Rabat Centre",
      "status": "active"
    }
  ]
}
```

### **📊 APIS QUE VOUS POUVEZ CRÉER** :

#### **Service Alertes** :
```
GET /api/alerts/history
Vous retournez: {
  "alerts": [
    {
      "alert_id": "ALERT001",
      "prediction_id": "PRED001",
      "zone": {"latitude": 33.5731, "longitude": -7.5898},
      "type": "QUALITE_EAU_MAUVAISE",
      "message": "Alerte : Qualité eau dégradée - pH élevé",
      "status": "sent",
      "timestamp": "2025-10-26T10:36:00Z"
    }
  ]
}
```

#### **Service API-SIG** :
```
GET /api/map/zones
Vous retournez: {
  "zones": [
    {
      "zone_id": "ZONE_RABAT",
      "nom": "Région Rabat-Salé-Kénitra",
      "center": {"latitude": 34.020882, "longitude": -6.841650},
      "couleur": "rouge",
      "score_qualite": 3.2,
      "derniere_maj": "2025-10-26T10:35:00Z"
    }
  ],
  "capteurs": [
    {
      "capteur_id": "CAP001",
      "position": {"latitude": 33.5731, "longitude": -7.5898},
      "status": "active"
    }
  ]
}
```

**🎯 VOTRE RÔLE : Écouter prédictions → Déclencher notifications → Mettre à jour cartes**

#### **📈 DONNÉES PRODUITES (dans VOS bases)** :
```javascript
// Service Alertes → Stockage dans alerts_db
await db.query(`
  INSERT INTO alerts (alert_id, alert_type_id, zone_latitude, zone_longitude, status) 
  VALUES ($1, $2, $3, $4, 'sent')
`, [alert_id, type_id, lat, lng]);

// Service API-SIG → Stockage dans geo_db (PostGIS)
await db.query(`
  UPDATE zone_status SET status_color = $1, quality_score = $2 
  WHERE zone_id = $3
`, ['red', 3.2, zone_id]);
```

**🎯 FLUX : Redis (prédictions) + APIs (capteurs) → Processing → VOS bases → Notifications + Cartes**

---

## �📋 CE QUE VOUS FAITES

### � **Service Alertes** 
- Envoyer notifications quand qualité eau mauvaise
- Emails, SMS automatiques (Node.js)
- Port : 8004

### �️ **Service API-SIG** 
- Interface carte interactive sur web
- Afficher zones qualité eau avec couleurs (Node.js)
- Port : 8005

---

## � WORKFLOW QUOTIDIEN SIMPLE

### **1. Démarrer votre travail**
```powershell
# 1. Aller dans le projet
cd "C:\Users\Yassin\Documents\EMSI 5\ML+DM+MicroServices\aquawatch-ms"

# 2. Basculer sur votre branche
git checkout dev_yassin

# 3. Récupérer les dernières modifications
git pull origin development

# 4. Démarrer Docker Desktop (attendre qu'il soit vert)

# 5. Démarrer TOUTES les bases + Redis
docker compose up db_capteurs db_satellite db_predictions db_alerts db_geo redis_queue minio_storage -d
```

### **2. Développer vos services**
```powershell
# Service Alertes (Node.js)
docker compose up service_alertes

# OU Service API-SIG (Node.js)
docker compose up service_api_sig
```

**📝 Votre code va dans :**
- **Alertes** : `services/service_alertes/src/`
- **API-SIG** : `services/service_api_sig/src/`

### **3. Sauvegarder votre travail**
```powershell
# 1. Voir ce que vous avez modifié
git status

# 2. Ajouter vos modifications
git add .

# 3. Sauvegarder avec un message
git commit -m "feat: [ce que vous avez fait]"

# 4. Envoyer sur GitHub
git push origin dev_yassin
```

---

## 🔄 PROCESSUS ÉTAPE PAR ÉTAPE - VOS TÂCHES

### **📋 FLUX SERVICE ALERTES** :

#### **Étape 1 - Connecter à PostgreSQL**
- **Outil** : `pg` (Node.js PostgreSQL client)
- **Action** : Connexion à VOTRE base `alerts_db` port 5435
- **Variables** : `DATABASE_URL=postgresql://alerts_user:alerts_pass_2025@db_alerts:5432/alerts_db`

#### **Étape 2 - Configurer Redis listener**
- **Outil** : `redis` Node.js client
- **Action** : S'abonner au canal "new_prediction" de Hamza
- **URL** : `redis://redis_queue:6379`

#### **Étape 3 - Traiter prédictions reçues**
- **Outil** : JavaScript JSON parsing
- **Action** : Analyser score qualité et déterminer si alerte nécessaire
- **Seuils** : Si qualité = "MAUVAISE" ou score < 4.0 → Déclencher alerte

#### **Étape 4 - Configurer Nodemailer**
- **Outil** : `nodemailer` Node.js email client
- **Action** : Configuration SMTP Gmail/Outlook avec credentials .env
- **Variables** : `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`

#### **Étape 5 - Envoyer notifications**
- **Outil** : Nodemailer + templates HTML
- **Action** : Envoyer emails à destinataires dans zone affectée
- **Contenu** : Zone GPS, type alerte, score qualité, timestamp

#### **Étape 6 - Stocker historique**
- **Outil** : PostgreSQL `INSERT` dans table `alerts`
- **Action** : Logger toutes alertes avec status envoi (sent/failed)
- **Traçabilité** : Pour audit et statistiques

#### **Étape 7 - Exposer API historique**
- **Outil** : Express.js routes
- **Action** : Endpoint `/api/alerts/history` pour consultation
- **Filtres** : Par date, zone, type d'alerte

### **📋 FLUX SERVICE API-SIG** :

#### **Étape 1 - Connecter à PostGIS**
- **Outil** : `pg` Node.js + PostGIS extension
- **Action** : Connexion à VOTRE base `geo_db` port 5436
- **Variables** : `DATABASE_URL=postgresql://geo_user:geo_pass_2025@db_geo:5432/geo_db`

#### **Étape 2 - Configurer GeoServer**
- **Outil** : Interface web GeoServer http://localhost:8080/geoserver
- **Action** : Créer workspace "aquawatch", connecter à PostGIS
- **Credentials** : admin/aquawatch123

#### **Étape 3 - Publier couches WMS**
- **Outil** : GeoServer data stores + layer publishing
- **Action** : Publier tables `zones_map`, `poi_map` comme couches WMS
- **Styles** : Couleurs selon status qualité (vert/orange/rouge)

#### **Étape 4 - Récupérer données capteurs**
- **Outil** : `axios` Node.js HTTP client
- **Action** : Appeler API positions de Bilal pour placer capteurs sur carte
- **URL** : `http://service_capteurs:8000/api/capteurs/positions`

#### **Étape 5 - Écouter prédictions Redis**
- **Outil** : Redis subscriber Node.js
- **Action** : Mettre à jour couleurs zones selon nouvelles prédictions
- **PostGIS** : `UPDATE zone_status SET status_color = 'red' WHERE zone_id = ...`

#### **Étape 6 - Créer interface Leaflet**
- **Outil** : Leaflet.js + HTML/CSS/JavaScript
- **Action** : Carte interactive avec couches WMS GeoServer superposées
- **Interactions** : Click sur zone → Popup détails qualité

#### **Étape 7 - Exposer API cartographique**
- **Outil** : Express.js routes + GeoJSON
- **Action** : Endpoints REST `/api/map/zones` format GeoJSON
- **Performance** : Cache résultats, requêtes spatiales optimisées

---

## � VOS TÂCHES DÉTAILLÉES

### **🚨 Service Alertes - Notifications automatiques**

**Votre dossier :** `services/service_alertes/src/`

#### **Phase 1 - API de base**
```javascript
// Créer src/index.js - Serveur Express
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'alertes' });
});

app.get('/api/alertes', (req, res) => {
  res.json({ alertes: ['Mock data'] });
});

app.listen(8000, () => console.log('Service démarré port 8000'));
```

#### **Phase 2 - Envoi emails**
- Configuration Nodemailer (email)
- Templates email d'alerte
- Tester envoi email basique

#### **Phase 3 - Logique alertes**
- **Redis Listener** : Écouter canal `"new_prediction"` de Hamza
- **Conditions** : Si `qualite_eau = "MAUVAISE"` → Déclencher alerte
- **Stockage** : Sauver alerte dans VOTRE base `alerts_db`
- **Notifications** : Envoyer emails/SMS aux destinataires
- **API optionnelle** : `GET /api/alerts/history` pour consultation
- **Outils** : Redis client, Nodemailer, PostgreSQL

**🛠️ OUTILS SERVICE ALERTES :**
- **Express.js** → APIs web + Interface notifications (port 3001)
- **PostgreSQL** → VOTRE base `alerts_db` (port 5435)
- **Redis Client** → Écouter messages de Hamza
- **Nodemailer** → Envoi emails
- **SMS API** → Envoi SMS (optionnel)
- **Interface Web** → Dashboard notifications temps réel

### **�️ Service API-SIG - Interface cartographique**

**Votre dossier :** `services/service_api_sig/src/`

#### **Phase 1 - API de base**
```javascript
// Créer src/index.js - Serveur Express
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-sig' });
});

app.get('/map', (req, res) => {
  res.send('<h1>Carte interactive à venir</h1>');
});

app.listen(8000, () => console.log('Service démarré port 8000'));
```

#### **Phase 2 - Configuration GeoServer**
- **Connexion PostGIS** : Configurer GeoServer → VOTRE base `geo_db`
- **Couches WMS** : Publier zones_map, poi_map via GeoServer
- **Admin GeoServer** : http://localhost:8080/geoserver (admin/aquawatch123)
- **Test couches** : Vérifier WMS fonctionnent

#### **Phase 3 - Page carte web**
- Page HTML avec carte Leaflet.js
- **Couches GeoServer** : Intégrer WMS dans Leaflet
- **Points capteurs de Bilal** → Couche WMS GeoServer

#### **Phase 4 - Cartes géographiques avancées**
- **API à appeler** : `GET service_capteurs:8000/api/capteurs/positions` → GPS capteurs
- **Messages Redis** : Écouter `"new_prediction"` → Scores qualité de Hamza
- **Calcul couleurs** : Vert=bon, Orange=moyen, Rouge=mauvais
- **PostGIS** : Mettre à jour VOTRE base `geo_db` avec nouvelles données
- **GeoServer** : Republier couches WMS avec données temps réel
- **API web** : `GET /api/map/zones` → Endpoint REST + couches WMS
- **Outils** : PostGIS, GeoServer, Leaflet.js, Express.js

**🛠️ OUTILS SERVICE API-SIG :**
- **Express.js** → APIs web + pages HTML (port 3002)
- **PostGIS** → VOTRE base `geo_db` (port 5436)
- **GeoServer** → Serveur cartographique professionnel (port 8080)
- **Leaflet.js** → Cartes interactives JavaScript
- **WMS/WFS** → Services géographiques standards via GeoServer
- **HTTP Client** → Appeler APIs de Bilal
- **HTML/CSS/JS** → Interface web cartographique
- **Interface Web** → Carte interactive avec couches GeoServer

---

## �️ INTERFACES WEB

### **Service Alertes (Port 3001)** :
- **Dashboard Notifications** → Vue en temps réel des alertes
- **Gestion Templates** → Configuration emails/SMS  
- **Historique Alertes** → Archives et statistiques

### **Service API-SIG (Port 3002)** :
- **Carte Interactive** → Visualisation données géospatiales via GeoServer
- **Couches WMS/WFS** → Capteurs + Prédictions + Satellites servies par GeoServer
- **Interface Filtrages** → Par date, zone, type de données
- **GeoServer Admin** → http://localhost:8080/geoserver (admin/aquawatch123)

## �️ CONFIGURATION GEOSERVER

### **Étapes configuration GeoServer** :

#### **1. Accès GeoServer** :
- **URL** : http://localhost:8080/geoserver
- **Login** : admin / aquawatch123

#### **2. Connexion PostGIS** :
```sql
-- Données de connexion à ajouter dans GeoServer
Host: db_geo
Port: 5432
Database: geo_db
User: geo_user
Password: geo_pass_2025
```

#### **3. Couches à publier** :
- **zones_map** → Zones de surveillance eau
- **poi_map** → Points capteurs et alertes
- **Format** : WMS pour cartes web, WFS pour données

#### **4. Services WMS/WFS dans Leaflet** :
```javascript
// Intégrer couches GeoServer dans carte web
L.tileLayer.wms('http://localhost:8080/geoserver/aquawatch/wms', {
    layers: 'aquawatch:zones_map',
    format: 'image/png',
    transparent: true
}).addTo(map);
```

## �🔗 INTÉGRATION SIMPLE

### **APIs à appeler pour récupérer les données** :
```javascript
// Prédictions de Hamza
fetch('http://service_stmodel:8003/api/predictions/latest')
  .then(response => response.json())
  .then(data => {
    if (data.qualite_eau === "MAUVAISE") {
      // Déclencher alerte
    }
  });

// Données capteurs de Bilal pour la carte
fetch('http://service_capteurs:8001/api/capteurs/derniere')
  .then(response => response.json())
  .then(data => {
    // Afficher point sur carte
    map.addMarker(data.localisation);
  });
```

**⚡ RÈGLE SIMPLE : Même format JSON partout = intégration facile !**

---

## 🆘 SI VOUS AVEZ UN PROBLÈME

### **Service Alertes ne démarre pas**
```powershell
# Voir l'erreur
docker compose logs service_alertes

# Reconstruire
docker compose build service_alertes
docker compose up service_alertes
```

### **Service API-SIG ne démarre pas**
```powershell
# Voir l'erreur
docker compose logs service_api_sig

# Reconstruire
docker compose build service_api_sig
docker compose up service_api_sig
```

### **Emails ne partent pas**
```javascript
// Vérifier configuration dans .env
SMTP_HOST=smtp.gmail.com
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
```

### **Carte ne s'affiche pas**
```html
<!-- Vérifier que Leaflet est chargé -->
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
```

### **Git ne marche pas**
```powershell
# Voir l'état
git status

# Si conflit
git pull origin development
# Résoudre conflits manuellement
git add .
git commit -m "fix: résolution conflits"
```

---

**💡 Commencez par une API simple qui retourne "Hello World", puis ajoutez les fonctionnalités une par une !**