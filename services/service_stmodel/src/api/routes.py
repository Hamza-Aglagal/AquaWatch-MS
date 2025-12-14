"""
Routes API simples pour les prédictions
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid

from ..schemas.prediction import PredictionRequest, PredictionResponse
from ..services.prediction_service import PredictionService
from ..services.redis_service import RedisPublisher
from ..services.db_service import get_db
from ..services.data_fetcher import data_fetcher
from ..models.database import Prediction

# Router FastAPI
router = APIRouter(prefix="/api", tags=["predictions"])

# Services globaux
prediction_service = PredictionService()
redis_publisher = RedisPublisher()


@router.post("/predictions/create", response_model=PredictionResponse)
async def create_prediction(request: PredictionRequest):
    """
    Crée une nouvelle prédiction de qualité d'eau
    
    Nécessite 14 jours de mesures (capteurs + satellites)
    """
    # Vérifier que le service est prêt
    if not prediction_service.is_ready():
        raise HTTPException(
            status_code=503,
            detail="Modèle non chargé - Veuillez réessayer plus tard"
        )
    
    # Vérifier nombre de mesures
    if len(request.measurements) != 14:
        raise HTTPException(
            status_code=400,
            detail=f"Exactement 14 mesures requises, {len(request.measurements)} fournies"
        )
    
    try:
        # Faire la prédiction
        result = prediction_service.predict(request.measurements)
        
        # Générer ID unique
        prediction_id = f"PRED_{datetime.now().strftime('%Y%m%d%H%M%S')}_{str(uuid.uuid4())[:8]}"
        
        # Extraire coordonnées (utiliser première mesure)
        first_measurement = request.measurements[0]
        
        # Préparer données pour DB
        input_data = [m.dict() for m in request.measurements]
        prediction_results = {
            "quality_score": result['quality_score_normalized'],
            "quality_score_real": result['quality_score_real'],
            "confidence": result['confidence']
        }
        
        # Sauvegarder dans PostgreSQL
        try:
            with get_db() as db:
                new_prediction = Prediction(
                    prediction_id=prediction_id,
                    zone_latitude=float(first_measurement.latitude),
                    zone_longitude=float(first_measurement.longitude),
                    input_data=input_data,
                    prediction_results=prediction_results,
                    confidence_score=result['confidence']
                )
                db.add(new_prediction)
        except Exception as db_error:
            print(f"⚠️  Erreur sauvegarde DB: {db_error}")
        
        # Convertir score en catégorie de qualité
        def score_to_quality(score_real):
            if score_real >= 7.0:
                return "BONNE"
            elif score_real >= 4.0:
                return "MOYENNE"
            else:
                return "MAUVAISE"
        
        # Publier sur Redis pour le service d'alertes (format attendu par alertes + api_sig)
        redis_data = {
            "prediction_id": prediction_id,
            "zone": {
                "latitude": float(first_measurement.latitude),
                "longitude": float(first_measurement.longitude)
            },
            "predictions": {
                "qualite_eau": score_to_quality(result['quality_score_real']),
                "score_qualite": result['quality_score_real']
            },
            "confidence": result['confidence'],
            "timestamp": datetime.now().isoformat()
        }
        redis_publisher.publish_prediction(redis_data)
        
        # Retourner la réponse
        return PredictionResponse(
            prediction_id=prediction_id,
            quality_score=result['quality_score_normalized'],
            quality_score_real=result['quality_score_real'],
            confidence=result['confidence'],
            timestamp=datetime.now().isoformat(),
            message="Prédiction réussie"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la prédiction: {str(e)}"
        )


@router.get("/model/info")
async def get_model_info():
    """
    Retourne les informations du modèle chargé
    """
    info = prediction_service.get_model_info()
    
    if info is None:
        raise HTTPException(
            status_code=503,
            detail="Modèle non chargé"
        )
    
    return info


@router.get("/predictions/latest")
async def get_latest_predictions(limit: int = 10):
    """
    Retourne les dernières prédictions depuis la base de données
    """
    try:
        with get_db() as db:
            # Récupérer les dernières prédictions
            predictions = db.query(Prediction).order_by(
                Prediction.created_at.desc()
            ).limit(limit).all()
            
            # Formater les résultats
            results = []
            for pred in predictions:
                results.append({
                    "prediction_id": pred.prediction_id,
                    "latitude": float(pred.zone_latitude),
                    "longitude": float(pred.zone_longitude),
                    "prediction_results": pred.prediction_results,
                    "confidence_score": float(pred.confidence_score) if pred.confidence_score else None,
                    "timestamp": pred.created_at.isoformat()
                })
            
            return {
                "count": len(results),
                "predictions": results
            }
    
    except Exception as e:
        # Si DB non disponible, retourner message d'erreur gracieux
        return {
            "error": "Base de données non disponible",
            "detail": str(e),
            "predictions": []
        }


@router.post("/predictions/auto")
async def create_auto_prediction(
    station_id: int = 1,
    latitude: float = 33.5731,
    longitude: float = -7.5898,
    use_sample_data: bool = False,
    sample_quality: str = "medium"
):
    """
    Crée automatiquement une prédiction en récupérant les données des services Capteurs et Satellite.
    
    Args:
        station_id: ID du capteur/station (default: 1)
        latitude: Latitude de la zone (default: Casablanca)
        longitude: Longitude de la zone (default: Casablanca)
        use_sample_data: Si True, utilise des données générées (pour tests)
        sample_quality: Qualité des données simulées ("good", "medium", "bad")
    
    Returns:
        PredictionResponse avec le résultat de la prédiction
    """
    # Vérifier que le service est prêt
    if not prediction_service.is_ready():
        raise HTTPException(
            status_code=503,
            detail="Modèle non chargé - Veuillez réessayer plus tard"
        )
    
    try:
        if use_sample_data:
            # Utiliser des données générées pour les tests
            print(f"🧪 Generating sample data (quality: {sample_quality})")
            measurements_list = data_fetcher.generate_sample_measurements(
                station_id=station_id,
                latitude=latitude,
                longitude=longitude,
                quality=sample_quality
            )
        else:
            # Récupérer les vraies données des services
            print(f"📡 Fetching data from Capteurs and Satellite services...")
            all_data = await data_fetcher.fetch_all_data(hours=336)  # 14 days
            
            capteurs_data = all_data.get("capteurs", {})
            satellite_data = all_data.get("satellite", {})
            
            # Vérifier si on a des données
            capteurs_list = capteurs_data.get("capteurs", [])
            indices_list = satellite_data.get("indices", [])
            
            print(f"📊 Fetched {len(capteurs_list)} capteur records, {len(indices_list)} satellite records")
            
            if not capteurs_list and not indices_list:
                # Pas de données, utiliser sample data
                print("⚠️  No data available, using sample data")
                measurements_list = data_fetcher.generate_sample_measurements(
                    station_id=station_id,
                    latitude=latitude,
                    longitude=longitude,
                    quality="medium"
                )
            else:
                # Agréger les données
                measurements_list = data_fetcher.aggregate_measurements(
                    capteurs_data=capteurs_data,
                    satellite_data=satellite_data,
                    station_id=station_id,
                    latitude=latitude,
                    longitude=longitude,
                    days=14
                )
        
        # Convertir en objets MeasurementInput
        from ..schemas.prediction import MeasurementInput
        measurements = [MeasurementInput(**m) for m in measurements_list]
        
        # Faire la prédiction
        result = prediction_service.predict(measurements)
        
        # Générer ID unique
        prediction_id = f"AUTO_{datetime.now().strftime('%Y%m%d%H%M%S')}_{str(uuid.uuid4())[:8]}"
        
        # Préparer données pour DB
        input_data = [m.dict() for m in measurements]
        prediction_results = {
            "quality_score": result['quality_score_normalized'],
            "quality_score_real": result['quality_score_real'],
            "confidence": result['confidence']
        }
        
        # Sauvegarder dans PostgreSQL
        try:
            with get_db() as db:
                new_prediction = Prediction(
                    prediction_id=prediction_id,
                    zone_latitude=float(latitude),
                    zone_longitude=float(longitude),
                    input_data=input_data,
                    prediction_results=prediction_results,
                    confidence_score=result['confidence']
                )
                db.add(new_prediction)
        except Exception as db_error:
            print(f"⚠️  Erreur sauvegarde DB: {db_error}")
        
        # Convertir score en catégorie de qualité
        def score_to_quality(score_real):
            if score_real >= 7.0:
                return "BONNE"
            elif score_real >= 4.0:
                return "MOYENNE"
            else:
                return "MAUVAISE"
        
        # Publier sur Redis pour le service d'alertes (format attendu par alertes + api_sig)
        redis_data = {
            "prediction_id": prediction_id,
            "zone": {
                "latitude": float(latitude),
                "longitude": float(longitude)
            },
            "predictions": {
                "qualite_eau": score_to_quality(result['quality_score_real']),
                "score_qualite": result['quality_score_real']
            },
            "confidence": result['confidence'],
            "timestamp": datetime.now().isoformat()
        }
        redis_publisher.publish_prediction(redis_data)
        
        print(f"✅ Auto prediction completed: {prediction_id}")
        
        # Retourner la réponse
        return PredictionResponse(
            prediction_id=prediction_id,
            quality_score=result['quality_score_normalized'],
            quality_score_real=result['quality_score_real'],
            confidence=result['confidence'],
            timestamp=datetime.now().isoformat(),
            message=f"Prédiction automatique réussie (station_id={station_id})"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la prédiction automatique: {str(e)}"
        )


@router.get("/data/fetch")
async def fetch_external_data(hours: int = 336):
    """
    Endpoint de diagnostic pour vérifier la récupération des données externes.
    
    Args:
        hours: Période en heures (default: 336 = 14 jours)
    
    Returns:
        Données brutes des services Capteurs et Satellite
    """
    all_data = await data_fetcher.fetch_all_data(hours=hours)
    
    capteurs_count = len(all_data.get("capteurs", {}).get("capteurs", []))
    satellite_count = len(all_data.get("satellite", {}).get("indices", []))
    
    return {
        "status": "ok",
        "capteurs_records": capteurs_count,
        "satellite_records": satellite_count,
        "data": all_data
    }

