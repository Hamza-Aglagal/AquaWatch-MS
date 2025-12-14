# 📋 TRAVAIL DE BILAL EL KHANTOURI - AQUAWATCH PROJECT

**Développeur:** Bilal El Khantouri  
**Services assignés:** Service Capteurs (Port 8001) + Service Satellite (Port 8002)  
**Technologies:** Node.js/Express.js + Python/FastAPI, TimescaleDB, MongoDB, MinIO  
**Date:** Décembre 2024

---

## 🎯 RÉSUMÉ GÉNÉRAL

Bilal est responsable de **la collecte et du traitement des données d'entrée** du système AquaWatch. Il gère deux services microservices critiques qui fournissent des données en temps réel et historiques pour l'ensemble de la plateforme.

**Mission principale:** Collecter les données IoT des capteurs physiques et traiter les images satellites pour extraire des indicateurs de qualité de l'eau, puis exposer ces données via des APIs REST pour les autres services (STModel de Hamza et API-SIG/Alertes de Yassin).

---

## 📊 SERVICE 1 : SERVICE CAPTEURS (Port 8001)

### 🏗️ ARCHITECTURE ET STRUCTURE

**Chemin du service:** `services/service_capteurs/`

**Structure des fichiers:**
```
service_capteurs/
├── src/
│   ├── index.js                      # Point d'entrée Express
│   ├── config/
│   │   ├── database.js               # Connexion TimescaleDB
│   │   ├── logger.js                 # Configuration Winston logs
│   │   └── env.js                    # Validation variables environnement
│   ├── models/
│   │   ├── Capteur.js                # Modèle Sequelize capteurs
│   │   └── Mesure.js                 # Modèle Sequelize mesures
│   ├── controllers/
│   │   └── capteursController.js     # Logique métier APIs
│   ├── routes/
│   │   └── capteurs.js               # Définition routes Express
│   └── services/
│       └── mqttService.js            # Simulation réception MQTT
├── package.json                       # Dépendances Node.js
├── Dockerfile                         # Image Docker service
└── README.md                          # Documentation
```

### 🔧 TECHNOLOGIES ET OUTILS UTILISÉS

**Backend:**
- **Node.js 20** - Runtime JavaScript serveur
- **Express.js 4.18** - Framework web léger et rapide
- **Sequelize 6.33** - ORM pour interactions base de données
- **MQTT Client (Simulation)** - Simulation protocole IoT pour capteurs

**Base de données:**
- **TimescaleDB (PostgreSQL 14)** - Base de données optimisée séries temporelles
  - Port: 5433 (externe), 5432 (interne)
  - Database: `capteurs_db`
  - User: `capteurs_user`
  - Extension Hypertables pour performance temps réel

**Sécurité et logging:**
- **Helmet** - Sécurisation headers HTTP
- **Winston** - Système de logging avancé
- **CORS** - Gestion Cross-Origin Resource Sharing
- **Joi** - Validation des données d'entrée

### 📋 PROCESSUS DE FONCTIONNEMENT

**Étape 1 : Connexion à TimescaleDB**
- Utilise Sequelize pour établir la connexion PostgreSQL
- Système de retry automatique (5 tentatives, délai 3s)
- Validation des credentials via variables d'environnement
- Création automatique des tables si absentes

**Étape 2 : Définition des modèles de données**

**Modèle Capteur:**
```javascript
{
  capteur_id: String PRIMARY KEY,    // Identifiant unique (CAP001, CAP002...)
  nom: String,                       // Nom descriptif
  latitude: Decimal(10,8),           // Coordonnée GPS latitude
  longitude: Decimal(11,8),          // Coordonnée GPS longitude
  type: String,                      // Type de capteur (aquatique, fluvial)
  status: String,                    // État (active, inactive, maintenance)
  created_at: Timestamp,             // Date d'installation
  updated_at: Timestamp              // Dernière mise à jour
}
```

**Modèle Mesure (Hypertable TimescaleDB):**
```javascript
{
  id: Integer AUTOINCREMENT,
  capteur_id: String FOREIGN KEY,    // Référence au capteur
  timestamp: Timestamp,              // Horodatage mesure
  ph: Decimal(4,2),                  // pH de l'eau (0-14)
  temperature: Decimal(5,2),         // Température en °C
  turbidite: Decimal(8,2),           // Turbidité en NTU
  oxygene: Decimal(8,2),             // Oxygène dissous en mg/L
  conductivite: Decimal(10,2)        // Conductivité en µS/cm
}
```

