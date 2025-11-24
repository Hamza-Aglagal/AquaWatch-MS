from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
import time

class Database:
    client = None
    db = None
    
    @classmethod
    def connect(cls, max_retries=5, retry_delay=3):
        """Connexion à MongoDB avec retry logic"""
        mongo_url = os.getenv(
            "MONGODB_URL",
            "mongodb://satellite_user:satellite_pass@db_satellite:27017/satellite_db"
        )
        
        for attempt in range(1, max_retries + 1):
            try:
                print(f"[MongoDB] Tentative de connexion {attempt}/{max_retries}...")
                cls.client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
                # Test connexion
                cls.client.admin.command('ping')
                cls.db = cls.client.satellite_db
                print(f"✅ [MongoDB] Connecté avec succès!")
                return cls.db
            except ConnectionFailure as e:
                print(f"⚠️ [MongoDB] Échec tentative {attempt}: {e}")
                if attempt < max_retries:
                    print(f"⏳ [MongoDB] Nouvelle tentative dans {retry_delay}s...")
                    time.sleep(retry_delay)
                else:
                    print(f"❌ [MongoDB] Échec après {max_retries} tentatives")
                    raise
    
    @classmethod
    def get_db(cls):
        """Récupérer l'instance de la base"""
        if cls.db is None:
            cls.connect()
        return cls.db
    
    @classmethod
    def close(cls):
        """Fermer la connexion"""
        if cls.client:
            cls.client.close()
            print("🔒 [MongoDB] Connexion fermée")