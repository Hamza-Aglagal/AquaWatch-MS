# 🎯 GUIDE BILAL - Capteurs + Satellite
**Votre branche : `dev_bilal`**  
**Architecture : MICROSERVICES PROFESSIONNELLE**  
**Vos services : Capteurs (IoT) + Satellite (Images)**

---

## 🏗️ ARCHITECTURE MICROSERVICES

### **🗄️ VOS BASES DE DONNÉES DÉDIÉES** :

#### **Base Capteurs** :
- **Nom** : `capteurs_db` (PostgreSQL port 5433)
- **Tables** : 
  - `capteurs` → Liste capteurs (ID, position GPS, status)
  - `mesures` → Données IoT (pH, température, turbidité, timestamp)
- **Optimisée** : Données temps réel avec index sur temps

#### **Base Satellite** :
- **Nom** : `satellite_db` (MongoDB port 27017)
- **Collections** : 
  - `satellite_images` → Métadonnées images (zone, indices, chemin fichier)
- **Optimisée** : Documents JSON + fichiers volumineux

### **📡 APIS QUE VOUS CRÉEZ** :

#### **Pour Hamza (STModel)** :
```
GET /api/capteurs/data/latest
Format: {
  "capteurs": [
    {
      "capteur_id": "CAP001",
      "latitude": 33.5731,
      "longitude": -7.5898,
      "mesures": {
        "ph": 7.2,
        "temperature": 22.5,
        "turbidite": 12.3,
        "oxygene": 8.1
      },
      "timestamp": "2025-10-26T10:30:00Z"
    }
  ]
}

GET /api/satellite/indices/latest
Format: {
  "indices": [
    {
      "image_id": "SAT001",
      "zone": {"latitude": 33.5731, "longitude": -7.5898, "rayon_km": 5},
      "indices": {
        "chlorophylle": 0.8,
        "turbidite_satellite": 15.2,
        "temperature_surface": 23.1
      },
      "timestamp": "2025-10-26T10:00:00Z"
    }
  ]
}
```

#### **Pour Yassin (API-SIG)** :
```
GET /api/capteurs/positions
Format: {
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



**🎯 VOTRE RÔLE : Collecter données réelles → Stocker dans VOS bases → Exposer APIs**

---

## �📋 CE QUE VOUS FAITES

### 🌡️ **Service Capteurs** 
- Collecter données capteurs IoT (pH, température, turbidité)
- Protocole MQTT + API REST (Node.js)
- Port : 8001

### 🛰️ **Service Satellite** 
- Télécharger images satellites
- Traiter images pour données environnementales (Python)
- Port : 8002

---

## � WORKFLOW QUOTIDIEN SIMPLE

### **1. Démarrer votre travail**
```powershell
# 1. Aller dans le projet
cd "C:\Users\Bilal\Documents\EMSI 5\ML+DM+MicroServices\aquawatch-ms"

# 2. Basculer sur votre branche
git checkout dev_bilal

# 3. Récupérer les dernières modifications
git pull origin development

# 4. Démarrer Docker Desktop (attendre qu'il soit vert)

# 5. Démarrer TOUTES les bases + Redis + MinIO
docker compose up db_capteurs db_satellite db_predictions db_alerts db_geo redis_queue minio_storage -d
```

## � WORKFLOW QUOTIDIEN SIMPLE

### **🔨 PREMIÈRE FOIS - BUILD VOS SERVICES**
```powershell
# 1. Aller dans le projet
cd "C:\Users\Bilal\Documents\EMSI 5\ML+DM+MicroServices\aquawatch-ms"

# 2. Basculer sur votre branche
git checkout dev_bilal

# 3. Build VOS services (une seule fois)
docker compose build service_capteurs service_satellite

# 4. Build infrastructure complète (première fois)
docker compose build
```

### **🚀 QUOTIDIEN - UP SERVICES SEULEMENT**

#### **Démarrer votre travail** :
```powershell
# 1. Récupérer les dernières modifications
git pull origin development

# 2. Démarrer Docker Desktop (attendre qu'il soit vert)

# 3. Démarrer VOS bases + stockage (sans build)
docker compose up db_capteurs db_satellite minio_storage redis_queue -d

# 4. Développer un service spécifique (sans build)
docker compose up service_capteurs    # Pour service capteurs
# OU
docker compose up service_satellite   # Pour service satellite
```

#### **Pendant développement** :
```powershell
# Modifier votre code dans services/service_capteurs/src/ ou services/service_satellite/src/

# Redémarrage rapide après modifications
docker compose restart service_capteurs

# Voir les logs en temps réel
docker compose logs -f service_capteurs
```

#### **Quand rebuilder** :
```powershell
# REBUILD seulement si :
# ✅ Vous modifiez package.json (Node.js) ou requirements.txt (Python)
# ✅ Vous modifiez Dockerfile
# ✅ Erreur "module not found"

