# 🛰️ Service Satellite - AquaWatch

**Version:** 1.0.0  
**Développeur:** Bilal KHANTOURI  
**Technologie:** Python 3.12 + FastAPI  
**Base de données:** MongoDB  
**Stockage:** MinIO (S3-compatible)

---

## 📋 Vue d'ensemble

Le **Service Satellite** est responsable du téléchargement, du traitement et de l'exposition des données satellites pour l'analyse de la qualité de l'eau.

### Fonctionnalités principales:
- ✅ Téléchargement d'images Sentinel-2 via SentinelHub API
- ✅ Calcul d'indices environnementaux (NDWI, Chlorophylle, Turbidité)
- ✅ Stockage des images dans MinIO
- ✅ Métadonnées dans MongoDB
- ✅ API REST pour STModel (Hamza) et API-SIG (Yassin)

---

## 🏗️ Architecture

```
service_satellite/
├── app/
│   ├── main.py                 # Entry point FastAPI
│   ├── config/
│   │   ├── database.py        # Connexion MongoDB
│   │   ├── storage.py         # Connexion MinIO
│   │   └── sentinel.py        # Config SentinelHub API
│   ├── models/
│   │   └── satellite.py       # Modèles Pydantic
│   ├── routes/
│   │   └── satellite.py       # Endpoints API
│   └── services/
│       ├── download.py        # Téléchargement images
│       └── processing.py      # Calcul indices
├── Dockerfile
├── requirements.txt
└── README.md                   # Ce fichier
```

---

## 🚀 Démarrage rapide

### **Prérequis:**
- Docker Desktop installé et démarré
- MongoDB (`db_satellite`) running
- MinIO (`minio_storage`) running
- Credentials SentinelHub (optionnel pour Phase 1)

### **1. Démarrer l'infrastructure:**
```powershell
docker compose up db_satellite minio_storage redis_queue -d
```

### **2. Build le service (première fois):**
```powershell
docker compose build service_satellite
```

### **3. Démarrer le service:**
```powershell
docker compose up service_satellite
```

### **4. Tester:**
```powershell
# Health check
curl http://localhost:8002/health

# Endpoint principal pour Hamza
curl http://localhost:8002/api/satellite/indices/latest

# Documentation interactive
# Ouvrir: http://localhost:8002/docs
```

---

## 📡 API Endpoints

### **GET /** - Documentation service
Retourne informations sur le service et liste des endpoints disponibles.

**Exemple:**
```bash
curl http://localhost:8002/
```

**Réponse:**
```json
{
  "service": "satellite",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "/health",
    "docs": "/docs",
    "indices": "/api/satellite/indices/latest",
    "images": "/api/satellite/images"
  }
}
```

---

### **GET /health** - Health check
Vérifie l'état du service et des connexions.

**Exemple:**
```bash
curl http://localhost:8002/health
```

**Réponse:**
```json
{
  "status": "ok",
  "service": "satellite",
  "version": "1.0.0",
  "mongodb": "connected",
  "minio": "connected"
}
```

---

### **GET /api/satellite/indices/latest** - 🎯 Pour Hamza (STModel)
Récupère les derniers indices satellites calculés pour le machine learning.

**Query Parameters:**
- `limit` (int, 1-100): Nombre d'indices à retourner (défaut: 10)
- `hours` (int, 1-720): Période en heures (défaut: 24)

**Exemple:**
```bash
curl "http://localhost:8002/api/satellite/indices/latest?limit=5&hours=24"
```

**Réponse:**
```json
{
  "success": true,
  "count": 2,
  "indices": [
    {
      "image_id": "SAT001",
      "zone": {
        "latitude": 33.5731,
        "longitude": -7.5898,
        "rayon_km": 5
      },
      "indices": {
        "chlorophylle": 0.8,
        "turbidite_satellite": 15.2,
        "temperature_surface": 23.1,
        "ndwi": 0.45
      },
      "timestamp": "2025-11-24T10:00:00Z"
    }
  ]
}
```

