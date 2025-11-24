"""Service de téléchargement d'images Sentinel-2"""
from sentinelhub import SHConfig, SentinelHubRequest, DataCollection, MimeType, CRS, BBox
from datetime import datetime, timedelta
from typing import Optional
import numpy as np

from app.config.sentinel import SentinelConfig


class SentinelDownloader:
    """Téléchargeur d'images satellites Sentinel-2"""
    
    def __init__(self):
        """Initialiser avec configuration SentinelHub"""
        self.config = SentinelConfig.get_config()
    
    def download_image(self, latitude: float, longitude: float, rayon_km: float = 5.0) -> Optional[np.ndarray]:
        """
        Télécharger image Sentinel-2 pour une zone géographique
        
        Args:
            latitude: Latitude du centre de la zone
            longitude: Longitude du centre de la zone
            rayon_km: Rayon en kilomètres autour du point central
        
        Returns:
            Numpy array contenant les 4 bandes (B02, B03, B04, B08) ou None si erreur
        """
        if not SentinelConfig.is_configured():
            print("❌ [Sentinel] API non configurée - impossible de télécharger")
            return None
        # Conversion rayon en degrés (approximation)
        delta = rayon_km / 111.0  # 1 degré ≈ 111 km
        
        bbox = BBox(
            bbox=[
                longitude - delta,
                latitude - delta,
                longitude + delta,
                latitude + delta
            ],
            crs=CRS.WGS84
        )
        
        # Définir période (derniers 7 jours)
        time_interval = (
            (datetime.utcnow() - timedelta(days=7)).isoformat(),
            datetime.utcnow().isoformat()
        )
        
        # Requête Sentinel Hub
        evalscript = """
        //VERSION=3
        function setup() {
            return {
                input: ["B02", "B03", "B04", "B08"],
                output: { bands: 4 }
            };
        }
        function evaluatePixel(sample) {
            return [sample.B02, sample.B03, sample.B04, sample.B08];
        }
        """
        
        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL2_L2A,
                    time_interval=time_interval
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.TIFF)
            ],
            bbox=bbox,
            size=[512, 512],
            config=self.config
        )
        
        # Télécharger
        try:
            images = request.get_data()
            return images[0] if images else None
        except Exception as e:
            print(f"❌ Erreur téléchargement: {e}")
            return None