# Rebuild votre service spécifique
docker compose build service_capteurs
docker compose up service_capteurs

# OU
docker compose build service_satellite  
docker compose up service_satellite
```

### **⚡ COMMANDES RAPIDES BILAL**

#### **Workflow service capteurs** :
```powershell
# Démarrer environnement capteurs
docker compose up db_capteurs redis_queue -d
docker compose up service_capteurs -d

# Tester API
curl http://localhost:8001/health

# Debug
docker compose logs -f service_capteurs
docker compose restart service_capteurs
```

#### **Workflow service satellite** :
```powershell
# Démarrer environnement satellite  
docker compose up db_satellite minio_storage redis_queue -d
docker compose up service_satellite -d

# Tester API
curl http://localhost:8002/health

# Vérifier MinIO
# Ouvrir : http://localhost:9001 (admin/aquawatch123)

# Debug
docker compose logs -f service_satellite
docker compose restart service_satellite
```

### **2. Développer vos services**
```powershell
# Service Capteurs (Node.js)
docker compose up service_capteurs

# OU Service Satellite (Python)
docker compose up service_satellite
```

**📝 Votre code va dans :**
- **Capteurs** : `services/service_capteurs/src/`
- **Satellite** : `services/service_satellite/src/`

### **3. Sauvegarder votre travail**
```powershell
# 1. Voir ce que vous avez modifié
git status

# 2. Ajouter vos modifications
git add .

# 3. Sauvegarder avec un message
git commit -m "feat: [ce que vous avez fait]"

# 4. Envoyer sur GitHub
git push origin dev_bilal
```

---

## 🔄 PROCESSUS ÉTAPE PAR ÉTAPE - VOS TÂCHES

### **📋 FLUX SERVICE CAPTEURS** :

#### **Étape 1 - Connecter à TimescaleDB**
- **Outil** : `pg` (Node.js PostgreSQL client)
- **Action** : Connexion à VOTRE base `capteurs_db` port 5433
- **Variables** : `DATABASE_URL=postgresql://capteurs_user:capteurs_pass_2025@db_capteurs:5432/capteurs_db`

#### **Étape 2 - Configurer MQTT**
- **Outil** : `mqtt` (Node.js MQTT client)
- **Action** : Se connecter à broker MQTT (test.mosquitto.org ou local)
- **Écouter** : Topics capteurs IoT (`aquawatch/capteur/+/data`)

#### **Étape 3 - Traiter données reçues**
- **Outil** : JavaScript parsing
- **Action** : Extraire pH, température, turbidité des messages MQTT
- **Validation** : Vérifier format et seuils données

#### **Étape 4 - Stocker dans hypertable**
- **Outil** : TimescaleDB `INSERT` optimisé
- **Action** : Insérer mesures dans table `mesures` (hypertable)
- **Performance** : Utiliser batch inserts pour volume

#### **Étape 5 - Exposer API REST**
- **Outil** : Express.js routes
- **Action** : Créer endpoints `/api/capteurs/data/latest` et `/api/capteurs/positions`
- **Format** : JSON standardisé pour Hamza et Yassin

### **📋 FLUX SERVICE SATELLITE** :

#### **Étape 1 - Connecter à MongoDB**
- **Outil** : `pymongo` (Python MongoDB driver)
- **Action** : Connexion à VOTRE base `satellite_db` port 27017
- **Variables** : `MONGODB_URL=mongodb://satellite_user:satellite_pass_2025@db_satellite:27017/satellite_db`

#### **Étape 2 - Configurer MinIO**
- **Outil** : `minio` Python client
- **Action** : Connexion stockage port 9000, créer bucket "satellite-images"
- **Console** : Vérifier via http://localhost:9001

#### **Étape 3 - Télécharger images satellites**
- **Outil** : `sentinelhub` API Python
- **Action** : Requêtes images Sentinel-2 par zone géographique
- **Authentification** : Clés API Copernicus dans .env

#### **Étape 4 - Traiter avec GDAL**
- **Outil** : `GDAL` + `rasterio` Python
- **Action** : Extraire indices chlorophylle, NDWI, turbidité des images
- **Algorithmes** : Calculs bandes spectrales Sentinel-2

#### **Étape 5 - Stocker métadonnées + fichiers**
- **Outil** : MongoDB pour métadonnées + MinIO pour fichiers
- **Action** : Sauver indices dans collection + path image dans MinIO
- **Organisation** : Structure bucket par date/zone

#### **Étape 6 - Exposer API FastAPI**
- **Outil** : FastAPI routes Python
- **Action** : Endpoint `/api/satellite/indices/latest` avec indices calculés
- **Format** : JSON avec coordonnées GPS pour Hamza

---

## � VOS TÂCHES DÉTAILLÉES

### **🌡️ Service Capteurs - Données IoT temps réel**

**Votre dossier :** `services/service_capteurs/src/`