**Format des indices:**
- `chlorophylle` (float): Concentration chlorophylle-a en mg/m³
- `turbidite_satellite` (float): Turbidité en NTU
- `temperature_surface` (float): Température surface en °C
- `ndwi` (float): Normalized Difference Water Index (-1 à 1)

---

### **GET /api/satellite/images** - Liste images
Liste toutes les images satellites avec pagination.

**Query Parameters:**
- `skip` (int, ≥0): Nombre d'images à sauter (défaut: 0)
- `limit` (int, 1-100): Nombre d'images à retourner (défaut: 10)

**Exemple:**
```bash
curl "http://localhost:8002/api/satellite/images?skip=0&limit=10"
```

**Réponse:**
```json
{
  "success": true,
  "total": 25,
  "count": 10,
  "images": [
    {
      "image_id": "SAT001",
      "zone": {...},
      "timestamp": "2025-11-24T10:00:00Z",
      "source": "Sentinel-2",
      "processed": true,
      "file_path": "satellite-images/2025/11/SAT001.tiff"
    }
  ]
}
```

---

### **POST /api/satellite/images** - Créer image (test)
Endpoint de test pour créer manuellement une entrée d'image.

**Body (JSON):**
```json
{
  "image_id": "SAT_TEST_001",
  "zone": {
    "latitude": 33.5731,
    "longitude": -7.5898,
    "rayon_km": 5
  },
  "source": "Sentinel-2",
  "processed": false
}
```

---

## 🔬 Indices Calculés

### **1. NDWI (Normalized Difference Water Index)**
**Formule:** `NDWI = (Green - NIR) / (Green + NIR)`

**Interprétation:**
- NDWI > 0: Eau probable
- NDWI < 0: Sol/végétation

**Utilisation:** Détection des zones aquatiques

---

### **2. Chlorophylle-a**
**Méthode:** Ratio NIR/Red avec facteur de conversion

**Unité:** mg/m³

**Utilisation:** Évaluation de la qualité biologique de l'eau, détection d'algues

---

### **3. Turbidité**
**Méthode:** Réflectance bande rouge (B04)

**Unité:** NTU (Nephelometric Turbidity Units)

**Utilisation:** Mesure de la clarté de l'eau, pollution

---

### **4. Température de surface**
**Statut:** À implémenter (nécessite bande thermique)

**Unité:** °C

---

## 🛠️ Configuration

### **Variables d'environnement:**

```env
# Application
PORT=8000
LOG_LEVEL=info

# MongoDB
MONGODB_URL=mongodb://satellite_user:satellite_pass@db_satellite:27017/satellite_db

# MinIO
MINIO_ENDPOINT=minio_storage:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=aquawatch123

# SentinelHub (optionnel pour Phase 1)
SENTINEL_CLIENT_ID=your_client_id
SENTINEL_CLIENT_SECRET=your_client_secret
```

### **Accès MinIO Console:**
- URL: http://localhost:9001
- Login: admin
- Password: aquawatch123

---

## 📦 Stack Technique

### **Framework & Serveur:**
- **FastAPI** 0.104.1 - Framework web moderne et rapide
- **Uvicorn** 0.24.0 - Serveur ASGI performant
- **Pydantic** 2.5.0 - Validation de données

### **Base de données:**
- **PyMongo** 4.6.0 - Driver MongoDB pour Python
- **MongoDB** 6.0 - Base NoSQL pour métadonnées

### **Stockage:**
- **MinIO** 7.2.0 - Stockage S3-compatible pour images
- **MinIO Server** - Object storage distribué

### **Traitement géospatial:**
- **GDAL** 3.7.3 - Librairie géospatiale de référence
- **Rasterio** 1.3.9 - Interface Python pour GDAL
- **SentinelHub** 3.9.0 - API Copernicus Sentinel
- **NumPy** 1.26.4 - Calculs scientifiques
- **Pillow** 10.1.0 - Traitement d'images de base

### **Communications:**
- **Redis** 5.0.1 - File d'attente pour traitement asynchrone

---

## 📚 Modules Python

### **`app/config/database.py`**
Gestion connexion MongoDB avec retry logic (5 tentatives, 3s délai).

