"""
Service simple de prédiction
"""
import torch
import numpy as np
import pickle
import json
from datetime import datetime
from pathlib import Path

from ..ml.model import WaterQualityLSTM
from ..config import MODEL_PATH, METRICS_PATH, SCALER_FEATURES_PATH, SCALER_TARGET_PATH


class PredictionService:
    """Service pour charger le modèle et faire des prédictions"""
    
    def __init__(self):
        self.model = None
        self.scaler_features = None
        self.scaler_target = None
        self.metrics = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    def load_model(self):
        """Charge le modèle et les scalers au démarrage"""
        try:
            # Charger le modèle
            print(f"🔄 Chargement du modèle depuis {MODEL_PATH}...")
            self.model = WaterQualityLSTM(input_size=11, hidden_size=64, num_layers=2)
            checkpoint = torch.load(MODEL_PATH, map_location=self.device)
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.to(self.device)
            self.model.eval()
            print("✅ Modèle chargé")
            
            # Charger les scalers
            print(f"🔄 Chargement des scalers...")
            with open(SCALER_FEATURES_PATH, 'rb') as f:
                self.scaler_features = pickle.load(f)
            with open(SCALER_TARGET_PATH, 'rb') as f:
                self.scaler_target = pickle.load(f)
            print("✅ Scalers chargés")
            
            # Charger les métriques
            if METRICS_PATH.exists():
                with open(METRICS_PATH, 'r') as f:
                    self.metrics = json.load(f)
                print(f"✅ Métriques chargées (R²={self.metrics.get('r2', 'N/A'):.3f})")
            
            return True
            
        except Exception as e:
            print(f"❌ Erreur chargement modèle: {e}")
            return False
    
    def is_ready(self):
        """Vérifie si le service est prêt"""
        return self.model is not None and self.scaler_features is not None
    
    def predict(self, measurements_list):
        """
        Fait une prédiction à partir de 14 jours de mesures
        
        Args:
            measurements_list: Liste de 14 dictionnaires avec les mesures
        
        Returns:
            dict: {quality_score_normalized, quality_score_real, confidence}
        """
        if not self.is_ready():
            raise RuntimeError("Modèle non chargé")
        
        # Extraire les features (11 features dans l'ordre d'entraînement)
        features_list = []
        for m in measurements_list:
            features = [
                m.days_diff,
                m.pH,
                m.oxygene_dissous,
                m.COD,
                m.CODMn,
                m.NH4N,
                m.TPH,
                m.DIP,
                m.DIN,
                m.NDWI,
                m.chlorophyll_index
                # Note: turbidity_index non utilisé dans le modèle (11 features seulement)
            ]
            features_list.append(features)
        
        # Convertir en numpy array
        X = np.array(features_list)  # (14, 11)
        
        # Normaliser avec le scaler
        X_normalized = self.scaler_features.transform(X)
        
        # Convertir en tensor PyTorch
        X_tensor = torch.FloatTensor(X_normalized).unsqueeze(0)  # (1, 14, 11)
        X_tensor = X_tensor.to(self.device)
        
        # Prédiction
        with torch.no_grad():
            prediction_normalized = self.model(X_tensor)  # (1, 1)
            prediction_normalized = prediction_normalized.cpu().numpy()[0][0]
        
        # Appliquer un clamping pour garantir [0, 1]
        prediction_normalized = np.clip(prediction_normalized, 0.0, 1.0)
        
        # Dénormaliser pour obtenir le score réel
        prediction_real = self.scaler_target.inverse_transform([[prediction_normalized]])[0][0]
        
        # Calculer confiance (basé sur l'erreur du modèle)
        confidence = max(0.0, min(1.0, 1.0 - self.metrics.get('mae', 0.1)))
        
        return {
            'quality_score_normalized': float(prediction_normalized),
            'quality_score_real': float(prediction_real),
            'confidence': float(confidence)
        }
    
    def get_model_info(self):
        """Retourne les informations du modèle"""
        if not self.is_ready():
            return None
        
        return {
            'model_type': 'WaterQualityLSTM',
            'architecture': '2-layer LSTM (64 hidden units)',
            'input_features': 11,
            'sequence_length': 14,
            'device': str(self.device),
            'metrics': self.metrics if self.metrics else {},
            'model_loaded': True
        }
