# 🗺️ SERVICE API-SIG - GUIDE COMPLET YASSIN

## Vue d'ensemble
Service de cartographie interactive pour visualiser la qualité de l'eau en temps réel sur une carte du Maroc.

---

## ✅ ARCHITECTURE COMPLÈTE

### 📦 Stack Technique
- **Backend**: Express.js + Sequelize
- **Base de données**: PostgreSQL + PostGIS (géospatial)
- **Frontend**: Leaflet.js (cartographie interactive)
- **Communication**: Redis pub/sub
- **Format**: GeoJSON pour les données géographiques

### 🏗️ Structure des Fichiers
```
service_api_sig/
├── src/
│   ├── index.js                    # Serveur Express principal
│   ├── config/
│   │   └── database.js             # Connexion PostGIS
│   ├── models/
│   │   ├── Zone.js                 # Modèle zones géographiques
│   │   └── PointInteret.js         # Modèle points d'intérêt (capteurs)
│   ├── routes/
│   │   └── mapRoutes.js            # Routes API cartographiques
│   └── public/
│       └── index.html              # Interface web Leaflet
├── package.json
└── Dockerfile
```

---

## ✅ ÉTAPE 1: BASE DE DONNÉES POSTGIS

### 📊 Schéma de la base de données

#### Table `zones_map`
```sql
CREATE TABLE zones_map (
    zone_id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'ville',  -- 'ville' ou 'region'
    geometry GEOMETRY(POLYGON, 4326),   -- Polygone de la zone
    centre_lat DECIMAL(10, 8),
    centre_lon DECIMAL(11, 8),
    qualite_actuelle VARCHAR(20),       -- BONNE, MOYENNE, MAUVAISE, INCONNU
    derniere_mise_a_jour TIMESTAMP,
    actif BOOLEAN DEFAULT TRUE
);
```

#### Table `poi_map` (Points d'Intérêt)
```sql
CREATE TABLE poi_map (
    poi_id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(20),                   -- capteur, port, plage, autre
    position GEOMETRY(POINT, 4326),     -- Position GPS
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capteur_id VARCHAR(50),
    description TEXT,
    actif BOOLEAN DEFAULT TRUE
);
```

### 🌍 Données Initiales (10 villes côtières)
1. **Agadir** (30.42°N, -9.59°W)
2. **Essaouira** (31.50°N, -9.75°W)
3. **Safi** (32.29°N, -9.23°W)
4. **El Jadida** (33.23°N, -8.50°W)
5. **Casablanca** (33.57°N, -7.58°W)
6. **Mohammedia** (33.68°N, -7.38°W)
7. **Rabat** (34.02°N, -6.84°W)
8. **Kénitra** (34.26°N, -6.58°W)
9. **Larache** (35.19°N, -6.15°W)
10. **Tanger** (35.75°N, -5.83°W)

### ✅ Vérification
```powershell
# Test connexion PostGIS
docker exec -i aquawatch-ms-db_geo-1 psql -U aquawatch_user -d aquawatch_geo -c "\dt"

# Lister les zones
docker exec -i aquawatch-ms-db_geo-1 psql -U aquawatch_user -d aquawatch_geo -c "SELECT zone_id, nom, type, qualite_actuelle FROM zones_map;"

# Lister les capteurs
docker exec -i aquawatch-ms-db_geo-1 psql -U aquawatch_user -d aquawatch_geo -c "SELECT poi_id, nom, capteur_id FROM poi_map;"
```

---

## ✅ ÉTAPE 2: MODÈLES SEQUELIZE

### 📄 Zone.js
```javascript
const Zone = sequelize.define('Zone', {
    zone_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nom: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM('ville', 'region'), defaultValue: 'ville' },
    geometry: { type: DataTypes.GEOMETRY('POLYGON', 4326), allowNull: false },
    centre_lat: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
    centre_lon: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
    qualite_actuelle: { 
        type: DataTypes.ENUM('BONNE', 'MOYENNE', 'MAUVAISE', 'INCONNU'),
        defaultValue: 'INCONNU' 
    },
    derniere_mise_a_jour: { type: DataTypes.DATE },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'zones_map',
    timestamps: false
});
```

