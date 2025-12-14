"""
Service simple Redis pour publier les prédictions
"""
import redis
import json
from ..config import REDIS_URL


class RedisPublisher:
    """Publisher Redis simple"""
    
    def __init__(self):
        self.client = None
    
    def connect(self):
        """Connexion à Redis"""
        try:
            self.client = redis.from_url(REDIS_URL, decode_responses=True)
            self.client.ping()
            print("✅ Redis connecté")
            return True
        except Exception as e:
            print(f"⚠️  Redis non disponible: {e}")
            return False
    
    def publish_prediction(self, prediction_data):
        """Publie une prédiction sur le canal 'new_prediction'"""
        if not self.client:
            return False
        
        try:
            message = json.dumps(prediction_data)
            self.client.publish("new_prediction", message)
            return True
        except Exception as e:
            print(f"⚠️  Erreur publication Redis: {e}")
            return False
