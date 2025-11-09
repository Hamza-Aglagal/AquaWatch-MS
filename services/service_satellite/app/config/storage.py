from minio import Minio
from minio.error import S3Error
import os

class MinIOStorage:
    client = None
    bucket_name = "satellite-images"
    
    @classmethod
    def connect(cls):
        """Connexion à MinIO"""
        endpoint = os.getenv("MINIO_ENDPOINT", "minio_storage:9000")
        access_key = os.getenv("MINIO_ACCESS_KEY", "admin")
        secret_key = os.getenv("MINIO_SECRET_KEY", "aquawatch123")
        
        try:
            cls.client = Minio(
                endpoint,
                access_key=access_key,
                secret_key=secret_key,
                secure=False  # HTTP (pas HTTPS en local)
            )
            
            # Créer bucket si n'existe pas
            if not cls.client.bucket_exists(cls.bucket_name):
                cls.client.make_bucket(cls.bucket_name)
                print(f"✅ [MinIO] Bucket '{cls.bucket_name}' créé")
            else:
                print(f"✅ [MinIO] Bucket '{cls.bucket_name}' existe déjà")
            
            return cls.client
        except S3Error as e:
            print(f"❌ [MinIO] Erreur connexion: {e}")
            raise
    
    @classmethod
    def get_client(cls):
        """Récupérer le client MinIO"""
        if cls.client is None:
            cls.connect()
        return cls.client