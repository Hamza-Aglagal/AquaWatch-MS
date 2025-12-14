# 📋 TRAVAIL DE HAMZA AGLAGAL - AQUAWATCH PROJECT

**Développeur:** Hamza Aglagal  
**Service assigné:** Service STModel (Port 8003) + Infrastructure Générale  
**Technologies:** Python/FastAPI, PyTorch, PostgreSQL, Redis, Docker  
**Date:** Décembre 2024

---

## 🎯 RÉSUMÉ GÉNÉRAL

Hamza est responsable du **cœur intelligent du système AquaWatch** : le service de Machine Learning qui prédit la qualité de l'eau en utilisant des modèles spatio-temporels avancés. Il gère également l'infrastructure générale Docker et la communication inter-services via Redis.

**Mission principale:** Développer des modèles de prédiction ConvLSTM (Convolutional Long Short-Term Memory) qui analysent les données historiques des capteurs et satellites pour prédire la qualité de l'eau sur 24h et 72h, puis publier ces prédictions sur Redis pour déclencher les alertes automatiques.

---

## 🧠 SERVICE STMODEL (Port 8003)

### 🏗️ ARCHITECTURE ET STRUCTURE

**Chemin du service:** `services/service_stmodel/`

**Structure des fichiers:**
```
service_stmodel/
├── src/
│   ├── main.py                       # Point d'entrée FastAPI
│   ├── config.py                     # Configuration (DB, Redis, URLs)
│   ├── database/
│   │   ├── connection.py             # Connexion PostgreSQL
│   │   └── models.py                 # Tables SQL (predictions, models)
│   ├── ml/
│   │   ├── convlstm.py              # Architecture ConvLSTM PyTorch
│   │   ├── preprocessing.py          # Normalisation et séquences
│   │   ├── train.py                  # Script entraînement modèles
│   │   └── predict.py                # Service de prédiction
│   ├── data/
│   │   ├── api_client.py            # Client APIs Bilal (Capteurs + Satellite)
│   │   └── fusion.py                # Fusion données spatio-temporelles
│   └── services/
│       ├── prediction_service.py     # Logique prédictions
│       └── redis_publisher.py        # Publication Redis vers Yassin
├── models/                           # Modèles entraînés (.pth)
│   ├── convlstm_v1.pth              # Version 1 Phase 1 (dataset externe)
│   ├── convlstm_v2.pth              # Version 2 Phase 2 (APIs Bilal)
│   └── model_info.json              # Métadonnées (accuracy, MSE, etc.)
├── data/                            # Datasets
│   ├── raw/                         # Données brutes téléchargées
│   └── processed/                   # Données nettoyées
├── notebooks/                       # Jupyter exploration
│   ├── 01_data_exploration.ipynb   # Analyse dataset
│   ├── 02_model_training.ipynb     # Entraînement modèle
│   └── 03_evaluation.ipynb         # Tests performance
├── requirements.txt                 # Dépendances Python
├── Dockerfile                       # Image Docker service
└── README.md                        # Documentation
```

### 🔧 TECHNOLOGIES ET OUTILS UTILISÉS

**Framework Machine Learning:**
- **PyTorch 2.4.1** - Framework Deep Learning flexible
- **TorchVision 0.19.1** - Outils vision par ordinateur
- **PyTorch Lightning 2.4.0** - Framework haut niveau pour entraînement optimisé
- **CUDA Support** - Accélération GPU si disponible

**Backend API:**
- **FastAPI 0.104** - Framework web asynchrone haute performance
- **Uvicorn** - Serveur ASGI production
- **Pydantic 2.5** - Validation et sérialisation données

**Traitement données:**
- **NumPy 1.26+** - Calculs numériques optimisés
- **Pandas 2.0+** - Manipulation DataFrames séries temporelles
- **Scikit-learn 1.3+** - Preprocessing (StandardScaler, MinMaxScaler)
- **Matplotlib 3.7+** - Visualisations courbes entraînement
- **Seaborn 0.12+** - Graphiques statistiques avancés