**Étape 3 : Simulation MQTT**
- Script automatique `mqttService.js` génère des mesures toutes les 30 secondes
- Génération de valeurs réalistes aléatoires dans des plages acceptables
- Insertion automatique dans TimescaleDB via Sequelize
- Logs détaillés de chaque mesure générée

**Étape 4 : Exposition des APIs REST**

**API 1 - Liste des capteurs:**
```
GET /api/capteurs
Retourne: Liste complète des capteurs avec métadonnées
Utilisé par: Interface administrateur
```

**API 2 - Positions GPS (pour Yassin - Carte):**
```
GET /api/capteurs/positions
Retourne: {
  success: true,
  count: 3,
  positions: [
    {
      capteur_id: "CAP001",
      nom: "Capteur Rabat Centre",
      latitude: 34.020882,
      longitude: -6.841650,
      status: "active"
    },
    ...
  ]
}
```

**API 3 - Dernières mesures (pour Hamza - Machine Learning):**
```
GET /api/capteurs/data/latest?limit=10&hours=24
Retourne: Mesures des dernières X heures avec coordonnées GPS
Format: {
  success: true,
  count: 10,
  period: "24h",
  capteurs: [
    {
      capteur_id: "CAP001",
      latitude: 34.020882,
      longitude: -6.841650,
      mesures: {
        ph: 7.2,
        temperature: 22.5,
        turbidite: 12.3,
        oxygene: 8.1,
        conductivite: 450.2
      },
      timestamp: "2024-12-14T10:30:00Z"
    }
  ]
}
```

**API 4 - Ajout mesure manuelle:**
```
POST /api/capteurs/mesures
Body: { capteur_id, ph, temperature, turbidite, oxygene, conductivite }
Utilisé par: Tests et intégration manuelle
```

**API 5 - Historique capteur:**
```
GET /api/capteurs/:capteurId/mesures?limit=100
Retourne: Historique complet des mesures d'un capteur spécifique
```

### 🎯 RÔLE DANS L'ARCHITECTURE GLOBALE

**Données fournies à Hamza (STModel):**
- Mesures en temps réel avec coordonnées géographiques
- Historique temporel pour entraînement modèles ML
- Endpoint optimisé `/api/capteurs/data/latest` avec filtres
- Format standardisé JSON pour parsing Python

**Données fournies à Yassin (API-SIG):**
- Positions GPS exactes des capteurs actifs
- Métadonnées pour affichage sur carte Leaflet
- Status des capteurs pour indicateurs visuels
- Endpoint `/api/capteurs/positions` format GeoJSON-compatible

**Intégration Docker:**
```yaml
service_capteurs:
  build: ./services/service_capteurs
  depends_on: [db_capteurs]
  ports: ["8001:8000"]
  environment:
    - DB_HOST=db_capteurs
    - DB_NAME=capteurs_db
    - DB_USER=capteurs_user
    - DB_PASSWORD=capteurs_pass
```

---

## 🛰️ SERVICE 2 : SERVICE SATELLITE (Port 8002)

### 🏗️ ARCHITECTURE ET STRUCTURE

**Chemin du service:** `services/service_satellite/`

**Structure des fichiers:**
```
service_satellite/
├── app/
│   ├── main.py                       # Point d'entrée FastAPI
│   ├── config/
│   │   ├── database.py               # Connexion MongoDB
│   │   ├── minio.py                  # Client MinIO S3
│   │   └── sentinel.py               # Configuration SentinelHub API
│   ├── models/
│   │   └── satellite.py              # Modèles Pydantic validation
│   ├── routes/
│   │   └── satellite.py              # Routes API FastAPI
│   └── services/
│       ├── download.py               # Téléchargement images Sentinel-2
│       └── processing.py             # Traitement géospatial GDAL
├── requirements.txt                   # Dépendances Python
├── Dockerfile                         # Image Docker service
└── README.md                          # Documentation
```

### 🔧 TECHNOLOGIES ET OUTILS UTILISÉS

**Backend:**
- **Python 3.11** - Langage scientifique pour traitement image
- **FastAPI 0.104** - Framework web moderne asynchrone
- **Uvicorn** - Serveur ASGI haute performance
- **Pydantic 2.5** - Validation et sérialisation données

