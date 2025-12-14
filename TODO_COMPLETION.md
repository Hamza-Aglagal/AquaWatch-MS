# AquaWatch-MS - TODO Completion Guide

## 📊 Project Status Overview

| Service | Status | Issues |
|---------|--------|--------|
| service_capteurs | ✅ Running | Minor - needs data generator |
| service_satellite | ✅ Running | Major - needs scheduled downloads |
| service_stmodel | ✅ Running | Major - needs data aggregation endpoint |
| service_alertes | ⚠️ Partial | **CRITICAL** - Redis format mismatch |
| service_api_sig | ⚠️ Partial | **CRITICAL** - Redis format mismatch |

---

## 🔴 CRITICAL ISSUES - Fix First

### Issue #1: Redis Message Format Mismatch

**Problem:** STModel publishes one format, but Alertes & API-SIG expect a different format.

**STModel publishes (flat format):**
```json
{
  "prediction_id": "PRED_20250101120000_abc12345",
  "quality_score": 0.75,
  "quality_score_real": 7.5,
  "confidence": 0.92,
  "latitude": 33.5,
  "longitude": -7.5,
  "timestamp": "2025-01-01T12:00:00"
}
```

**Alertes expects (nested format):**
```json
{
  "prediction_id": "PRED_xxx",
  "zone": {
    "latitude": 33.5,
    "longitude": -7.5
  },
  "predictions": {
    "qualite_eau": "MAUVAISE",
    "score_qualite": 3.5
  }
}
```

**API-SIG expects (same nested format):**
```json
{
  "prediction_id": "PRED_xxx",
  "zone": {
    "latitude": 33.5,
    "longitude": -7.5
  },
  "predictions": {
    "qualite_eau": "BONNE",
    "score_qualite": 7.5
  }
}
```

---

## ✅ TODO LIST - In Order

### PHASE 1: Fix Inter-Service Communication (CRITICAL)

#### Task 1.1: Update STModel Redis Format
**File:** `services/service_stmodel/src/api/routes.py`
**Lines:** 76-87

**Change the redis_data to match expected format:**
```python
# Convert score to quality category
def score_to_quality(score_real):
    if score_real >= 7.0:
        return "BONNE"
    elif score_real >= 4.0:
        return "MOYENNE"
    else:
        return "MAUVAISE"

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
```

**Status:** ⬜ Not Started

---

#### Task 1.2: Update Alertes Listener (Optional - If STModel not modified)
**File:** `services/service_alertes/src/services/predictionListener.js`
**Lines:** 71-88

**Modify to accept flat format:**
```javascript
async handlePrediction(prediction) {
    // Support both formats
    const latitude = prediction.zone?.latitude || prediction.latitude;
    const longitude = prediction.zone?.longitude || prediction.longitude;
    const qualite_eau = prediction.predictions?.qualite_eau || this.scoreToQuality(prediction.quality_score_real);
    const score_qualite = prediction.predictions?.score_qualite || prediction.quality_score_real;
    
    if (qualite_eau === 'MAUVAISE' || score_qualite < 4.0) {
        // ... create alert
    }
}

scoreToQuality(score) {
    if (score >= 7.0) return 'BONNE';
    if (score >= 4.0) return 'MOYENNE';
    return 'MAUVAISE';
}
```

**Status:** ⬜ Not Started

---

#### Task 1.3: Update API-SIG Prediction Listener (Optional - If STModel not modified)
**File:** `services/service_api_sig/src/services/predictionListener.js`
**Lines:** 67-75

**Modify to accept flat format:**
```javascript
// Support both formats
const latitude = prediction.zone?.latitude || prediction.latitude;
const longitude = prediction.zone?.longitude || prediction.longitude;
const qualite_eau = prediction.predictions?.qualite_eau || this.scoreToQuality(prediction.quality_score_real);
const score_qualite = prediction.predictions?.score_qualite || prediction.quality_score_real;
```

**Status:** ⬜ Not Started

---

### PHASE 2: Add Data Aggregation Endpoint to STModel

#### Task 2.1: Create Data Fetcher Service
**New File:** `services/service_stmodel/src/services/data_fetcher.py`

**Purpose:** Fetch sensor + satellite data from other services

```python
"""
Service to fetch data from Capteurs and Satellite services
"""
import httpx
from datetime import datetime, timedelta

CAPTEURS_URL = "http://service_capteurs:8001"
SATELLITE_URL = "http://service_satellite:8002"

async def fetch_capteurs_data(station_id: int, days: int = 14):
    """Fetch sensor data for past N days"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CAPTEURS_URL}/api/capteurs/data/latest",
            params={"capteur_id": station_id, "limit": days}
        )
        return response.json()

async def fetch_satellite_data(lat: float, lon: float, days: int = 14):
    """Fetch satellite indices for past N days"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SATELLITE_URL}/api/images/indices",
            params={
                "lat": lat,
                "lon": lon,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
        )
        return response.json()

async def aggregate_data(station_id: int, lat: float, lon: float):
    """Combine sensor + satellite data into 14-day measurements"""
    capteur_data = await fetch_capteurs_data(station_id, 14)
    satellite_data = await fetch_satellite_data(lat, lon, 14)
    
    # Merge data by date
    measurements = []
    # ... merge logic
    return measurements
```

**Status:** ⬜ Not Started

---

#### Task 2.2: Add Automatic Prediction Endpoint
**File:** `services/service_stmodel/src/api/routes.py`

