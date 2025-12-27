# 🌊 AquaWatch-MS - Qualité de l'eau en temps réel

**Plateforme modulaire de surveillance et prédiction de la qualité de l'eau basée sur des microservices**

![AquaWatch](https://img.shields.io/badge/AquaWatch-MS-blue?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

---

## 🎯 OBJECTIF

Développer une plateforme automatisée pour :
- 📊 **Surveiller** la qualité de l'eau en temps réel via capteurs IoT et données satellites
- 🔮 **Prédire** les variations à court terme avec des modèles spatio-temporels  
- 🚨 **Alerter** automatiquement en cas de dépassement des seuils OMS
- 🗺️ **Visualiser** l'état des masses d'eau sur interface cartographique

---

## 🏗️ ARCHITECTURE MICROSERVICES

### **👥 Équipe & Services**
| **Développeur** | **Services** | **Technologies** | **Port** |
|----------------|-------------|------------------|----------|
| **Hamza** | STModel + Infrastructure | Python, ML, Docker | 8003 |
| **Bilal** | Capteurs + Satellite | Node.js, Python, MQTT | 8001, 8002 |
| **Yassin** | Alertes + API-SIG | Node.js, PostGIS | 8004, 8005 |

### **🔧 Services détaillés**

#### 🌡️ **Service Capteurs** (Port 8001)
> **Responsable : Bilal**
- Collecte données IoT temps réel (pH, turbidité, température)
- Passerelle MQTT + API REST
- Stockage TimescaleDB pour séries temporelles

#### 🛰️ **Service Satellite** (Port 8002)  
> **Responsable : Bilal**
- Intégration Sentinel-2, Copernicus
- Traitement images GDAL/rasterio
- Extraction variables dérivées (chlorophylle, NDWI)

#### 🧠 **Service STModel** (Port 8003)
> **Responsable : Hamza** 
- Modèles prédictifs ConvLSTM (PyTorch)
- Prédictions spatio-temporelles 24h/72h
- API ML pour qualité eau

#### 🚨 **Service Alertes** (Port 8004)
> **Responsable : Yassin**
- Surveillance seuils OMS automatique
- Notifications email/SMS/webhooks
- Dashboard monitoring temps réel

#### 🗺️ **Service API-SIG** (Port 8005)
> **Responsable : Yassin**
- Interface cartographique interactive
- API REST/GeoJSON avec PostGIS
- Visualisation zones risques

---

## 🚀 DÉMARRAGE RAPIDE

### **1. Prérequis**
```bash
# Installer Docker Desktop + Git + Node.js + Python 3.12
# Démarrer Docker Desktop (OBLIGATOIRE)
```

### **2. Clone et configuration**
```powershell
git clone https://github.com/Hamza-Aglagal/AquaWatch-MS.git
cd AquaWatch-MS
git checkout development

# Configuration environnement
copy .env.template .env
# Modifier .env selon vos besoins
```

### **3. Lancement infrastructure**
```powershell
# Infrastructure commune (base données + stockage)
docker compose up db_timescale minio_storage -d

# Test build complet
docker compose build

# Lancement tous services
docker compose up
```

### **4. Vérification**
- 🔗 Capteurs API: http://localhost:8001/api
- 🔗 Satellite API: http://localhost:8002/api  
- 🔗 STModel API: http://localhost:8003/api
- 🔗 Alertes API: http://localhost:8004/api
- 🔗 Carte interactive: http://localhost:8005/map
- 🔗 Console MinIO: http://localhost:9001

---

## 📚 GUIDES DÉVELOPPEUR

### **📖 Guides spécialisés par personne**
- 📋 [**GUIDE_HAMZA.md**](./GUIDE_HAMZA.md) - STModel + Infrastructure
- 📋 [**GUIDE_BILAL.md**](./GUIDE_BILAL.md) - Capteurs + Satellite  
- 📋 [**GUIDE_YASSIN.md**](./GUIDE_YASSIN.md) - Alertes + API-SIG

### **📖 Guide général**
- 📋 [**WORKFLOW_GENERAL.md**](./WORKFLOW_GENERAL.md) - Git/Docker pour tous

---

## 🔧 TECHNOLOGIES

### **Backend**
- **Node.js** + Express.js (Services Capteurs, Alertes, API-SIG)
- **Python** + FastAPI (Services Satellite, STModel)
- **TimescaleDB** (Séries temporelles)
- **PostgreSQL** + PostGIS (Données géospatiales)
- **MinIO** (Stockage fichiers satellites)

### **Frontend**
- **Leaflet.js** (Cartes interactives)
- **Chart.js** (Graphiques données)
- **WebSockets** (Temps réel)

### **Machine Learning**
- **PyTorch** / **TensorFlow** (Modèles prédictifs)
- **Scikit-learn** (ML classique)
- **GDAL** + **Rasterio** (Traitement géospatial)

### **DevOps**
- **Docker** + **Docker Compose**
- **Git** (Workflow GitFlow)
- **GitHub Actions** (CI/CD - à venir)

---

## 📊 DONNÉES & APIs

### **Sources données**
- 📡 **Capteurs IoT** : MQTT temps réel
- 🛰️ **Sentinel-2** : Images satellites européennes
- 🌊 **Copernicus Marine** : Données océanographiques
- 📏 **OMS** : Seuils qualité eau officiels

### **Formats supportés**
- **JSON** (APIs REST)
- **GeoJSON** (Données géospatiales)  
- **MQTT** (Messages capteurs)
- **TIFF** (Images satellites)

---

## 🗺️ ZONES PILOTES

### **Régions surveillées**
- 🏙️ **Casablanca** : Zone urbaine côtière
- 🏞️ **Sebou** : Bassin fluvial  
- 🌊 **Atlantique** : Façade maritime

### **Paramètres surveillés**
| Paramètre | Seuil OMS | Unité | Source |
|-----------|-----------|-------|--------|
| pH | 6.5 - 8.5 | - | Capteurs |
| Turbidité | < 4.0 | NTU | Capteurs + Satellite |
| Température | < 25.0 | °C | Capteurs |
| Chlorophylle | Variable | mg/m³ | Satellite |
| NDWI | 0.0 - 1.0 | - | Satellite |

---

## 🔄 WORKFLOW DÉVELOPPEMENT

### **Structure branches**
```
main (production)
└── development (équipe)
    ├── feature/infrastructure-hamza
    ├── feature/stmodel-hamza  
    ├── feature/capteurs-bilal
    ├── feature/satellite-bilal
    ├── feature/alertes-yassin
    └── feature/api-sig-yassin
```

### **Conventions commit**
```
feat: Nouvelle fonctionnalité
fix: Correction bug  
docs: Documentation
refactor: Refactoring code
test: Tests
```

---

## 🐳 COMMANDES DOCKER ESSENTIELLES

```powershell
# Infrastructure seule
docker compose up db_timescale minio_storage -d

# Service individuel
docker compose up service_capteurs
docker compose up service_satellite
docker compose up service_stmodel  
docker compose up service_alertes
docker compose up service_api_sig

# Tous services
docker compose up --build

# Logs service spécifique
docker compose logs -f service_capteurs

# Arrêt propre
docker compose down
```

---

## 📈 ROADMAP

### **Phase 1 - MVP** ✅ 
- [x] Infrastructure Docker
- [x] Structure microservices
- [x] Configuration environnement

### **Phase 2 - Services de base** 🔄
- [ ] APIs REST pour chaque service
- [ ] Intégration base données
- [ ] Collecte données capteurs mock

### **Phase 3 - Intégrations** 📋
- [ ] MQTT temps réel  
- [ ] APIs satellites
- [ ] Modèles ML de base
- [ ] Système alertes email

### **Phase 4 - Interface** 📋
- [ ] Carte interactive
- [ ] Dashboard monitoring
- [ ] Notifications temps réel

### **Phase 5 - Production** 📋
- [ ] Déploiement cloud
- [ ] Monitoring avancé
- [ ] Documentation utilisateur
- [ ] Publication SoftwareX

---

## 🤝 CONTRIBUTION

### **Développeurs**
- **Hamza Aglagal** - Architecture & ML
- **Bilal** - IoT & Données satellites  
- **Yassin** - Alertes & Cartographie

### **Pour contribuer**
1. 🍴 Fork le projet
2. 🌿 Créer une branche feature
3. 💾 Commiter vos changements  
4. 📤 Push vers la branche
5. 🔀 Créer une Pull Request

---

## 📞 SUPPORT

### **Documentation**
- 📚 Guides développeur dans `/docs`
- 🐳 Configuration Docker dans `/docker-compose.yml`
- ⚙️ Variables environnement dans `.env.template`

### **Issues**
- 🐛 **Bugs** : Créer une issue GitHub
- 💡 **Fonctionnalités** : Discussion équipe d'abord
- ❓ **Questions** : Voir guides spécialisés

---

## 📄 LICENCE

Ce projet est sous licence **MIT** - voir [LICENSE](LICENSE) pour détails.

---

## 🌟 ACKNOWLEDGMENTS

- **OMS** pour standards qualité eau
- **ESA** pour données Sentinel-2
- **Copernicus** pour données marines
- **EMSI** pour encadrement académique

---

**🌊 AquaWatch-MS - Pour une eau plus propre, des décisions plus éclairées ! 🌊**
Video : 

https://github.com/user-attachments/assets/8a46b2f1-a95b-4b98-ac15-a31ef53d7424