**Bases de données et stockage:**
- **MongoDB 6.0** - Base NoSQL pour métadonnées images
  - Port: 27017
  - Database: `satellite_db`
  - Collection: `satellite_images`
- **MinIO (S3-compatible)** - Stockage objet pour fichiers images
  - Port API: 9000
  - Port Console: 9001
  - Credentials: admin/aquawatch123
  - Bucket: `satellite-images`

**Traitement géospatial:**
- **GDAL** - Bibliothèque géospatiale professionnelle
- **Rasterio** - Interface Python pour données raster
- **NumPy** - Calculs matriciels optimisés
- **SentinelHub API** - Accès images Sentinel-2 Copernicus

### 📋 PROCESSUS DE FONCTIONNEMENT

**Étape 1 : Connexion aux infrastructures**
- Connexion MongoDB avec PyMongo (retry 5 fois, délai 3s)
- Initialisation client MinIO pour stockage S3
- Vérification bucket `satellite-images` existe, sinon création
- Configuration credentials SentinelHub depuis variables environnement

**Étape 2 : Configuration SentinelHub**
```python
class SentinelConfig:
    config = SHConfig()
    config.sh_client_id = os.getenv("SENTINEL_CLIENT_ID")
    config.sh_client_secret = os.getenv("SENTINEL_CLIENT_SECRET")
    config.sh_base_url = "https://services.sentinel-hub.com"
```

**Étape 3 : Téléchargement images Sentinel-2**

**Service `download.py`:**
```python
def download_image(latitude, longitude, rayon_km=5.0):
    # Calculer bounding box autour du point GPS
    bbox = BBox([lon-delta, lat-delta, lon+delta, lat+delta], crs=CRS.WGS84)
    
    # Période : derniers 7 jours
    time_interval = (now - 7days, now)
    
    # Evalscript pour bandes Sentinel-2
    evalscript = """
    //VERSION=3
    function setup() {
        return {
            input: ["B02", "B03", "B04", "B08"],  // Blue, Green, Red, NIR
            output: { bands: 4 }
        };
    }
    function evaluatePixel(sample) {
        return [sample.B02, sample.B03, sample.B04, sample.B08];
    }
    """
    
    # Requête SentinelHub
    request = SentinelHubRequest(
        evalscript=evalscript,
        input_data=[SentinelHubRequest.input_data(
            data_collection=DataCollection.SENTINEL2_L2A,
            time_interval=time_interval
        )],
        responses=[SentinelHubRequest.output_response('default', MimeType.TIFF)],
        bbox=bbox,
        size=[512, 512]
    )
    
    return request.get_data()[0]  # Retourne array NumPy 512x512x4
```

**Étape 4 : Traitement géospatial et calcul indices**

**Service `processing.py`:**

**1. NDWI (Normalized Difference Water Index):**
```python
def calculate_ndwi(nir_band, green_band):
    """
    NDWI = (Green - NIR) / (Green + NIR)
    Valeurs: -1 à +1
    Interprétation: >0.3 = eau, 0-0.3 = humidité, <0 = sol sec
    """
    numerator = green_band - nir_band
    denominator = green_band + nir_band
    ndwi = np.mean(numerator / (denominator + 1e-10))
    return float(ndwi)
```

**2. Chlorophylle (estimation):**
```python
def calculate_chlorophyll(red_band, nir_band):
    """
    Chlorophylle ~ NIR / Red
    Valeurs: 0-10+ mg/m³
    Interprétation: >5 = bloom algues, 1-5 = normal, <1 = pauvre
    """
    ratio = nir_band / (red_band + 1e-10)
    chlorophyll = np.mean(ratio)
    return float(chlorophyll)
```

**3. Turbidité satellite:**
```python
def calculate_turbidity(red_band):
    """
    Turbidité ~ Red band reflectance
    Valeurs: 0-100+ NTU
    Interprétation: >50 = très turbide, 10-50 = moyen, <10 = clair
    """
    turbidity = np.mean(red_band) * 100
    return float(turbidity)
```

**Étape 5 : Stockage des résultats**