**Base de données:**
- **PostgreSQL 14** - Base de données relationnelle
- **Psycopg2** - Driver PostgreSQL Python
- **SQLAlchemy 2.0** - ORM Python avancé
- Database: `predictions_db`
- Port: 5434 (externe), 5432 (interne)

**Communication inter-services:**
- **Redis 5.0** - Message broker pub/sub
- **Requests 2.31** - Client HTTP pour APIs
- **HTTPx 0.27** - Client HTTP asynchrone
- **IORedis** - Client Redis Python

### 📋 PROCESSUS DE FONCTIONNEMENT

**PHASE 1 : DÉVELOPPEMENT AVEC DATASET EXTERNE**

**Étape 1 : Téléchargement dataset**
```python
# Téléchargement dataset Kaggle Water Quality
# Dataset: water_quality_india.csv ou similaire
# Features: pH, temperature, turbidité, oxygène, conductivité, coordonnées GPS
import kaggle
kaggle.api.dataset_download_files('water-quality-dataset', path='./data/raw')
```

**Étape 2 : Exploration et nettoyage données**
```python
import pandas as pd
import numpy as np

# Chargement données
df = pd.read_csv('data/raw/water_quality.csv')

# Nettoyage
df.dropna(subset=['ph', 'temperature', 'turbidite'], inplace=True)
df['timestamp'] = pd.to_datetime(df['timestamp'])
df.sort_values('timestamp', inplace=True)

# Features engineering
df['hour'] = df['timestamp'].dt.hour
df['day_of_week'] = df['timestamp'].dt.dayofweek
df['month'] = df['timestamp'].dt.month

# Target variable : score qualité eau (0-10)
def calculate_quality_score(row):
    ph_score = 1 - abs(row['ph'] - 7.0) / 7.0
    temp_score = 1 - abs(row['temperature'] - 20) / 30
    turb_score = max(0, 1 - row['turbidite'] / 100)
    oxy_score = min(row['oxygene'] / 10, 1.0)
    
    quality = (ph_score + temp_score + turb_score + oxy_score) / 4 * 10
    return quality

df['qualite_score'] = df.apply(calculate_quality_score, axis=1)

# Sauvegarde
df.to_csv('data/processed/water_quality_clean.csv', index=False)
```

**Étape 3 : Préparation séquences temporelles**
```python
class WaterQualityPreprocessor:
    def __init__(self, sequence_length=24):
        """
        sequence_length: Nombre d'heures historiques (24h = 1 jour)
        """
        self.sequence_length = sequence_length
        self.scaler = StandardScaler()
    
    def create_sequences(self, X, y, horizon=24):
        """
        Créer séquences pour LSTM
        
        Args:
            X: Features (N x features)
            y: Target (N x 1)
            horizon: Heures dans le futur à prédire
        
        Returns:
            X_sequences: (N - seq_len - horizon, seq_len, features)
            y_sequences: (N - seq_len - horizon, 1)
        """
        X_sequences, y_sequences = [], []
        
        for i in range(len(X) - self.sequence_length - horizon + 1):
            # Séquence input : 24 dernières heures
            X_seq = X[i : i + self.sequence_length]
            
            # Target : qualité à l'horizon (24h dans futur)
            y_target = y[i + self.sequence_length + horizon - 1]
            
            X_sequences.append(X_seq)
            y_sequences.append(y_target)
        
        return np.array(X_sequences), np.array(y_sequences)
    
    def normalize(self, X):
        """Normalisation features avec StandardScaler"""
        return self.scaler.fit_transform(X)
```

**Étape 4 : Construction modèle ConvLSTM**