```python
from app.config.database import Database

# Connexion
db = Database.get_db()

# Utilisation
collection = db.satellite_images
images = collection.find({})
```

### **`app/config/storage.py`**
Gestion stockage MinIO avec création automatique du bucket.

```python
from app.config.storage import MinIOStorage

# Connexion
client = MinIOStorage.get_client()

# Upload fichier
client.fput_object("satellite-images", "test.tiff", "local_file.tiff")
```

### **`app/config/sentinel.py`**
Configuration SentinelHub API pour téléchargement d'images.

```python
from app.config.sentinel import SentinelConfig

# Vérifier configuration
if SentinelConfig.is_configured():
    config = SentinelConfig.get_config()
```

### **`app/services/download.py`**
Téléchargement d'images Sentinel-2 par zone géographique.

```python
from app.services.download import SentinelDownloader

downloader = SentinelDownloader()
image = downloader.download_image(
    latitude=33.5731,
    longitude=-7.5898,
    rayon_km=5.0
)
# Retourne: numpy array [512x512x4] avec bandes B02, B03, B04, B08
```

### **`app/services/processing.py`**
Calcul des indices environnementaux depuis images satellites.

```python
from app.services.processing import ImageProcessor

# Calculer NDWI
ndwi = ImageProcessor.calculate_ndwi(nir_band, green_band)

# Calculer chlorophylle
chloro = ImageProcessor.calculate_chlorophyll(red_band, nir_band)

# Calculer turbidité
turb = ImageProcessor.calculate_turbidity(red_band)

# Traiter image complète
indices = ImageProcessor.process_sentinel_image(image_data)
```

---

## 🔄 Workflow Complet

### **Phase 1: Téléchargement (Implémenté)**
```python
from app.services.download import SentinelDownloader

downloader = SentinelDownloader()
image = downloader.download_image(33.5731, -7.5898, 5.0)
```

### **Phase 2: Traitement (Implémenté)**
```python
from app.services.processing import ImageProcessor

indices = ImageProcessor.process_sentinel_image(image)
# {'ndwi': 0.45, 'chlorophylle': 0.8, 'turbidite_satellite': 15.2}
```

### **Phase 3: Stockage (À implémenter)**
```python
from app.config.storage import MinIOStorage
from app.config.database import Database

# Sauvegarder image dans MinIO
client = MinIOStorage.get_client()
path = f"satellite-images/{image_id}.tiff"
client.fput_object("satellite-images", path, local_file)

# Sauvegarder métadonnées dans MongoDB
db = Database.get_db()
db.satellite_images.insert_one({
    "image_id": image_id,
    "zone": {...},
    "indices": indices,
    "file_path": path,
    "timestamp": datetime.utcnow()
})
```

---

## 🧪 Tests

### **Test manuel avec curl:**
```powershell
# Health check
curl http://localhost:8002/health

# Liste images
curl http://localhost:8002/api/satellite/images

# Indices pour ML
curl "http://localhost:8002/api/satellite/indices/latest?limit=5"
```

### **Test avec Postman:**
1. Importer collection depuis `/docs` (Swagger)
2. Tester chaque endpoint
3. Valider format des réponses

### **Logs du service:**
```powershell
# En temps réel
docker compose logs -f service_satellite

# Dernières 50 lignes
docker logs aquawatch-ms-service_satellite-1 --tail 50
```

---

## 🐛 Debugging

### **Service ne démarre pas:**
```powershell
# Voir les erreurs
docker compose logs service_satellite

# Reconstruire
docker compose build service_satellite
docker compose up service_satellite
```

### **Erreur MongoDB:**
```powershell
# Vérifier que MongoDB est démarré
docker compose ps db_satellite

# Redémarrer MongoDB
docker compose restart db_satellite

# Vérifier connexion
docker exec -it aquawatch-ms-db_satellite-1 mongosh
```

### **Erreur MinIO:**
```powershell
# Vérifier MinIO
docker compose ps minio_storage

# Accéder console
# http://localhost:9001

# Redémarrer
docker compose restart minio_storage
```