**Dans MongoDB (`satellite_images` collection):**
```javascript
{
  image_id: "SAT001",
  zone: {
    latitude: 33.5731,
    longitude: -7.5898,
    rayon_km: 5
  },
  timestamp: "2024-12-14T10:00:00Z",
  source: "Sentinel-2",
  indices: {
    chlorophylle: 0.8,
    turbidite_satellite: 15.2,
    ndwi: 0.45,
    temperature_surface: null
  },
  file_path: "satellite-images/SAT001.tiff",
  processed: true,
  metadata: {
    cloud_cover: 12.5,
    resolution_m: 10,
    bands_used: ["B02", "B03", "B04", "B08"]
  }
}
```

**Dans MinIO S3:**
- Fichier TIFF original: `satellite-images/SAT001.tiff`
- Organisation par date: `satellite-images/2024/12/14/SAT001.tiff`

**Étape 6 : Exposition des APIs REST**

**API 1 - Health Check:**
```
GET /health
Retourne: {
  status: "ok",
  service: "satellite",
  mongodb: "connected",
  minio: "connected"
}
```

**API 2 - Derniers indices (pour Hamza - Machine Learning):**
```
GET /api/satellite/indices/latest?limit=10&hours=24
Retourne: {
  success: true,
  count: 10,
  period: "24h",
  indices: [
    {
      image_id: "SAT001",
      latitude: 33.5731,
      longitude: -7.5898,
      indices: {
        chlorophylle: 0.8,
        turbidite_satellite: 15.2,
        ndwi: 0.45
      },
      timestamp: "2024-12-14T10:00:00Z",
      confidence: 0.92
    }
  ]
}
```

**API 3 - Liste images:**
```
GET /api/satellite/images?skip=0&limit=10
Retourne: Liste paginée de toutes les images avec métadonnées
```

**API 4 - Recherche par localisation:**
```
GET /api/satellite/indices/location?latitude=33.5731&longitude=-7.5898&rayon_km=10&hours=336
Retourne: Indices dans un rayon géographique sur période donnée
```

### 🎯 RÔLE DANS L'ARCHITECTURE GLOBALE

**Données fournies à Hamza (STModel):**
- Indices satellites calculés (chlorophylle, turbidité, NDWI)
- Coordonnées géographiques pour fusion avec données capteurs
- Séries temporelles pour entraînement modèles spatio-temporels
- Format JSON standardisé compatible NumPy/Pandas

**Données fournies à Yassin (API-SIG):**
- Positions GPS des images pour affichage carte
- Indices de qualité pour coloration zones géographiques
- Métadonnées pour tooltips et popups interface web
- Timestamps pour suivi temporel

**Intégration Docker:**
```yaml
service_satellite:
  build: ./services/service_satellite
  depends_on: [db_satellite, minio_storage]
  ports: ["8002:8000"]
  environment:
    - MONGODB_URL=mongodb://satellite_user:satellite_pass_2025@db_satellite:27017/satellite_db
    - MINIO_ENDPOINT=minio_storage:9000
    - SENTINEL_CLIENT_ID=${SENTINEL_CLIENT_ID}
    - SENTINEL_CLIENT_SECRET=${SENTINEL_CLIENT_SECRET}
```

---

## 🔄 INTÉGRATION ENTRE LES DEUX SERVICES

### Communication avec STModel (Hamza)

**Service Capteurs → STModel:**
```python
# Dans STModel (Hamza)
import requests

# Récupération données capteurs
response = requests.get(
    "http://service_capteurs:8000/api/capteurs/data/latest",
    params={"limit": 100, "hours": 24}
)
capteur_data = response.json()["capteurs"]
```

**Service Satellite → STModel:**
```python
# Récupération indices satellites
response = requests.get(
    "http://service_satellite:8000/api/satellite/indices/latest",
    params={"limit": 50, "hours": 72}
)
satellite_data = response.json()["indices"]

# Fusion données pour ML
merged_data = fusion_spatiotemporelle(capteur_data, satellite_data)
```

### Communication avec API-SIG (Yassin)

**Service Capteurs → API-SIG:**
```javascript
// Dans API-SIG (Yassin)
const axios = require('axios');

// Synchronisation positions capteurs
const response = await axios.get('http://service_capteurs:8000/api/capteurs/positions');
const capteurs = response.data.positions;

// Insertion dans PostGIS
for (const capteur of capteurs) {
    await PointInteret.create({
        capteur_id: capteur.capteur_id,
        nom: capteur.nom,
        latitude: capteur.latitude,
        longitude: capteur.longitude,
        type: 'capteur'
    });
}
```

---

## 📊 TESTS ET VALIDATION