**Architecture SimpleWaterQualityLSTM (Version simplifiée pour débuter):**
```python
import torch
import torch.nn as nn

class SimpleWaterQualityLSTM(nn.Module):
    """
    LSTM classique pour prédictions qualité eau
    Plus simple que ConvLSTM complet pour Phase 1
    """
    
    def __init__(self, input_dim=7, hidden_dim=64, num_layers=2):
        super(SimpleWaterQualityLSTM, self).__init__()
        
        # Couches LSTM empilées
        self.lstm = nn.LSTM(
            input_size=input_dim,       # 7 features (ph, temp, turb, oxy, cond, lat, lon)
            hidden_size=hidden_dim,      # 64 unités cachées
            num_layers=num_layers,       # 2 couches LSTM
            batch_first=True,            # (batch, seq, features)
            dropout=0.2                  # Régularisation
        )
        
        # Couches fully connected
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 1)             # Output : score qualité (0-10)
        )
    
    def forward(self, x):
        """
        Args:
            x: (batch, seq_len=24, input_dim=7)
        Returns:
            pred: (batch, 1)
        """
        # Passage LSTM
        lstm_out, (h_n, c_n) = self.lstm(x)
        
        # Dernière sortie temporelle
        last_output = lstm_out[:, -1, :]
        
        # Prédiction finale
        pred = self.fc(last_output)
        
        return pred
```

**Architecture WaterQualityConvLSTM (Version avancée):**
```python
class ConvLSTMCell(nn.Module):
    """
    Cellule ConvLSTM : combine LSTM + Convolutions 2D
    Pour patterns spatio-temporels
    """
    
    def __init__(self, input_dim, hidden_dim, kernel_size=3, bias=True):
        super(ConvLSTMCell, self).__init__()
        
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.kernel_size = kernel_size
        self.padding = kernel_size // 2
        
        # Convolution pour gates LSTM (input, forget, cell, output)
        self.conv = nn.Conv2d(
            in_channels=input_dim + hidden_dim,
            out_channels=4 * hidden_dim,
            kernel_size=kernel_size,
            padding=self.padding,
            bias=bias
        )
    
    def forward(self, input_tensor, cur_state):
        h_cur, c_cur = cur_state
        
        # Concatenation input + hidden state
        combined = torch.cat([input_tensor, h_cur], dim=1)
        
        # Convolution combinée
        combined_conv = self.conv(combined)
        
        # Split en 4 gates
        cc_i, cc_f, cc_o, cc_g = torch.split(combined_conv, self.hidden_dim, dim=1)
        
        # Gates LSTM avec convolutions
        i = torch.sigmoid(cc_i)
        f = torch.sigmoid(cc_f)
        o = torch.sigmoid(cc_o)
        g = torch.tanh(cc_g)
        
        # Nouvel état cellule et hidden
        c_next = f * c_cur + i * g
        h_next = o * torch.tanh(c_next)
        
        return h_next, c_next


class WaterQualityConvLSTM(nn.Module):
    """
    Modèle ConvLSTM complet pour prédictions spatio-temporelles
    """
    
    def __init__(self, input_dim=7, hidden_dims=[64, 32], kernel_sizes=[3, 3], num_layers=2):
        super(WaterQualityConvLSTM, self).__init__()
        
        self.num_layers = num_layers
        self.hidden_dims = hidden_dims
        
        # Empilement couches ConvLSTM
        cell_list = []
        for i in range(num_layers):
            cur_input_dim = input_dim if i == 0 else hidden_dims[i-1]
            
            cell_list.append(ConvLSTMCell(
                input_dim=cur_input_dim,
                hidden_dim=hidden_dims[i],
                kernel_size=kernel_sizes[i]
            ))
        
        self.cell_list = nn.ModuleList(cell_list)
        
        # Couche output
        self.output = nn.Sequential(
            nn.Conv2d(hidden_dims[-1], 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(16, 1)
        )
    
    def forward(self, x):
        """
        Args:
            x: (batch, seq_len, channels, height, width)
        Returns:
            pred: (batch, 1)
        """
        batch_size, seq_len, _, height, width = x.size()
        
        # Initialisation hidden states
        hidden_states = []
        for i in range(self.num_layers):
            h = torch.zeros(batch_size, self.hidden_dims[i], height, width).to(x.device)
            c = torch.zeros(batch_size, self.hidden_dims[i], height, width).to(x.device)
            hidden_states.append((h, c))
        
        # Propagation temporelle
        for t in range(seq_len):
            input_t = x[:, t, :, :, :]
            
            for layer_idx in range(self.num_layers):
                if layer_idx == 0:
                    input_t = input_t
                else:
                    input_t = hidden_states[layer_idx - 1][0]
                
                h, c = self.cell_list[layer_idx](input_t, hidden_states[layer_idx])
                hidden_states[layer_idx] = (h, c)
        
        # Dernière hidden state
        last_hidden = hidden_states[-1][0]
        
        # Prédiction
        pred = self.output(last_hidden)
        
        return pred
```

