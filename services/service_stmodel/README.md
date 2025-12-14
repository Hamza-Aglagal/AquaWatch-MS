# 🚀 API STModel - Guide d'utilisation

## ✅ Structure créée

```
src/
├── main.py                          # ✅ Point d'entrée FastAPI
├── config.py                        # ✅ Configuration
├── api/
│   ├── __init__.py
│   └── routes.py                    # ✅ Endpoints API
├── services/
│   ├── __init__.py
│   └── prediction_service.py        # ✅ Service de prédiction
├── ml/
│   ├── __init__.py
│   └── model.py                     # ✅ Architecture LSTM
└── schemas/
    ├── __init__.py
    └── prediction.py                # ✅ Validation Pydantic
```

---

## 🚀 Démarrage Local

### 1. Installer les dépendances (si pas déjà fait)

```powershell
cd services/service_stmodel
pip install fastapi uvicorn pydantic
```

### 2. Lancer l'API

```powershell
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

**OU** directement:

```powershell
python -m src.main
```

### 3. Tester l'API

Ouvrir le navigateur: **http://localhost:8000**

Documentation interactive: **http://localhost:8000/docs**

---

## 📡 Endpoints disponibles

### 1. **GET /** - Page d'accueil
```bash
curl http://localhost:8000/
```

**Réponse:**
```json
{
  "service": "STModel",
  "version": "1.0.0",
  "status": "running",
  "model_loaded": true,
  "endpoints": { ... }
}
```

---

### 2. **GET /health** - Health check
```bash
curl http://localhost:8000/health
```

**Réponse:**
```json
{
  "status": "healthy",
  "service": "stmodel",
  "model_loaded": true
}
```

---

### 3. **GET /api/model/info** - Infos modèle
```bash
curl http://localhost:8000/api/model/info
```

**Réponse:**
```json
{
  "model_type": "WaterQualityLSTM",
  "architecture": "2-layer LSTM (64 hidden units)",
  "input_features": 11,
  "sequence_length": 14,
  "device": "cpu",
  "metrics": {
    "mse": 0.008263,
    "rmse": 0.090902,
    "mae": 0.054496,
    "r2": 0.7003
  },
  "model_loaded": true
}
```

---

### 4. **POST /api/predictions/create** - Créer prédiction

**Exemple de requête:**

```bash
curl -X POST http://localhost:8000/api/predictions/create \
  -H "Content-Type: application/json" \
  -d '{
    "measurements": [
      {
        "date_capteur": "2018-12-10",
        "date_satellite": "2018-12-05",
        "days_diff": 5.0,
        "station_id": 10001,
        "latitude": 28.5,
        "longitude": 120.3,
        "pH": 7.2,
        "oxygene_dissous": 8.5,
        "COD": 15.2,
        "CODMn": 3.8,
        "NH4N": 0.5,
        "TPH": 0.08,
        "DIP": 0.02,
        "DIN": 0.6,
        "NDWI": 0.35,
        "chlorophyll_index": 0.012,
        "turbidity_index": 0.45
      },
      ... (13 autres mesures pour avoir 14 jours)
    ]
  }'
```

**Réponse:**
```json
{
  "prediction_id": "PRED_20251125143025_a3f5b9c2",
  "quality_score": 0.6523,
  "quality_score_real": 65.23,
  "confidence": 0.945,
  "timestamp": "2025-11-25T14:30:25.123456",
  "message": "Prédiction réussie"
}
```

---

### 5. **GET /api/predictions/latest** - Dernières prédictions

```bash
curl http://localhost:8000/api/predictions/latest
```

**Réponse (Phase 1 - mock data):**
```json
{
  "message": "Mock data - Phase 1",
  "predictions": [
    {
      "prediction_id": "PRED_EXAMPLE_001",
      "quality_score": 0.65,
      "timestamp": "2025-11-25T14:30:25"
    }
  ]
}
```

---

## 🧪 Tester avec Python

Créer un fichier `test_api.py`:

```python
import requests
import json

# URL de l'API
BASE_URL = "http://localhost:8000"

# 1. Health check
response = requests.get(f"{BASE_URL}/health")
print("Health:", response.json())

# 2. Infos modèle
response = requests.get(f"{BASE_URL}/api/model/info")
print("\nModel Info:", json.dumps(response.json(), indent=2))

# 3. Créer une prédiction (avec 14 mesures)
# Note: Vous devez fournir 14 mesures réelles de votre dataset
measurements = []
for i in range(14):
    measurements.append({
        "date_capteur": f"2018-12-{10+i:02d}",
        "date_satellite": f"2018-12-{10+i:02d}",
        "days_diff": 0.0,
        "station_id": 10001,
        "latitude": 28.5,
        "longitude": 120.3,
        "pH": 7.2 + i*0.1,
        "oxygene_dissous": 8.5,
        "COD": 15.2,
        "CODMn": 3.8,
        "NH4N": 0.5,
        "TPH": 0.08,
        "DIP": 0.02,
        "DIN": 0.6,
        "NDWI": 0.35,
        "chlorophyll_index": 0.012,
        "turbidity_index": 0.45
    })

response = requests.post(
    f"{BASE_URL}/api/predictions/create",
    json={"measurements": measurements}
)
print("\nPrediction:", json.dumps(response.json(), indent=2))
```

Exécuter:
```powershell
python test_api.py
```

---

## 🐳 Démarrage avec Docker (plus tard)

```powershell
# Build
docker compose build service_stmodel

# Run
docker compose up service_stmodel

# Logs
docker compose logs -f service_stmodel
```

---

## 🔧 Troubleshooting

### Erreur "Modèle non chargé"
- Vérifier que `models/best_model.pth` existe
- Vérifier que `data/processed/sequences/scaler_*.pkl` existent

### Port déjà utilisé
```powershell
# Changer le port
python -m uvicorn src.main:app --reload --port 8003
```

### Erreur d'import
```powershell
# S'assurer d'être dans le bon dossier
cd services/service_stmodel

# Vérifier les dépendances
pip list | grep fastapi
```

---

## 📊 Prochaines étapes

- ✅ Phase 1: API locale fonctionnelle
- ⏳ Phase 2: Connexion base de données PostgreSQL
- ⏳ Phase 3: Intégration Redis (communication avec Yassin)
- ⏳ Phase 4: Connexion aux APIs de Bilal (capteurs + satellite)

---

**🎉 API prête à l'emploi !**