**Add new endpoint:**
```python
@router.post("/predictions/auto")
async def create_auto_prediction(
    station_id: int,
    latitude: float,
    longitude: float
):
    """
    Automatically fetch data and create prediction
    """
    # Fetch aggregated data from capteurs + satellite
    measurements = await data_fetcher.aggregate_data(station_id, latitude, longitude)
    
    if len(measurements) < 14:
        raise HTTPException(400, "Insufficient data for prediction")
    
    # Use existing prediction logic
    # ...
```

**Status:** ⬜ Not Started

---

### PHASE 3: Add Missing Capteurs Endpoints

#### Task 3.1: Add Historical Data Endpoint
**File:** `services/service_capteurs/src/routes/capteurRoutes.js`

**Add endpoint for date range queries:**
```javascript
// GET /api/capteurs/data/history?capteur_id=1&start=2024-01-01&end=2024-01-14
router.get('/data/history', capteurController.getHistoricalData);
```

**Status:** ⬜ Not Started

---

#### Task 3.2: Add Data Generator Script
**New File:** `services/service_capteurs/tools/generateData.js`

**Purpose:** Generate realistic test data for sensors

**Status:** ⬜ Not Started

---

### PHASE 4: Add Satellite Automation

#### Task 4.1: Add Scheduled Download Endpoint
**File:** `services/service_satellite/app/routes.py`

**Add cron-triggered endpoint:**
```python
@router.post("/api/images/schedule-download")
async def schedule_download(
    zone_id: int,
    frequency: str = "daily"  # daily, weekly
):
    """Schedule automatic satellite image downloads"""
    pass
```

**Status:** ⬜ Not Started

---

#### Task 4.2: Add Indices by Location Endpoint
**File:** `services/service_satellite/app/routes.py`

**Add endpoint for STModel to fetch indices:**
```python
@router.get("/api/images/indices")
async def get_indices_by_location(
    lat: float,
    lon: float,
    start_date: str,
    end_date: str
):
    """Get NDWI, chlorophyll, turbidity for a location and date range"""
    pass
```

**Status:** ⬜ Not Started

---

### PHASE 5: End-to-End Integration

#### Task 5.1: Create Integration Test Script
**New File:** `tests/integration_test.py`

**Test flow:**
1. Create sensor data in Capteurs
2. Trigger satellite download
3. Call STModel auto prediction
4. Verify Redis message received
5. Check Alert created
6. Check API-SIG zone updated

**Status:** ⬜ Not Started

---

#### Task 5.2: Add Orchestration Endpoint
**New File:** `services/service_stmodel/src/api/orchestration.py`

**Purpose:** Single endpoint to trigger full prediction pipeline

```python
@router.post("/pipeline/run")
async def run_pipeline(zone_id: int):
    """
    Full pipeline:
    1. Fetch latest sensor data
    2. Fetch latest satellite indices
    3. Merge data
    4. Run prediction
    5. Publish to Redis
    """
    pass
```

**Status:** ⬜ Not Started

---

### PHASE 6: Production Readiness

#### Task 6.1: Add Health Check Standardization
All services should have consistent health check at `/health`

| Service | Endpoint | Status |
|---------|----------|--------|
| service_capteurs | `/health` | ✅ Exists |
| service_satellite | `/health` | ✅ Exists |
| service_stmodel | `/health` | ✅ Exists |
| service_alertes | `/health` | ✅ Exists |
| service_api_sig | `/health` | ✅ Exists |

**Status:** ✅ Complete

---

#### Task 6.2: Add Error Handling & Logging
- Add structured logging (JSON format)
- Add error tracking
- Add request tracing between services

**Status:** ⬜ Not Started

---

## 📋 QUICK START - Which Task to Do First?

### Option A: Minimal Fix (30 minutes)
1. Fix Task 1.1 (Update STModel Redis format)
2. Test by calling `/api/predictions/create`
3. Verify alerts and API-SIG receive correctly formatted data

### Option B: Full Integration (2-3 hours)
1. Task 1.1: Fix STModel Redis format
2. Task 2.1: Create data fetcher service
3. Task 2.2: Add auto prediction endpoint
4. Task 4.2: Add satellite indices endpoint
5. Task 5.1: Integration test

---

## 🔗 Service Communication Map

```
┌─────────────────┐       ┌─────────────────┐
│  service_capteurs │◄─────│    Sensors      │
│    (Port 8001)   │       │   (MQTT/HTTP)   │
└────────┬────────┘       └─────────────────┘
         │
         │ HTTP GET /api/capteurs/data/latest
         ▼
┌─────────────────┐       ┌─────────────────┐
│ service_stmodel │◄─────│ service_satellite│
│   (Port 8003)   │       │   (Port 8002)    │
└────────┬────────┘       └─────────────────┘
         │                        │
         │ HTTP GET /api/images/indices
         ▼
    ┌─────────┐
    │  Redis  │ publish "new_prediction"
    │ (6379)  │
    └────┬────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌─────────────┐
│ Alertes │ │   API-SIG   │
│ (8004)  │ │   (8005)    │
└────┬────┘ └──────┬──────┘
     │             │
     ▼             ▼
┌─────────┐ ┌─────────────┐
│  Email  │ │  GeoServer  │
│  SMTP   │ │  (8080)     │
└─────────┘ └─────────────┘
```

---

## 📝 Notes

- **Redis Channel:** `new_prediction` - used by STModel to broadcast predictions
- **Database Credentials:** Check `docker-compose.yml` for all credentials
- **Model File:** `services/service_stmodel/models/lstm_water_quality.pth`
- **GeoServer Admin:** http://localhost:8080/geoserver (admin/geoserver)

---

Last Updated: Auto-generated