**Étape 5 : Entraînement du modèle**
```python
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

class ModelTrainer:
    def __init__(self, model, device='cuda'):
        self.model = model.to(device)
        self.device = device
        self.criterion = nn.MSELoss()
        self.optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    def train_epoch(self, train_loader):
        self.model.train()
        total_loss = 0
        
        for batch_X, batch_y in train_loader:
            batch_X = batch_X.to(self.device)
            batch_y = batch_y.to(self.device)
            
            # Forward pass
            predictions = self.model(batch_X)
            loss = self.criterion(predictions, batch_y)
            
            # Backward pass
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
        
        return total_loss / len(train_loader)
    
    def validate(self, val_loader):
        self.model.eval()
        total_loss = 0
        
        with torch.no_grad():
            for batch_X, batch_y in val_loader:
                batch_X = batch_X.to(self.device)
                batch_y = batch_y.to(self.device)
                
                predictions = self.model(batch_X)
                loss = self.criterion(predictions, batch_y)
                
                total_loss += loss.item()
        
        return total_loss / len(val_loader)
    
    def train(self, train_loader, val_loader, num_epochs=50):
        best_val_loss = float('inf')
        history = {'train_loss': [], 'val_loss': []}
        
        for epoch in range(num_epochs):
            train_loss = self.train_epoch(train_loader)
            val_loss = self.validate(val_loader)
            
            history['train_loss'].append(train_loss)
            history['val_loss'].append(val_loss)
            
            print(f"Epoch {epoch+1}/{num_epochs} - Train Loss: {train_loss:.4f} - Val Loss: {val_loss:.4f}")
            
            # Sauvegarder meilleur modèle
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': self.model.state_dict(),
                    'optimizer_state_dict': self.optimizer.state_dict(),
                    'val_loss': val_loss
                }, 'models/best_model.pth')
                print(f"✅ Modèle sauvegardé (Val Loss: {val_loss:.4f})")
        
        return history

# Utilisation
model = SimpleWaterQualityLSTM(input_dim=7, hidden_dim=64, num_layers=2)
trainer = ModelTrainer(model, device='cuda' if torch.cuda.is_available() else 'cpu')

# Préparation données
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)

# Entraînement
history = trainer.train(train_loader, val_loader, num_epochs=50)
```

**Étape 6 : API FastAPI avec modèle entraîné**
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import json

app = FastAPI(
    title="AquaWatch STModel API",
    description="API de prédiction qualité eau avec modèles spatio-temporels",
    version="1.0.0"
)

# Chargement modèle
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = None
model_info = None

