from pydantic import BaseModel, Field
from typing import Dict, Optional
from datetime import datetime

class ZoneGeographique(BaseModel):
    """Zone géographique pour les images"""
    latitude: float
    longitude: float
    rayon_km: float = 5.0

class IndicesSatellite(BaseModel):
    """Indices calculés depuis l'image satellite"""
    chlorophylle: Optional[float] = None
    turbidite_satellite: Optional[float] = None
    temperature_surface: Optional[float] = None
    ndwi: Optional[float] = None  # Normalized Difference Water Index

class SatelliteImage(BaseModel):
    """Métadonnées d'une image satellite"""
    image_id: str
    zone: ZoneGeographique
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str = "Sentinel-2"  # Sentinel-2, Landsat, etc.
    indices: Optional[IndicesSatellite] = None
    file_path: Optional[str] = None  # Chemin dans MinIO
    processed: bool = False

class SatelliteImageResponse(BaseModel):
    """Réponse API pour Hamza (STModel)"""
    success: bool
    count: int
    indices: list[Dict]