#### **Phase 1 - API de base**
```javascript
// Créer src/index.js - Serveur Express
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'capteurs' });
});

app.get('/api/capteurs', (req, res) => {
  res.json({ capteurs: ['Mock data'] });
});

app.listen(8000, () => console.log('Service démarré port 8000'));
```

#### **Phase 2 - Collecte + Stockage**
- **MQTT** : Écouter messages capteurs IoT
- **Parsing** : Extraire pH, température, turbidité
- **Stockage** : Sauver dans VOTRE base `capteurs_db` uniquement
- **Outils** : MQTT client, PostgreSQL, Node.js

#### **Phase 3 - APIs pour autres services** 
- **`GET /api/capteurs/data/latest`** → Hamza récupère données pour ML
- **`GET /api/capteurs/positions`** → Yassin récupère GPS pour cartes
- **Formats** : JSON standardisés (voir section APIs ci-dessus)
- **Outils** : Express.js, PostgreSQL queries

**🛠️ OUTILS SERVICE CAPTEURS :**
- **Express.js** → APIs web
- **TimescaleDB** → VOTRE base `capteurs_db` (port 5433) - Optimisée séries temporelles
- **MQTT Client** → Écouter capteurs IoT
- **Hypertables** → Performance maximale pour données temps réel IoT
- **Docker** → Votre service en container

### **�️ Service Satellite - Images et analyses**

**Votre dossier :** `services/service_satellite/src/`

#### **Phase 1 - API de base**
```python
# Créer src/index.py - API FastAPI
from fastapi import FastAPI
app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "service": "satellite"}

@app.get("/api/images")
def get_images():
    return {"images": ["Mock data"]}
```

#### **Phase 2 - Images + Stockage**
- **SentinelHub API** : Télécharger images Sentinel-2 directement
- **Fichiers images** : Stocker dans **MinIO** (`infrastructure/minio_storage/data/`)
- **Métadonnées** : Sauver infos dans VOTRE base `satellite_db` MongoDB
- **MinIO Console** : Accessible sur http://localhost:9001 (admin/aquawatch123)
- **Outils** : GDAL, Rasterio, SentinelHub, MongoDB, MinIO client

#### **Phase 3 - Traitement géospatial + API**
- **GDAL/Rasterio** : Traitement professionnel rasters satellites
- **Variables dérivées** : Chlorophylle, turbidité, NDWI avec algorithmes optimisés
- **`GET /api/satellite/indices/latest`** → Hamza récupère indices pour ML
- **Format** : JSON standardisé avec coordonnées géographiques précises
- **Outils** : Traitement image Python, FastAPI

**🛠️ OUTILS SERVICE SATELLITE :**
- **FastAPI** → APIs web
- **MongoDB** → VOTRE base `satellite_db` (port 27017)
- **MinIO** → Stockage fichiers images (port 9000, console 9001)
- **GDAL + Rasterio** → Traitement géospatial professionnel
- **SentinelHub API** → Accès direct Copernicus/Sentinel-2
- **Python Image Processing** → Traitement images satellites

**📁 STOCKAGE IMAGES + GÉOSPATIAL :**
- **Emplacement** : `infrastructure/minio_storage/data/`
- **Accès web** : http://localhost:9001 (admin/aquawatch123)
- **Buckets** : Créer "satellite-images" pour organiser fichiers
- **Variables dérivées** : Chlorophylle, turbidité, NDWI via GDAL

---

## 🔗 INTÉGRATION SIMPLE

### **APIs à créer pour Hamza et Yassin** :
```javascript
// Dans service_capteurs/src/index.js
app.get('/api/capteurs/derniere', (req, res) => {
  res.json({
    "capteur_id": "CAP001",
    "localisation": {"latitude": 33.5731, "longitude": -7.5898},
    "mesures": {"ph": 7.2, "temperature": 22.5, "turbidite": 12.3}
  });
});
```

```python
# Dans service_satellite/src/index.py
@app.get("/api/satellite/indices")
def get_satellite_data():
    return {
        "zone": {"latitude": 33.5731, "longitude": -7.5898},
        "indices": {"chlorophylle": 0.8, "turbidite_satellite": 15.2}
    }
```

**⚡ RÈGLE SIMPLE : Même format JSON partout = intégration facile !**

---

## 🆘 SI VOUS AVEZ UN PROBLÈME

### **Service Node.js ne démarre pas**
```powershell
# Voir l'erreur
docker compose logs service_capteurs

# Reconstruire  
docker compose build service_capteurs
docker compose up service_capteurs
```

### **Service Python ne démarre pas**
```powershell  
# Voir l'erreur
docker compose logs service_satellite

# Reconstruire
docker compose build service_satellite
docker compose up service_satellite
```

### **MQTT ne fonctionne pas**
```powershell
# Utiliser un broker MQTT public pour tester
# test.mosquitto.org:1883
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