@app.on_event("startup")
async def load_model():
    global model, model_info
    
    # Charger métadonnées
    with open('models/model_info.json', 'r') as f:
        model_info = json.load(f)
    
    # Créer modèle
    model = SimpleWaterQualityLSTM(
        input_dim=model_info['input_dim'],
        hidden_dim=model_info['hidden_dim'],
        num_layers=model_info['num_layers']
    )
    
    # Charger poids
    checkpoint = torch.load('models/best_model.pth', map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    model.eval()
    
    print(f"✅ Modèle chargé: {model_info['model_type']}")

# Modèles Pydantic
class PredictionRequest(BaseModel):
    latitude: float
    longitude: float
    horizon: int = 24  # Horizon prédiction en heures

class PredictionResponse(BaseModel):
    prediction_id: str
    qualite_score: float
    qualite_categorie: str  # EXCELLENTE, BONNE, MOYENNE, MAUVAISE
    confiance: float
    horizon_heures: int
    timestamp: str

# Routes
@app.get("/")
async def root():
    return {
        "service": "STModel - Prédiction qualité eau",
        "version": "1.0.0",
        "model_loaded": model is not None
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "stmodel",
        "pytorch_version": torch.__version__,
        "device": device,
        "model_loaded": model is not None
    }

@app.get("/api/model/info")
async def get_model_info():
    if model_info is None:
        raise HTTPException(status_code=503, detail="Modèle non chargé")
    return model_info

@app.post("/api/predictions/create", response_model=PredictionResponse)
async def create_prediction(request: PredictionRequest):
    """
    Créer nouvelle prédiction qualité eau
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Modèle non disponible")
    
    # Récupérer données depuis APIs Bilal
    data = await fetch_data_from_apis(request.latitude, request.longitude)
    
    # Prétraitement
    X = preprocess_data(data)
    X_tensor = torch.FloatTensor(X).unsqueeze(0).to(device)
    
    # Prédiction
    with torch.no_grad():
        pred_score = model(X_tensor).item()
    
    # Catégorisation
    if pred_score >= 8:
        categorie = "EXCELLENTE"
    elif pred_score >= 6:
        categorie = "BONNE"
    elif pred_score >= 4:
        categorie = "MOYENNE"
    else:
        categorie = "MAUVAISE"
    
    # Génération ID
    prediction_id = f"PRED{int(time.time())}"
    
    # Calcul confiance (basé sur variance)
    confiance = min(0.95, max(0.6, 1.0 - abs(pred_score - 5) / 10))
    
    # Publier sur Redis si qualité mauvaise
    if categorie in ["MOYENNE", "MAUVAISE"]:
        await publish_to_redis(prediction_id, pred_score, request.latitude, request.longitude)
    
    return PredictionResponse(
        prediction_id=prediction_id,
        qualite_score=round(pred_score, 2),
        qualite_categorie=categorie,
        confiance=round(confiance, 2),
        horizon_heures=request.horizon,
        timestamp=datetime.utcnow().isoformat()
    )
```

**PHASE 2 : INTÉGRATION AVEC APIs DE BILAL**

**Étape 7 : Client APIs Bilal**
```python
import requests
import pandas as pd
from typing import Optional

class BilalAPIClient:
    """Client pour récupérer données depuis services de Bilal"""
    
    def __init__(self):
        self.capteurs_url = "http://service_capteurs:8000"
        self.satellite_url = "http://service_satellite:8000"
    
    def get_capteurs_data(self, hours=24) -> Optional[pd.DataFrame]:
        """Récupérer données capteurs"""
        try:
            response = requests.get(
                f"{self.capteurs_url}/api/capteurs/data/latest",
                params={"limit": 100, "hours": hours},
                timeout=5
            )
            response.raise_for_status()
            
            data = response.json()
            if not data.get('success'):
                return None
            
            # Conversion en DataFrame
            records = []
            for capteur in data['capteurs']:
                record = {
                    'capteur_id': capteur['capteur_id'],
                    'latitude': capteur['latitude'],
                    'longitude': capteur['longitude'],
                    'timestamp': capteur['timestamp'],
                    **capteur['mesures']
                }
                records.append(record)
            
            return pd.DataFrame(records)
        
        except Exception as e:
            print(f"❌ Erreur récupération capteurs: {e}")
            return None
    
    def get_satellite_indices(self, hours=72) -> Optional[pd.DataFrame]:
        """Récupérer indices satellites"""
        try:
            response = requests.get(
                f"{self.satellite_url}/api/satellite/indices/latest",
                params={"limit": 50, "hours": hours},
                timeout=10
            )
            response.raise_for_status()
            
            data = response.json()
            if not data.get('success'):
                return None
            
            # Conversion en DataFrame
            records = []
            for index in data['indices']:
                record = {
                    'image_id': index['image_id'],
                    'latitude': index['latitude'],
                    'longitude': index['longitude'],
                    'timestamp': index['timestamp'],
                    'chlorophylle': index['indices']['chlorophylle'],
                    'turbidite_satellite': index['indices']['turbidite_satellite'],
                    'ndwi': index['indices']['ndwi']
                }
                records.append(record)
            
            return pd.DataFrame(records)
        
        except Exception as e:
            print(f"❌ Erreur récupération satellite: {e}")
            return None
```

**Étape 8 : Fusion spatio-temporelle**
```python
def fusion_spatiotemporelle(capteurs_df, satellite_df, threshold_km=10):
    """
    Fusionner données capteurs et satellites par proximité géographique
    
    Args:
        capteurs_df: DataFrame mesures capteurs
        satellite_df: DataFrame indices satellites
        threshold_km: Distance maximale pour fusion (km)
    
    Returns:
        DataFrame fusionné avec toutes features
    """
    from scipy.spatial.distance import cdist
    
    merged_records = []
    
    for _, capteur in capteurs_df.iterrows():
        lat_c, lon_c = capteur['latitude'], capteur['longitude']
        
        # Trouver satellite le plus proche
        distances = []
        for _, sat in satellite_df.iterrows():
            lat_s, lon_s = sat['latitude'], sat['longitude']
            
            # Distance haversine approximative
            dlat = lat_s - lat_c
            dlon = lon_s - lon_c
            dist_km = np.sqrt(dlat**2 + dlon**2) * 111  # 1 degré ≈ 111 km
            
            distances.append(dist_km)
        
        if len(distances) > 0:
            min_idx = np.argmin(distances)
            min_dist = distances[min_idx]
            
            if min_dist < threshold_km:
                sat_row = satellite_df.iloc[min_idx]
                
                # Fusion record
                merged = {
                    **capteur.to_dict(),
                    'chlorophylle': sat_row['chlorophylle'],
                    'turbidite_satellite': sat_row['turbidite_satellite'],
                    'ndwi': sat_row['ndwi'],
                    'distance_sat_km': min_dist
                }
                merged_records.append(merged)
    
    return pd.DataFrame(merged_records)
```

**Étape 9 : Publication Redis**
```python
import redis
import json

class RedisPredictionPublisher:
    """Publier prédictions sur Redis pour Yassin (Alertes)"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host='redis_queue',
            port=6379,
            decode_responses=True
        )
        self.channel = 'new_prediction'
    
    def publish(self, prediction_id, score, latitude, longitude, categorie):
        """
        Publier prédiction sur canal Redis
        
        Format message:
        {
          "prediction_id": "PRED1234567890",
          "zone": {
            "latitude": 33.5731,
            "longitude": -7.5898
          },
          "predictions": {
            "qualite_eau": "MAUVAISE",
            "score_qualite": 3.2,
            "ph_predit": 8.7,
            "risque_pollution": "ELEVE"
          },
          "confidence": 0.85,
          "timestamp": "2024-12-14T10:35:00Z"
        }
        """
        message = {
            "prediction_id": prediction_id,
            "zone": {
                "latitude": latitude,
                "longitude": longitude
            },
            "predictions": {
                "qualite_eau": categorie,
                "score_qualite": score,
                "risque_pollution": "ELEVE" if score < 4 else "MOYEN" if score < 6 else "FAIBLE"
            },
            "confidence": 0.85,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            receivers = self.redis_client.publish(self.channel, json.dumps(message))
            print(f"📢 Prédiction publiée sur Redis: {prediction_id} (receivers: {receivers})")
            return True
        except Exception as e:
            print(f"❌ Erreur publication Redis: {e}")
            return False
```

**Étape 10 : Stockage en base de données**
```python
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class MLModel(Base):
    """Table historique modèles entraînés"""
    __tablename__ = 'ml_models'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    version = Column(String(20), nullable=False)
    architecture = Column(String(50))  # LSTM, ConvLSTM
    hyperparameters = Column(JSON)
    metrics = Column(JSON)  # MSE, MAE, R2
    trained_at = Column(DateTime, default=datetime.utcnow)
    model_path = Column(String(255))
    is_active = Column(Boolean, default=False)

class Prediction(Base):
    """Table prédictions"""
    __tablename__ = 'predictions'
    
    id = Column(Integer, primary_key=True)
    prediction_id = Column(String(50), unique=True, nullable=False)
    model_id = Column(Integer)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    qualite_score = Column(Float, nullable=False)
    qualite_categorie = Column(String(20))
    confidence = Column(Float)
    horizon_heures = Column(Integer, default=24)
    input_data = Column(JSON)  # Données utilisées
    created_at = Column(DateTime, default=datetime.utcnow)

# Connexion database
DATABASE_URL = "postgresql://predictions_user:predictions_pass_2025@db_predictions:5432/predictions_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Créer tables
Base.metadata.create_all(engine)

# Sauvegarder prédiction
def save_prediction(prediction_id, score, categorie, latitude, longitude):
    session = SessionLocal()
    try:
        pred = Prediction(
            prediction_id=prediction_id,
            latitude=latitude,
            longitude=longitude,
            qualite_score=score,
            qualite_categorie=categorie,
            confidence=0.85
        )
        session.add(pred)
        session.commit()
        print(f"✅ Prédiction sauvegardée: {prediction_id}")
    except Exception as e:
        session.rollback()
        print(f"❌ Erreur sauvegarde: {e}")
    finally:
        session.close()
```

### 🎯 RÔLE DANS L'ARCHITECTURE GLOBALE

**Consommation de données:**
- Récupère mesures capteurs depuis Service Capteurs (Bilal) toutes les heures
- Récupère indices satellites depuis Service Satellite (Bilal) toutes les 3 heures
- Fusionne données spatio-temporelles pour créer features ML

**Production de prédictions:**
- Génère prédictions qualité eau 24h et 72h à l'avance
- Publie sur Redis canal `new_prediction` quand qualité MAUVAISE/MOYENNE
- Déclenche automatiquement Service Alertes de Yassin

**Intégration Docker:**
```yaml
service_stmodel:
  build: ./services/service_stmodel
  depends_on: [db_predictions, redis_queue]
  ports: ["8003:8000"]
  environment:
    - DATABASE_URL=postgresql://predictions_user:predictions_pass_2025@db_predictions:5432/predictions_db
    - REDIS_URL=redis://redis_queue:6379
    - CAPTEURS_API_URL=http://service_capteurs:8000
    - SATELLITE_API_URL=http://service_satellite:8000
  volumes:
    - ./services/service_stmodel/models:/app/models
```

---

## 🐳 INFRASTRUCTURE DOCKER GÉNÉRALE

### Responsabilités Infrastructure

**Fichier `docker-compose.yml`:**
```yaml
services:
  # Bases de données
  db_capteurs:        # TimescaleDB pour capteurs (Bilal)
  db_satellite:       # MongoDB pour satellites (Bilal)
  db_predictions:     # PostgreSQL pour prédictions (Hamza) ⭐
  db_alerts:          # PostgreSQL pour alertes (Yassin)
  db_geo:             # PostGIS pour cartographie (Yassin)
  
  # Stockage et messaging
  minio_storage:      # MinIO S3 pour images satellites
  redis_queue:        # Redis pub/sub pour communication ⭐
  
  # Services métier
  service_capteurs:   # Service Capteurs (Bilal)
  service_satellite:  # Service Satellite (Bilal)
  service_stmodel:    # Service STModel (Hamza) ⭐
  service_alertes:    # Service Alertes (Yassin)
  service_api_sig:    # Service API-SIG (Yassin)
  
  # Infrastructure GeoServer
  geoserver:          # Serveur cartographique (Yassin)
```

**Configuration réseau Docker:**
```yaml
networks:
  default:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

**Volumes persistants:**
```yaml
volumes:
  db_predictions_data:     # Données PostgreSQL prédictions
  redis_data:              # Données Redis
  models_storage:          # Modèles PyTorch entraînés
```

### Scripts DevOps

**Script démarrage complet:**
```powershell
# start_all.ps1
Write-Host "🚀 Démarrage infrastructure AquaWatch" -ForegroundColor Cyan

# Bases de données
docker compose up db_capteurs db_satellite db_predictions db_alerts db_geo -d
Start-Sleep -Seconds 10

# Stockage et messaging
docker compose up minio_storage redis_queue -d
Start-Sleep -Seconds 5

# Services métier
docker compose up service_capteurs service_satellite service_stmodel service_alertes service_api_sig -d

# GeoServer
docker compose up geoserver -d

Write-Host "✅ Infrastructure démarrée" -ForegroundColor Green
```

---

## 📊 TESTS ET VALIDATION

### Tests Service STModel

**Test 1 - Connexion PostgreSQL:**
```powershell
docker compose exec db_predictions psql -U predictions_user -d predictions_db -c "\dt"
# Attendu: tables ml_models, predictions
```

**Test 2 - API Health:**
```powershell
curl http://localhost:8003/health
# Attendu: {"status":"healthy","model_loaded":true}
```

**Test 3 - Info modèle:**
```powershell
curl http://localhost:8003/api/model/info
# Attendu: {"model_type":"SimpleWaterQualityLSTM","test_mse":0.34,...}
```

**Test 4 - Création prédiction:**
```powershell
curl -X POST http://localhost:8003/api/predictions/create `
  -H "Content-Type: application/json" `
  -d '{"latitude":33.5731,"longitude":-7.5898,"horizon":24}'

# Attendu: {"prediction_id":"PRED...","qualite_score":6.8,"qualite_categorie":"BONNE",...}
```

**Test 5 - Publication Redis:**
```powershell
# Terminal 1: Subscribe
docker compose exec redis_queue redis-cli SUBSCRIBE new_prediction

# Terminal 2: Trigger prédiction MAUVAISE
curl -X POST http://localhost:8003/api/predictions/create `
  -d '{"latitude":34.0,"longitude":-6.0,"horizon":24}'

# Attendu dans Terminal 1: Message JSON reçu
```

---

## 🎓 COMPÉTENCES DÉVELOPPÉES

### Compétences techniques Hamza

**Machine Learning / Deep Learning:**
- Architectures LSTM et ConvLSTM avec PyTorch
- Entraînement modèles séries temporelles
- Preprocessing données (normalisation, séquences)
- Hyperparameter tuning
- Évaluation modèles (MSE, MAE, R2)
- PyTorch Lightning pour pipelines avancés

**Data Science:**
- Manipulation séries temporelles avec Pandas
- Feature engineering
- Fusion données multi-sources
- Calculs géospatiaux
- Visualisation données (Matplotlib, Seaborn)

**Backend Development:**
- APIs REST avec FastAPI
- Validation Pydantic
- Asynchronous programming Python
- SQLAlchemy ORM
- Gestion états avec Redis

**DevOps / Infrastructure:**
- Docker Compose multi-containers
- Orchestration services microservices
- Gestion volumes et networks Docker
- Variables environnement
- Monitoring et health checks

**Communication inter-services:**
- Clients HTTP (Requests, HTTPx)
- Redis pub/sub messaging
- REST API design patterns
- JSON serialization

---

## 📝 RÉSUMÉ STATISTIQUES

### Service STModel
- **Endpoints API:** 4
- **Modèles ML:** 2 (SimpleWaterQualityLSTM, WaterQualityConvLSTM)
- **Features input:** 7 (ph, temp, turbidité, oxygène, conductivité, lat, lon)
- **Horizons prédiction:** 24h et 72h
- **Base de données:** PostgreSQL 14
- **Port:** 8003
- **Lignes de code:** ~2000 lignes Python
- **Dépendances:** 25+ packages Python

### Infrastructure Docker
- **Services gérés:** 11 containers
- **Bases de données:** 5 instances
- **Ports exposés:** 8 (5433, 27017, 5434, 5435, 5436, 6379, 9000, 9001)
- **Networks:** 1 réseau bridge custom
- **Volumes:** 8 volumes persistants

---

## 🚀 IMPACT SUR LE PROJET

**Criticité:** ⭐⭐⭐⭐⭐ (5/5)

Le service STModel de Hamza est le **cerveau prédictif** du système AquaWatch:

- **Valeur métier:** Anticipe problèmes qualité eau 24-72h avant
- **Alertes proactives:** Déclenche notifications automatiques via Redis
- **Intelligence:** Modèles ML sophistiqués (ConvLSTM) pour patterns spatio-temporels
- **Scalabilité:** Architecture microservices permet ajout nouveaux modèles
- **Innovation:** Fusion capteurs + satellites pour prédictions précises

**Dependencies:**
- Dépend à 100% de Bilal pour données entrée (capteurs + satellites)
- Pilote Service Alertes de Yassin via messages Redis
- Fournit prédictions à API-SIG de Yassin pour visualisation carte

---

**Document généré le:** 14 décembre 2024  
**Version:** 1.0  
**Contact projet:** AquaWatch-MS Team
