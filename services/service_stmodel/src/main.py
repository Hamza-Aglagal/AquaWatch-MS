"""
Application FastAPI principale - STModel Service
Simple et clair
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from .api.routes import router, prediction_service, redis_publisher


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie - Charge le modèle au démarrage"""
    print("=" * 60)
    print("🚀 Démarrage STModel Service...")
    print("=" * 60)
    
    # Charger le modèle au démarrage
    success = prediction_service.load_model()
    
    if success:
        print("✅ Service prêt à recevoir des requêtes")
    else:
        print("⚠️ Service démarré SANS modèle chargé")
    
    # Connecter Redis (optionnel, ne bloque pas si échec)
    redis_publisher.connect()
    
    print("=" * 60)
    
    yield
    
    # Nettoyage à l'arrêt
    print("🛑 Arrêt du service...")


# Créer l'application FastAPI
app = FastAPI(
    title="AquaWatch - STModel Service",
    description="Service de prédiction de qualité d'eau avec LSTM",
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

# Inclure les routes API
app.include_router(router)


@app.get("/")
async def root():
    """Page d'accueil de l'API"""
    return {
        "service": "STModel",
        "version": "1.0.0",
        "description": "Prédiction qualité d'eau avec LSTM",
        "status": "running",
        "model_loaded": prediction_service.is_ready(),
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "model_info": "/api/model/info",
            "create_prediction": "/api/predictions/create",
            "latest_predictions": "/api/predictions/latest"
        }
    }


@app.get("/health")
async def health():
    """Health check pour Docker"""
    return {
        "status": "healthy" if prediction_service.is_ready() else "degraded",
        "service": "stmodel",
        "model_loaded": prediction_service.is_ready()
    }


if __name__ == "__main__":
    # Démarrer le serveur
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
