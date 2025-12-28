"""
Service Satellite - AquaWatch
Traitement d'images satellites pour données environnementales
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os

from app.config.database import Database
from app.config.storage import MinIOStorage
from app.routes import satellite


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application"""
    # Startup
    print("🚀 [Satellite] Démarrage du service...")
    
    # Connexion MongoDB
    try:
        Database.connect()
    except Exception as e:
        print(f"❌ Erreur MongoDB: {e}")
        # Ne pas crash si MongoDB pas disponible en mode développement
        print("⚠️ Mode développement - MongoDB optionnel")
    
    # Connexion MinIO
    try:
        MinIOStorage.connect()
    except Exception as e:
        print(f"❌ Erreur MinIO: {e}")
        print("⚠️ Mode développement - MinIO optionnel")
    
    print("✅ [Satellite] Service prêt!")
    
    yield
    
    # Shutdown
    print("🛑 [Satellite] Arrêt du service...")
    Database.close()


# Créer l'application FastAPI
app = FastAPI(
    title="AquaWatch - Service Satellite",
    description="Service de traitement d'images satellites pour analyse de qualité d'eau",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routes
app.include_router(satellite.router)


@app.get("/")
def root():
    """Endpoint racine"""
    return {
        "service": "satellite",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "indices": "/api/satellite/indices/latest",
            "images": "/api/satellite/images"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "satellite",
        "version": "1.0.0",
        "mongodb": "connected" if Database.db is not None else "disconnected",
        "minio": "connected" if MinIOStorage.client is not None else "disconnected"
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)