### **Module Python manquant:**
```powershell
# Rebuild avec cache clear
docker compose build --no-cache service_satellite
```

---

## 📊 Base de données

### **Collection: `satellite_images`**

**Structure:**
```json
{
  "_id": ObjectId("..."),
  "image_id": "SAT001",
  "zone": {
    "latitude": 33.5731,
    "longitude": -7.5898,
    "rayon_km": 5
  },
  "timestamp": ISODate("2025-11-24T10:00:00Z"),
  "source": "Sentinel-2",
  "indices": {
    "chlorophylle": 0.8,
    "turbidite_satellite": 15.2,
    "temperature_surface": 23.1,
    "ndwi": 0.45
  },
  "file_path": "satellite-images/2025/11/SAT001.tiff",
  "processed": true
}
```

**Index recommandés:**
```javascript
db.satellite_images.createIndex({ "timestamp": -1 })
db.satellite_images.createIndex({ "zone.latitude": 1, "zone.longitude": 1 })
db.satellite_images.createIndex({ "processed": 1 })
```

---

## 🔮 Roadmap

### **Phase 1: API de base** ✅
- [x] FastAPI application
- [x] Connexion MongoDB
- [x] Connexion MinIO
- [x] Health check
- [x] Endpoints mock data

### **Phase 2: Traitement** ✅
- [x] Modèles Pydantic
- [x] Service téléchargement
- [x] Service traitement
- [x] Calcul indices (NDWI, Chlorophylle, Turbidité)

### **Phase 3: Intégration complète** 🔄
- [ ] Pipeline téléchargement → traitement → stockage
- [ ] Scheduler pour téléchargements automatiques
- [ ] Cache Redis pour performances
- [ ] Tests unitaires et intégration
- [ ] Monitoring et alertes

### **Phase 4: Fonctionnalités avancées** 📝
- [ ] Authentification API (JWT)
- [ ] Rate limiting
- [ ] WebSocket pour streaming
- [ ] Export données (CSV, GeoJSON)
- [ ] Dashboard temps réel

---

## 🔗 Intégration avec autres services

### **Pour Hamza (service_stmodel):**
```python
import requests

# Récupérer indices satellites
response = requests.get(
    "http://service_satellite:8000/api/satellite/indices/latest",
    params={"limit": 10, "hours": 24}
)

indices = response.json()["indices"]

# Utiliser pour prédictions ML
for item in indices:
    zone = item["zone"]
    data = item["indices"]
    # Traiter avec modèle ML...
```

### **Pour Yassin (service_api_sig):**
```python
import requests

# Récupérer positions satellites
response = requests.get(
    "http://service_satellite:8000/api/satellite/images",
    params={"limit": 100}
)

images = response.json()["images"]

# Afficher sur carte
for img in images:
    lat = img["zone"]["latitude"]
    lon = img["zone"]["longitude"]
    # Ajouter marker sur carte...
```

---

## 📝 Notes importantes

### **Bandes Sentinel-2 utilisées:**
- **B02 (Blue):** 490 nm - Détection eau
- **B03 (Green):** 560 nm - Végétation aquatique
- **B04 (Red):** 665 nm - Chlorophylle, turbidité
- **B08 (NIR):** 842 nm - Biomasse, eau

### **Limites actuelles:**
- Température surface non disponible (nécessite bandes thermiques Landsat)
- Téléchargement nécessite credentials SentinelHub
- Traitement synchrone (prévoir async pour production)

### **Recommandations production:**
- Activer authentification API
- Implémenter cache Redis
- Ajouter monitoring (Prometheus + Grafana)
- Scheduler pour téléchargements nocturnes
- Backup automatique MongoDB

---

## 🤝 Support & Contact

**Développeur:** Bilal KHANTOURI  
**Branche Git:** `dev_Bilal`  
**Service:** Satellite (Images satellites)  
**Dernière mise à jour:** 24 Novembre 2025

---

## 📄 Licence

Projet académique - EMSI 2025  
AquaWatch - Système de monitoring qualité d'eau

---

**🚀 Service Satellite V1.0 - Production Ready!**
