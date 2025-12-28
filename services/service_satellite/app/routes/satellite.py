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


@router.get("/indices/location")
def get_indices_by_location(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
    radius_km: float = Query(50.0, ge=1, le=500, description="Rayon de recherche en km"),
    hours: int = Query(336, ge=1, le=720, description="Période en heures (default: 14 jours)"),
    limit: int = Query(14, ge=1, le=100, description="Nombre max de résultats")
):
    """
    Récupérer les indices satellites par localisation géographique.
    
    Endpoint utilisé par le service STModel pour récupérer les indices
    (NDWI, chlorophyll, turbidity) pour une zone spécifique.
    
    Args:
        lat: Latitude du point central
        lon: Longitude du point central
        radius_km: Rayon de recherche en kilomètres
        hours: Période de recherche en heures (default: 336 = 14 jours)
        limit: Nombre maximum de résultats
    
    Returns:
        Liste des indices satellites pour la zone
    """
    import random
    
    images = []
    db_available = False
    
    try:
        db = Database.get_db()
        collection = db.satellite_images
        db_available = True
        
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
        ).sort("timestamp", -1).limit(limit * 5)
        
        images = list(cursor)
    except Exception as e:
        print(f"⚠️ MongoDB unavailable: {e}, returning simulated data")
        db_available = False
    
    # Filtrer par distance (calcul simple pour demo)
    def haversine_distance(lat1, lon1, lat2, lon2):
        """Calcul distance approximative en km"""
        from math import radians, sin, cos, sqrt, atan2
        R = 6371  # Rayon de la Terre en km
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c
    
    # Filtrer les images dans le rayon
    filtered_indices = []
    for img in images:
        zone = img.get("zone", {})
        img_lat = zone.get("latitude") or zone.get("lat")
        img_lon = zone.get("longitude") or zone.get("lon")
        
        if img_lat is not None and img_lon is not None:
            distance = haversine_distance(lat, lon, img_lat, img_lon)
            if distance <= radius_km:
                filtered_indices.append({
                    "image_id": img.get("image_id"),
                    "zone": zone,
                    "indices": img.get("indices", {}),
                    "timestamp": img["timestamp"].isoformat() if isinstance(img["timestamp"], datetime) else img["timestamp"],
                    "distance_km": round(distance, 2)
                })
        
        if len(filtered_indices) >= limit:
            break
    
    # Si pas de données trouvées, retourner des données simulées pour les tests
    if not filtered_indices:
        # Générer des données simulées pour la zone demandée
        import random
        for i in range(min(limit, 14)):
            day_offset = 13 - i
            sim_date = datetime.utcnow() - timedelta(days=day_offset)
            filtered_indices.append({
                "image_id": f"SIM_{sim_date.strftime('%Y%m%d')}_{i}",
                "zone": {"latitude": lat, "longitude": lon},
                "indices": {
                    "ndwi": round(random.uniform(0.2, 0.5), 3),
                    "chlorophyll": round(random.uniform(0.1, 0.4), 3),
                    "turbidity": round(random.uniform(0.1, 0.3), 3)
                },
                "timestamp": sim_date.isoformat(),
                "distance_km": 0.0,
                "simulated": True
            })
    
    return {
        "success": True,
        "query": {
            "latitude": lat,
            "longitude": lon,
            "radius_km": radius_km,
            "hours": hours
        },
        "count": len(filtered_indices),
        "indices": filtered_indices
    }


@router.get("/health")
def health_check():
    """Vérification de l'état du service"""
    try:
        db = Database.get_db()
        # Test simple de connexion
        db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "service": "satellite",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }