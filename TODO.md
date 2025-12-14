# ✅ TODO - AquaWatch-MS Project

**Status:** ✅ Project Ready & Running  
**Last Updated:** December 7, 2025  
**All Services:** HEALTHY

---

## 📊 PROJECT OVERVIEW

AquaWatch-MS is a microservices platform for water quality monitoring and prediction.

### Team & Services
| Developer | Service | Port | Status |
|-----------|---------|------|--------|
| Hamza | service_stmodel (ML/Predictions) | 8003 | ✅ Ready |
| Bilal | service_capteurs (IoT Sensors) | 8001 | ✅ Ready |
| Bilal | service_satellite (Satellite Data) | 8002 | ✅ Ready |
| Yassin | service_alertes (Notifications) | 8004 | ✅ Ready |
| Yassin | service_api_sig (Maps/GIS) | 8005 | ✅ Ready |

### Infrastructure
| Component | Port | Description |
|-----------|------|-------------|
| db_capteurs (TimescaleDB) | 5433 | IoT time-series data |
| db_satellite (MongoDB) | 27017 | Satellite images metadata |
| db_predictions (PostgreSQL) | 5434 | ML predictions storage |
| db_alerts (PostgreSQL) | 5435 | Alert history |
| db_geo (PostGIS) | 5436 | Geographic data |
| redis_queue | 6379 | Message queue |
| minio_storage | 9000/9001 | File storage |
| geoserver | 8080 | Map server |

---

## 🚀 QUICK START GUIDE

### Prerequisites
1. **Docker Desktop** - Must be running (green icon)
2. **Git** - For version control
3. **Ports available:** 5433-5436, 6379, 8001-8005, 8080, 9000-9001, 27017

### Step 1: Environment Setup
```powershell
# Navigate to project
cd "C:\Users\Hamza\Documents\EMSI 5\ML+DM+MicroServices\AquaWatch-MS"

# Verify .env file exists (should already exist)
Test-Path .env
```

### Step 2: Start Infrastructure First
```powershell
# Start databases and Redis
docker compose up -d db_capteurs db_satellite db_predictions db_alerts db_geo redis_queue minio_storage

# Wait 30 seconds for databases to initialize
Start-Sleep -Seconds 30

# Check all are running
docker compose ps
```

### Step 3: Start All Services
```powershell
# Build and start all services
docker compose up --build

# Or run in background
docker compose up -d --build
```

### Step 4: Verify Services
```powershell
# Test each service health endpoint
Invoke-WebRequest -Uri "http://localhost:8001/health" -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest -Uri "http://localhost:8002/health" -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest -Uri "http://localhost:8003/health" -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest -Uri "http://localhost:8004/health" -UseBasicParsing | Select-Object StatusCode
Invoke-WebRequest -Uri "http://localhost:8005/health" -UseBasicParsing | Select-Object StatusCode
```

### Access Points
- 🌡️ **Capteurs API:** http://localhost:8001/api
- 🛰️ **Satellite API:** http://localhost:8002/api
- 🧠 **STModel API:** http://localhost:8003/api
- 🚨 **Alertes API:** http://localhost:8004/api
- 🗺️ **Map Interface:** http://localhost:8005
- 📦 **MinIO Console:** http://localhost:9001
- 🌐 **GeoServer:** http://localhost:8080/geoserver

---

## ✅ COMPLETED TASKS

### Infrastructure
- [x] Docker Compose configuration with all databases
- [x] TimescaleDB for sensor time-series data
- [x] MongoDB for satellite metadata
- [x] PostgreSQL for predictions and alerts
- [x] PostGIS for geographic data
- [x] Redis for inter-service messaging
- [x] MinIO for file storage
- [x] GeoServer for map services

### Service: STModel (Hamza)
- [x] FastAPI application with CORS
- [x] LSTM model for water quality prediction
- [x] Prediction endpoint `/api/predictions/create`
- [x] Model info endpoint `/api/model/info`
- [x] Latest predictions endpoint `/api/predictions/latest`
- [x] Redis publishing for alerts
- [x] PostgreSQL storage for predictions
- [x] Trained model files (best_model.pth, scalers)

### Service: Capteurs (Bilal)
- [x] Express.js API for sensor data
- [x] MQTT client for IoT data collection
- [x] Database models (Capteur, Mesure)
- [x] REST endpoints for sensor data
- [x] TimescaleDB hypertable optimization
- [x] Sample data for testing

### Service: Satellite (Bilal)
- [x] FastAPI application
- [x] MongoDB connection for image metadata
- [x] MinIO integration for file storage
- [x] Satellite indices endpoints
- [x] GDAL/Rasterio for image processing

