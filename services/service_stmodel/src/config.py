"""
Configuration simple pour STModel
"""
import os
from pathlib import Path

# Chemins
BASE_DIR = Path(__file__).parent.parent
MODEL_PATH = BASE_DIR / "models" / "best_model.pth"
METRICS_PATH = BASE_DIR / "models" / "metrics.json"
SCALER_FEATURES_PATH = BASE_DIR / "data" / "processed" / "sequences" / "scaler_features.pkl"
SCALER_TARGET_PATH = BASE_DIR / "data" / "processed" / "sequences" / "scaler_target.pkl"

# Base de données
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://predictions_user:predictions_pass_2025@localhost:5434/predictions_db"
)

# Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# APIs externes (pour Phase 2)
CAPTEURS_API_URL = os.getenv("CAPTEURS_API_URL", "http://localhost:8001")
SATELLITE_API_URL = os.getenv("SATELLITE_API_URL", "http://localhost:8002")

# Configuration modèle
SEQUENCE_LENGTH = 14  # 14 jours d'historique
NUM_FEATURES = 11     # Nombre de features du modèle
HIDDEN_SIZE = 64
NUM_LAYERS = 2