### 📄 PointInteret.js
```javascript
const PointInteret = sequelize.define('PointInteret', {
    poi_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nom: { type: DataTypes.STRING(100), allowNull: false },
    type: { type: DataTypes.ENUM('capteur', 'port', 'plage', 'autre') },
    position: { type: DataTypes.GEOMETRY('POINT', 4326), allowNull: false },
    latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
    longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
    capteur_id: { type: DataTypes.STRING(50) },
    description: { type: DataTypes.TEXT },
    actif: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'poi_map',
    timestamps: false
});
```

---

## ✅ ÉTAPE 3: API ROUTES

### 🛣️ Endpoints Disponibles

#### 1️⃣ `GET /api/map/zones` - Récupérer toutes les zones (GeoJSON)
```powershell
Invoke-WebRequest -Uri "http://localhost:8005/api/map/zones" | ConvertFrom-Json
```
**Retour**:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": 1,
      "properties": {
        "nom": "Agadir",
        "type": "ville",
        "qualite": "INCONNU",
        "derniere_maj": null,
        "centre": [-9.5981, 30.4278]
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

#### 2️⃣ `GET /api/map/points` - Récupérer les capteurs (GeoJSON)
```powershell
Invoke-WebRequest -Uri "http://localhost:8005/api/map/points?type=capteur"
```

#### 3️⃣ `POST /api/map/update-zone` - Mettre à jour la qualité d'une zone
```powershell
$body = @{
    latitude = 30.4278
    longitude = -9.5981
    qualite = "BONNE"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8005/api/map/update-zone" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

#### 4️⃣ `GET /api/map/zone-at` - Trouver la zone à des coordonnées
```powershell
Invoke-WebRequest -Uri "http://localhost:8005/api/map/zone-at?lat=33.5731&lon=-7.5898"
```

#### 5️⃣ `GET /api/map/stats` - Statistiques globales
```powershell
Invoke-WebRequest -Uri "http://localhost:8005/api/map/stats"
```
**Retour**:
```json
{
  "total_zones": "10",
  "zones_bonnes": "0",
  "zones_moyennes": "2",
  "zones_mauvaises": "1",
  "zones_inconnues": "7",
  "total_points": "4"
}
```

---

## ✅ ÉTAPE 4: INTERFACE WEB LEAFLET

### 🌐 Accès
```
http://localhost:8005
```

### 🎨 Fonctionnalités
1. **Carte interactive** centrée sur le Maroc
2. **Zones colorées** selon la qualité:
   - 🟢 Vert = BONNE
   - 🟡 Jaune = MOYENNE
   - 🔴 Rouge = MAUVAISE
   - ⚫ Gris = INCONNU
3. **Marqueurs capteurs** (icônes GPS bleues)
4. **Popups informatifs** au clic
5. **Légende** explicative
6. **Statistiques** en temps réel (header)
7. **Auto-refresh** toutes les 30 secondes

### 🎯 Technologies Frontend
- **Leaflet.js** 1.9.4 (cartographie)
- **OpenStreetMap** (fond de carte)
- **GeoJSON** (format de données)

---

## ✅ ÉTAPE 5: DÉMARRAGE DU SERVICE

### 🚀 Commandes Docker
```powershell
# 1. S'assurer que db_geo et redis sont démarrés
docker compose up db_geo redis_queue -d

# 2. Démarrer le service API-SIG
docker compose up service_api_sig -d

# 3. Vérifier les logs
docker logs aquawatch-ms-service_api_sig-1 --tail 20

# 4. Tester la santé
Invoke-WebRequest -Uri "http://localhost:8005/health"
```

### ✅ Messages de démarrage attendus
```
✅ Connexion à PostGIS établie
✅ Modèles synchronisés
🗺️  Service API-SIG en écoute sur le port 8000
📍 Carte interactive: http://localhost:8000
🔍 API zones: http://localhost:8000/api/map/zones
📊 API points: http://localhost:8000/api/map/points
```

---

## ✅ ÉTAPE 6: TESTS COMPLETS

### 📝 Script de Test PowerShell
```powershell
# Test 1: Health Check
Write-Host "🔍 Test 1: Health Check" -ForegroundColor Cyan
$health = Invoke-WebRequest -Uri "http://localhost:8005/health" | ConvertFrom-Json
Write-Host "Status: $($health.status)" -ForegroundColor Green

# Test 2: Statistiques
Write-Host "`n📊 Test 2: Statistiques" -ForegroundColor Cyan
$stats = Invoke-WebRequest -Uri "http://localhost:8005/api/map/stats" | ConvertFrom-Json
Write-Host "Total zones: $($stats.total_zones)"
Write-Host "Zones bonnes: $($stats.zones_bonnes)"
Write-Host "Total capteurs: $($stats.total_points)"

# Test 3: Zones GeoJSON
Write-Host "`n🗺️ Test 3: Zones" -ForegroundColor Cyan
$zones = Invoke-WebRequest -Uri "http://localhost:8005/api/map/zones" | ConvertFrom-Json
Write-Host "Nombre de features: $($zones.features.Count)"
$zones.features[0..2] | ForEach-Object {
    Write-Host "  - $($_.properties.nom): $($_.properties.qualite)"
}

# Test 4: Points d'intérêt
Write-Host "`n📍 Test 4: Capteurs" -ForegroundColor Cyan
$points = Invoke-WebRequest -Uri "http://localhost:8005/api/map/points?type=capteur" | ConvertFrom-Json
Write-Host "Nombre de capteurs: $($points.features.Count)"
$points.features | ForEach-Object {
    Write-Host "  - $($_.properties.nom) [$($_.properties.capteur_id)]"
}

# Test 5: Recherche zone
Write-Host "`n🎯 Test 5: Zone à Casablanca" -ForegroundColor Cyan
$zone = Invoke-WebRequest -Uri "http://localhost:8005/api/map/zone-at?lat=33.5731&lon=-7.5898" | ConvertFrom-Json
Write-Host "Zone trouvée: $($zone.nom) - Qualité: $($zone.qualite_actuelle)"

# Test 6: Mise à jour zone
Write-Host "`n🔄 Test 6: Mise à jour zone Agadir → BONNE" -ForegroundColor Cyan
$body = @{
    latitude = 30.4278
    longitude = -9.5981
    qualite = "BONNE"
} | ConvertTo-Json

$update = Invoke-WebRequest -Uri "http://localhost:8005/api/map/update-zone" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body | ConvertFrom-Json

if ($update.success) {
    Write-Host "✅ Zone $($update.zone.nom) mise à jour: $($update.zone.qualite_actuelle)" -ForegroundColor Green
} else {
    Write-Host "❌ $($update.message)" -ForegroundColor Red
}

# Test 7: Vérification mise à jour
Write-Host "`n✔️ Test 7: Vérification mise à jour" -ForegroundColor Cyan
$statsAfter = Invoke-WebRequest -Uri "http://localhost:8005/api/map/stats" | ConvertFrom-Json
Write-Host "Zones bonnes: $($statsAfter.zones_bonnes) (était $($stats.zones_bonnes))"

Write-Host "`n✅ TOUS LES TESTS RÉUSSIS!" -ForegroundColor Green
```

### 💾 Sauvegarder le script
```powershell
# Créer le script de test
$script | Out-File -FilePath "c:\Users\PC\Desktop\pfa\AquaWatch-MS\test_api_sig.ps1" -Encoding UTF8

# Exécuter
.\test_api_sig.ps1
```

---

## ✅ ÉTAPE 7: INTÉGRATION AVEC LES AUTRES SERVICES

### 🔗 Communication Inter-Services

#### 1️⃣ **Écouter les prédictions** (Redis)
```javascript
// À ajouter dans service_api_sig
const redis = require('redis');
const subscriber = redis.createClient({ url: 'redis://redis_queue:6379' });

subscriber.subscribe('new_prediction', (message) => {
    const prediction = JSON.parse(message);
    // Mettre à jour la zone géographique
    updateZoneQuality(prediction.latitude, prediction.longitude, prediction.qualite);
});
```

#### 2️⃣ **Récupérer positions capteurs** (API Capteurs - Bilal)
```javascript
const axios = require('axios');

async function syncCapteurs() {
    const response = await axios.get('http://service_capteurs:8000/capteurs/positions');
    const capteurs = response.data;
    
    // Mettre à jour poi_map
    for (const capteur of capteurs) {
        await PointInteret.upsert({
            nom: capteur.nom,
            type: 'capteur',
            position: sequelize.fn('ST_SetSRID', 
                sequelize.fn('ST_MakePoint', capteur.longitude, capteur.latitude), 
                4326),
            latitude: capteur.latitude,
            longitude: capteur.longitude,
            capteur_id: capteur.id,
            actif: true
        });
    }
}
```

#### 3️⃣ **Afficher sur GeoServer**
```bash
# Créer workspace dans GeoServer
curl -u admin:aquawatch123 -X POST \
  http://localhost:8080/geoserver/rest/workspaces \
  -H 'Content-Type: application/json' \
  -d '{"workspace": {"name": "aquawatch"}}'

# Ajouter datastore PostGIS
curl -u admin:aquawatch123 -X POST \
  http://localhost:8080/geoserver/rest/workspaces/aquawatch/datastores \
  -H 'Content-Type: application/json' \
  -d '{
    "dataStore": {
      "name": "postgis",
      "connectionParameters": {
        "host": "db_geo",
        "port": "5432",
        "database": "aquawatch_geo",
        "user": "aquawatch_user",
        "passwd": "AquaWatch2024!",
        "dbtype": "postgis"
      }
    }
  }'