### Tests Service Capteurs

**Test 1 - Connexion TimescaleDB:**
```powershell
docker compose exec db_capteurs psql -U capteurs_user -d capteurs_db -c "SELECT version();"
```

**Test 2 - API Health:**
```powershell
curl http://localhost:8001/health
# Attendu: {"status":"OK","timestamp":"2024-12-14T..."}
```

**Test 3 - API Positions:**
```powershell
curl http://localhost:8001/api/capteurs/positions
# Attendu: JSON avec 3 capteurs (CAP001, CAP002, CAP003)
```

**Test 4 - Simulation MQTT:**
```powershell
docker logs aquawatch-ms-service_capteurs-1 --tail 20
# Attendu: Logs "Mesure générée" toutes les 30s
```

### Tests Service Satellite

**Test 1 - Connexion MongoDB:**
```powershell
docker compose exec db_satellite mongosh -u satellite_user -p satellite_pass_2025 --eval "db.satellite_images.countDocuments()"
```

**Test 2 - MinIO Console:**
```
Ouvrir http://localhost:9001
Login: admin / aquawatch123
Vérifier bucket: satellite-images
```

**Test 3 - API Indices:**
```powershell
curl "http://localhost:8002/api/satellite/indices/latest?limit=5"
# Attendu: JSON avec indices calculés
```

**Test 4 - Documentation Interactive:**
```
Ouvrir http://localhost:8002/docs
Tester endpoint /api/satellite/images
```

---

## 🎓 COMPÉTENCES DÉVELOPPÉES

### Compétences techniques Bilal

**Backend Development:**
- Architecture microservices avec Node.js et Python
- APIs RESTful avec Express.js et FastAPI
- ORMs (Sequelize, PyMongo)
- Validation données (Joi, Pydantic)
- Logging professionnel (Winston)

**Bases de données:**
- TimescaleDB pour séries temporelles
- MongoDB NoSQL pour documents
- Optimisation requêtes avec index
- Gestion migrations et schemas

**Traitement données:**
- Traitement images satellites avec GDAL/Rasterio
- Calculs géospatiaux et indices environnementaux
- Algorithmes de détection qualité eau
- Manipulation arrays NumPy

**DevOps:**
- Dockerisation services
- Docker Compose multi-containers
- Gestion variables environnement
- Networking Docker inter-services

**Protocoles et APIs:**
- MQTT pour IoT (simulation)
- API REST design best practices
- SentinelHub API intégration
- MinIO S3 API

---

## 📝 RÉSUMÉ STATISTIQUES

### Service Capteurs
- **Endpoints API:** 5
- **Modèles de données:** 2 (Capteur, Mesure)
- **Capteurs actifs:** 3 (Rabat, Casablanca, Fès)
- **Fréquence mesures:** Toutes les 30 secondes
- **Base de données:** TimescaleDB (PostgreSQL 14)
- **Port:** 8001
- **Lignes de code:** ~800 lignes JavaScript

### Service Satellite
- **Endpoints API:** 4
- **Modèles de données:** 4 (ZoneGeographique, IndicesSatellite, SatelliteImage, Response)
- **Indices calculés:** 3 (NDWI, Chlorophylle, Turbidité)
- **Résolution images:** 512x512 pixels
- **Bandes spectrales:** 4 (Blue, Green, Red, NIR)
- **Base de données:** MongoDB 6.0
- **Stockage:** MinIO S3-compatible
- **Port:** 8002
- **Lignes de code:** ~600 lignes Python

---

## 🚀 IMPACT SUR LE PROJET

**Criticité:** ⭐⭐⭐⭐⭐ (5/5)

Les deux services de Bilal sont la **foundation du système AquaWatch**. Sans les données capteurs et satellites, aucun autre service ne peut fonctionner:

- **STModel de Hamza** dépend à 100% des données de Bilal pour entraîner ses modèles ML
- **API-SIG de Yassin** utilise les positions GPS pour la cartographie
- **Service Alertes de Yassin** reçoit indirectement les prédictions basées sur les données de Bilal

**Valeur ajoutée:**
- Collecte automatisée et fiable de données temps réel
- Traitement géospatial professionnel des images satellites
- APIs performantes et bien documentées
- Architecture scalable et maintenable

---

**Document généré le:** 14 décembre 2024  
**Version:** 1.0  
**Contact projet:** AquaWatch-MS Team