### Service: Alertes (Yassin)
- [x] Express.js API for notifications
- [x] Redis subscription for predictions
- [x] Email notifications via Nodemailer
- [x] Alert history endpoint
- [x] Alert recipient management

### Service: API-SIG (Yassin)
- [x] Express.js API for geographic data
- [x] PostGIS integration
- [x] GeoJSON endpoints for zones/points
- [x] Interactive map interface (Leaflet.js)
- [x] Capteur sync service
- [x] Prediction listener for quality updates

---

## 🔧 MANUAL CONFIGURATION (If Needed)

### Email Alerts Setup
Edit `.env.alertes`:
```dotenv
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Note:** For Gmail, you need to create an "App Password":
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Create App Password for "Mail"

### GeoServer Configuration
1. Access http://localhost:8080/geoserver
2. Login: admin / aquawatch123
3. Create workspace "aquawatch"
4. Connect to PostGIS (db_geo on port 5436)
5. Publish layers from zones_map and poi_map tables

---

## 📋 TESTING CHECKLIST

### Basic Health Checks
- [ ] Capteurs service responds at `/health`
- [ ] Satellite service responds at `/health`
- [ ] STModel service responds at `/health`
- [ ] Alertes service responds at `/health`
- [ ] API-SIG service responds at `/health`

### API Functionality
- [ ] GET /api/capteurs - Returns sensor list
- [ ] GET /api/capteurs/data/latest - Returns recent measurements
- [ ] GET /api/satellite/indices/latest - Returns satellite indices
- [ ] POST /api/predictions/create - Creates ML prediction
- [ ] GET /api/alerts/history - Returns alert history
- [ ] GET /api/map/zones - Returns GeoJSON zones
- [ ] GET /api/map/points - Returns GeoJSON points

### Integration Tests
- [ ] STModel receives data from Capteurs API
- [ ] STModel publishes predictions to Redis
- [ ] Alertes receives predictions from Redis
- [ ] API-SIG displays zones on map
- [ ] API-SIG syncs capteur positions

---

## 🛠️ TROUBLESHOOTING

### Docker Issues
```powershell
# View all container logs
docker compose logs

# View specific service logs
docker compose logs service_stmodel
docker compose logs service_capteurs

# Restart a specific service
docker compose restart service_stmodel

# Rebuild a specific service
docker compose up --build service_stmodel
```

### Database Connection Issues
```powershell
# Check database containers
docker compose ps | Select-String "db_"

# Connect to PostgreSQL directly
docker exec -it aquawatch-ms-db_predictions-1 psql -U predictions_user -d predictions_db

# Connect to MongoDB
docker exec -it aquawatch-ms-db_satellite-1 mongosh
```

### Port Conflicts
If ports are already in use:
```powershell
# Find process using a port
netstat -ano | findstr :8001

# Kill process by PID
taskkill /PID <PID> /F
```

### Clear All Data (Reset)
```powershell
# Stop and remove all containers and volumes
docker compose down -v

# Remove database data folders (WARNING: deletes all data)
Remove-Item -Recurse -Force infrastructure\db_*\data\*

# Restart fresh
docker compose up -d
```

---

## 📁 PROJECT STRUCTURE

```
AquaWatch-MS/
├── docker-compose.yml          # All services configuration
├── .env                        # Environment variables
├── .env.alertes               # Email configuration
├── README.md                   # Project documentation
├── TODO.md                     # This file
├── WORKFLOW_GENERAL.md         # Git/Docker workflow
│
├── infrastructure/
│   ├── db_capteurs/           # TimescaleDB
│   ├── db_satellite/          # MongoDB
│   ├── db_predictions/        # PostgreSQL
│   ├── db_alerts/             # PostgreSQL
│   ├── db_geo/                # PostGIS
│   ├── redis/                 # Redis cache
│   ├── minio_storage/         # File storage
│   └── geoserver/             # Map server
│
└── services/
    ├── service_stmodel/       # ML Predictions (Python)
    ├── service_capteurs/      # IoT Sensors (Node.js)
    ├── service_satellite/     # Satellite Data (Python)
    ├── service_alertes/       # Notifications (Node.js)
    └── service_api_sig/       # Maps/GIS (Node.js)
```

---

## 🎯 NEXT STEPS (Future Improvements)

1. **CI/CD Pipeline** - Add GitHub Actions for automated testing
2. **API Gateway** - Add Kong or Traefik for routing
3. **Monitoring** - Add Prometheus + Grafana
4. **Load Balancing** - Add nginx for production
5. **Authentication** - Add JWT tokens for API security
6. **Rate Limiting** - Protect APIs from abuse
7. **SSL/TLS** - Add HTTPS for production

---

**Created:** December 2025  
**Project:** AquaWatch-MS - Water Quality Monitoring Platform