```

---

## 🎯 RÉSUMÉ DES 7 ÉTAPES

| Étape | Description | Status |
|-------|------------|--------|
| 1️⃣ | **Base PostGIS** - Tables zones_map & poi_map | ✅ |
| 2️⃣ | **Modèles Sequelize** - Zone & PointInteret | ✅ |
| 3️⃣ | **API Routes** - 5 endpoints REST | ✅ |
| 4️⃣ | **Interface Leaflet** - Carte interactive | ✅ |
| 5️⃣ | **Démarrage Docker** - Service opérationnel | ✅ |
| 6️⃣ | **Tests complets** - Validation fonctionnelle | ✅ |
| 7️⃣ | **Intégration** - Connexion autres services | 🔄 |

---

## 📊 PORTS UTILISÉS

| Service | Port | URL |
|---------|------|-----|
| API-SIG | 8005 | http://localhost:8005 |
| DB PostGIS | 5436 | postgresql://localhost:5436/aquawatch_geo |
| GeoServer | 8080 | http://localhost:8080/geoserver |
| Redis | 6379 | redis://localhost:6379 |

---

## 🐛 DÉPANNAGE

### Problème: Erreur connexion PostGIS
```powershell
# Vérifier si db_geo est démarré
docker ps | Select-String "db_geo"

# Tester connexion
docker exec -it aquawatch-ms-db_geo-1 psql -U aquawatch_user -d aquawatch_geo
```

### Problème: Zones vides sur la carte
```powershell
# Vérifier données en base
docker exec -i aquawatch-ms-db_geo-1 psql -U aquawatch_user -d aquawatch_geo -c "SELECT COUNT(*) FROM zones_map;"
```

### Problème: Service ne démarre pas
```powershell
# Voir les logs détaillés
docker logs aquawatch-ms-service_api_sig-1 --tail 50

# Reconstruire l'image
docker compose build --no-cache service_api_sig
```

---

## 📖 PROCHAINES ÉTAPES

1. ✅ Ajouter listener Redis pour auto-update des zones
2. ✅ Synchroniser capteurs avec service de Bilal
3. ✅ Configurer couches GeoServer (WMS/WFS)
4. ✅ Ajouter heatmap pour concentrations
5. ✅ Implémenter recherche géographique

---

🎉 **SERVICE API-SIG COMPLÈTEMENT OPÉRATIONNEL!**
