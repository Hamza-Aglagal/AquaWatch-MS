"""
Schemas simples pour les prédictions
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class MeasurementInput(BaseModel):
    """Une mesure de qualité d'eau (1 jour)"""
    date_capteur: str
    date_satellite: str
    days_diff: float
    station_id: int
    latitude: float
    longitude: float
    pH: float
    oxygene_dissous: float
    COD: float
    CODMn: float
    NH4N: float
    TPH: float
    DIP: float
    DIN: float
    NDWI: float
    chlorophyll_index: float
    turbidity_index: float


class PredictionRequest(BaseModel):
    """Requête de prédiction - 14 jours de données"""
    measurements: List[MeasurementInput] = Field(
        ..., 
        min_length=14, 
        max_length=14,
        description="14 jours de mesures (capteurs + satellites)"
    )


class PredictionResponse(BaseModel):
    """Réponse de prédiction"""
    prediction_id: str
    quality_score: float = Field(..., ge=0, le=1, description="Score normalisé (0-1)")
    quality_score_real: float = Field(..., description="Score réel (échelle originale)")
    confidence: float = Field(..., ge=0, le=1, description="Confiance du modèle")
    timestamp: str
    message: str = "Prédiction réussie"
