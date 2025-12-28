"""
Configuration SentinelHub API
Gère les credentials et settings pour le téléchargement d'images satellites
"""
import os
from sentinelhub import SHConfig


class SentinelConfig:
    """Configuration centralisée pour SentinelHub"""
    
    @staticmethod
    def get_config() -> SHConfig:
        """
        Créer et retourner configuration SentinelHub
        
        Les credentials doivent être dans les variables d'environnement:
        - SENTINEL_CLIENT_ID
        - SENTINEL_CLIENT_SECRET
        """
        config = SHConfig()
        
        # Récupérer credentials depuis env
        config.sh_client_id = os.getenv("SENTINEL_CLIENT_ID", "")
        config.sh_client_secret = os.getenv("SENTINEL_CLIENT_SECRET", "")
        config.sh_base_url = "https://services.sentinel-hub.com"
        
        # Valider configuration
        if not config.sh_client_id or not config.sh_client_secret:
            print("⚠️ [Sentinel] Credentials non configurés!")
            print("   Définir SENTINEL_CLIENT_ID et SENTINEL_CLIENT_SECRET")
        
        return config
    
    @staticmethod
    def is_configured() -> bool:
        """Vérifier si les credentials sont configurés"""
        return bool(
            os.getenv("SENTINEL_CLIENT_ID") and 
            os.getenv("SENTINEL_CLIENT_SECRET")
        )
