# 🎯 GUIDE HAMZA - STModel + Infrastructure
**Votre branche : `dev_hamza`**  
**Architecture : MICROSERVICES PROFESSIONNELLE**  
**Vos services : STModel (ML) + Infrastructure (Docker)**

---

## 🏗️ ARCHITECTURE MICROSERVICES SIMPLE

### **🗄️ VOTRE BASE DE DONNÉES DÉDIÉE** :
- **Nom** : `predictions_db` (PostgreSQL port 5434)
- **Tables** : 
  - `ml_models` → Vos modèles ML (nom, version, précision)
  - `predictions` → Résultats prédictions (qualité eau, score, zone GPS)
  - `training_logs` → Historique entraînements
- **Avantage** : Vous seul y accédez, vous pouvez modifier sans casser autres services

### **📡 APIS QUE VOUS APPELEZ** :

#### **De Bilal (Capteurs)** :
```
GET http://service_capteurs:8000/api/capteurs/data/latest
Vous recevez: {
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
```

#### **De Bilal (Satellite)** :
```
GET http://service_satellite:8000/api/satellite/indices/latest
Vous recevez: {
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

### **📈 MESSAGES QUE VOUS ENVOYEZ** :

#### **Vers Yassin (via Redis)** :
```
Canal: "new_prediction"
Vous envoyez: {
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

### **📊 API QUE VOUS POUVEZ CRÉER** :

#### **Service STModel** :
```
GET /api/predictions/latest
Vous retournez: {
  "predictions": [
    {
      "prediction_id": "PRED001",
      "model_name": "water_quality_v1",
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
  ]
}

POST /api/predictions/create
Vous recevez: zone_GPS
Vous retournez: nouvelle prédiction
```

**🎯 VOTRE RÔLE : Recevoir données → Faire prédictions ML → Envoyer résultats**

---

## �📋 CE QUE VOUS FAITES

### 🧠 **Service STModel** 
- API pour prédictions qualité eau (Python + FastAPI)
- Modèles machine learning pour prédire les données
- Port : 8003

### 🔧 **Infrastructure**
- Gestion Docker et base de données
- Configuration générale du projet

---

## � WORKFLOW QUOTIDIEN SIMPLE

### **1. Démarrer votre travail**
```powershell
# 1. Aller dans le projet
cd "C:\Users\Hamza\Documents\EMSI 5\ML+DM+MicroServices\aquawatch-ms"

# 2. Basculer sur votre branche
git checkout dev_hamza

# 3. Récupérer les dernières modifications
git pull origin development

# 4. Démarrer Docker Desktop (attendre qu'il soit vert)

# 5. Démarrer TOUTES les bases microservices
docker compose up db_capteurs db_satellite db_predictions db_alerts db_geo redis_queue minio_storage -d
```

### **2. Développer votre service**
```powershell
# Tester votre service STModel
docker compose up service_stmodel
```

**📝 Votre code va dans : `services/service_stmodel/src/`**

### **3. Sauvegarder votre travail**
```powershell
# 1. Voir ce que vous avez modifié
git status

# 2. Ajouter vos modifications
git add .

# 3. Sauvegarder avec un message
git commit -m "feat: [ce que vous avez fait]"

# 4. Envoyer sur GitHub
git push origin dev_hamza
```

---

## � PROCESSUS ÉTAPE PAR ÉTAPE - VOS TÂCHES

### **📋 FLUX SERVICE STMODEL** :

#### **Étape 1 - Connecter à PostgreSQL**
- **Outil** : `psycopg2` (Python PostgreSQL driver)
- **Action** : Connexion à VOTRE base `predictions_db` port 5434
- **Variables** : `DATABASE_URL=postgresql://predictions_user:predictions_pass_2025@db_predictions:5432/predictions_db`

#### **Étape 2 - Configurer PyTorch**
- **Outil** : `torch` + `torchvision` + `pytorch-lightning`
- **Action** : Initialiser modèles ConvLSTM pour prédictions spatio-temporelles
- **GPU** : Détecter CUDA si disponible, sinon CPU

#### **Étape 3 - Récupérer données de Bilal**
- **Outil** : `requests` Python HTTP client
- **Action** : Appels APIs capteurs et satellite de Bilal
- **URLs** : `http://service_capteurs:8000/api/capteurs/data/latest` et `http://service_satellite:8000/api/satellite/indices/latest`

#### **Étape 4 - Préparer données ML**
- **Outil** : `pandas` + `numpy` pour preprocessing
- **Action** : Normaliser données, créer séquences temporelles pour ConvLSTM
- **Features** : Combiner capteurs IoT + indices satellites + coordonnées GPS

#### **Étape 5 - Faire prédictions**
- **Outil** : Modèles PyTorch ConvLSTM entraînés
- **Action** : Prédire qualité eau à 24h/72h avec scores de confiance
- **Output** : Score qualité (0-10), catégorie (BONNE/MOYENNE/MAUVAISE), risque pollution

#### **Étape 6 - Stocker prédictions**
- **Outil** : PostgreSQL `INSERT` dans table `predictions`
- **Action** : Sauver résultats avec timestamp, zone GPS, model_id
- **Index** : Optimiser requêtes par zone et temps

#### **Étape 7 - Publier vers Yassin**
- **Outil** : `redis` Python client
- **Action** : Publier message sur canal "new_prediction"
- **Format** : JSON avec prédictions + zone GPS pour déclenchement alertes

#### **Étape 8 - Exposer API ML**
- **Outil** : FastAPI routes Python
- **Action** : Endpoint `/api/predictions/latest` pour consultation prédictions
- **Authentification** : Basic auth si nécessaire

### **📋 FLUX INFRASTRUCTURE DOCKER** :

#### **Étape 1 - Gérer docker-compose.yml**
- **Outil** : Docker Compose orchestration
- **Action** : Maintenir configuration 8 services + bases dédiées
- **Dependencies** : Ordre démarrage correct (bases → services)

#### **Étape 2 - Variables d'environnement**
- **Outil** : Fichier `.env` centralisé
- **Action** : Gérer credentials bases, ports, clés API
- **Sécurité** : Passwords forts, séparation dev/prod

#### **Étape 3 - Monitoring infrastructure**
- **Outil** : `docker compose ps` + `docker stats`
- **Action** : Vérifier santé services, usage ressources
- **Logs** : Centraliser avec `docker compose logs`

---

## �📋 VOS TÂCHES DÉTAILLÉES

### **🎯 Service STModel - Prédictions Spatio-Temporelles**

**Votre dossier :** `services/service_stmodel/src/`

#### **Phase 1 - API de base avec PyTorch** 
```python
# Créer src/index.py - Point d'entrée FastAPI
from fastapi import FastAPI
import torch
import torch.nn as nn

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok", "service": "stmodel", "pytorch": torch.__version__}

@app.get("/predict")  
def predict():
    return {"prediction": "ConvLSTM ready", "model_type": "spatio-temporal"}
```

#### **Phase 2 - Connexion données** 
- **VOTRE base** : Connecter à `predictions_db` PostgreSQL
- **APIs à appeler** : 
  - `GET service_capteurs:8000/api/capteurs/data/latest` → Données capteurs
  - `GET service_satellite:8000/api/satellite/indices/latest` → Indices satellite
- **Outils** : Python, PostgreSQL adapter, HTTP client (requests/httpx)

#### **Phase 3 - Modèles ConvLSTM + Communication**
- **PyTorch ConvLSTM** : Modèles spatio-temporels pour prédictions qualité eau
- **PyTorch Lightning** : Framework pour entraînement optimisé modèles complexes
- **Stockage** : Sauver prédictions dans VOTRE base `predictions_db`
- **Communication** : Publier sur canal Redis `"new_prediction"` → Vers Yassin
- **API** : `GET /api/predictions/latest` avec prédictions 24h/72h
- **Outils** : PyTorch, ConvLSTM, Pandas, Redis client

#### **Phase 4 - Modèles professionnels** 
- **Réseaux spatio-temporels** : ConvLSTM pour séries temporelles géolocalisées
- **Prédictions multiples** : 24h/72h avec intervalles de confiance
- **Fusion données** : Capteurs + Satellites + Météo pour précision maximale

**🛠️ OUTILS À UTILISER :**
- **FastAPI** → APIs web
- **PostgreSQL** → VOTRE base `predictions_db` (port 5434)
- **PyTorch + ConvLSTM** → Modèles spatio-temporels professionnels
- **PyTorch Lightning** → Framework ML avancé pour entraînement
- **Requests/HTTPx** → Appeler APIs de Bilal
- **Redis** → Envoyer messages à Yassin
- **Pandas + Scikit-learn** → Préparation données ML
- **Docker** → Votre service en container

---

## 🔗 INTÉGRATION SIMPLE

### **APIs à créer pour envoyer vos prédictions** :
```python
# Dans src/index.py
@app.get("/api/predictions/latest")
def get_latest_predictions():
    return {
        "prediction_id": "PRED001",
        "qualite_eau": "BONNE",  # BONNE, MOYENNE, MAUVAISE
        "score_qualite": 7.2,    # 0-10
        "risque_pollution": "FAIBLE"  # FAIBLE, MOYEN, ELEVE
    }
```

### **APIs à appeler pour récupérer les données** :
```python
# Données capteurs de Bilal
GET http://service_capteurs:8001/api/capteurs/derniere

# Données satellite de Bilal  
GET http://service_satellite:8002/api/satellite/indices
```

**⚡ RÈGLE SIMPLE : Même format JSON partout = intégration facile !**

---

## 🆘 SI VOUS AVEZ UN PROBLÈME

### **Le service ne démarre pas**
```powershell
# Voir l'erreur
docker compose logs service_stmodel

# Reconstruire
docker compose build service_stmodel
docker compose up service_stmodel
```

### **VOTRE base dédiée ne marche pas**
```powershell
# Vérifier VOTRE base predictions_db
docker compose logs db_predictions

# Se connecter à VOTRE base
docker exec -it aquawatch-ms-db_predictions-1 psql -U predictions_user -d predictions_db

# Redémarrer si nécessaire
docker compose restart db_predictions
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