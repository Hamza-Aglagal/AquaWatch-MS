"""Routes API Satellite - Endpoints pour données satellites"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional

from app.config.database import Database
from app.models.satellite import SatelliteImageResponse

router = APIRouter(prefix="/api/satellite", tags=["Satellite"])

@router.get("/indices/latest", response_model=SatelliteImageResponse)
def get_latest_indices(
    limit: int = Query(10, ge=1, le=100),
    hours: int = Query(24, ge=1, le=720)
):
    """
    Récupérer les derniers indices satellites (pour Hamza - STModel)
    
    Format standardisé pour machine learning
    
    Args:
        limit: Nombre maximum d'indices à retourner (1-100)
        hours: Période en heures (1-720, soit 30 jours max)
    
    Returns:
        SatelliteImageResponse avec liste d'indices
    """
    try:
        db = Database.get_db()
        collection = db.satellite_images
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {str(e)}")
    
    # Calculer timestamp minimum
    time_threshold = datetime.utcnow() - timedelta(hours=hours)
    
    # Query MongoDB
    cursor = collection.find(
        {
            "processed": True,
            "timestamp": {"$gte": time_threshold},
            "indices": {"$exists": True}
        },
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit)
    
    images = list(cursor)
    
    # Format pour Hamza
    indices_list = []
    for img in images:
        indices_list.append({
            "image_id": img["image_id"],
            "zone": img["zone"],
            "indices": img["indices"],
            "timestamp": img["timestamp"].isoformat()
        })
    
    return {
        "success": True,
        "count": len(indices_list),
        "indices": indices_list
    }

@router.get("/images")
def get_images(skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=100)):
    """Liste toutes les images satellites avec pagination"""
    try:
        db = Database.get_db()
        collection = db.satellite_images
        
        images = list(collection.find({}, {"_id": 0}).skip(skip).limit(limit))
        total = collection.count_documents({})
        
        return {
            "success": True,
            "total": total,
            "count": len(images),
            "images": images if images else []
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")

@router.post("/images")
def create_image(image_data: dict):
    """Créer une nouvelle entrée d'image (mock pour tests)"""
    db = Database.get_db()
    collection = db.satellite_images
    
    # Ajouter timestamp
    image_data["timestamp"] = datetime.utcnow()
    
    result = collection.insert_one(image_data)
    
    return {
        "success": True,
        "message": "Image créée",
        "id": str(result.inserted_id)
    }