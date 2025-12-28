"""
Modèles de base de données simples
"""
from sqlalchemy import Column, Integer, String, DECIMAL, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Prediction(Base):
    """Table des prédictions"""
    __tablename__ = 'predictions'
    
    id = Column(Integer, primary_key=True)
    prediction_id = Column(String(50), unique=True, nullable=False)
    model_id = Column(Integer, nullable=True)  # Référence ml_models
    zone_latitude = Column(DECIMAL(10, 8), nullable=False)
    zone_longitude = Column(DECIMAL(11, 8), nullable=False)
    input_data = Column(JSONB)  # Données d'entrée (14 mesures)
    prediction_results = Column(JSONB)  # Résultats (score, confidence)
    confidence_score = Column(DECIMAL(5, 4))
    prediction_horizon = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
