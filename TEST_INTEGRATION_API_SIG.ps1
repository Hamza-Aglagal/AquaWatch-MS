# Script de test end-to-end pour le service API-SIG
# Tests: Redis listener, mise à jour zones, API endpoints

Write-Host "=== TEST INTEGRATION SERVICE API-SIG ===" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier les services
Write-Host "1. Verification des services..." -ForegroundColor Yellow
$apiSig = docker ps --filter "name=service_api_sig" --format "{{.Status}}"
$redis = docker ps --filter "name=redis_queue" --format "{{.Status}}"
$dbGeo = docker ps --filter "name=db_geo" --format "{{.Status}}"

if ($apiSig -match "Up") {
    Write-Host "   OK: Service API-SIG: $apiSig" -ForegroundColor Green
} else {
    Write-Host "   ERREUR: Service API-SIG non actif!" -ForegroundColor Red
    exit 1
}

if ($redis -match "Up") {
    Write-Host "   OK: Redis: $redis" -ForegroundColor Green
} else {
    Write-Host "   ERREUR: Redis non actif!" -ForegroundColor Red
    exit 1
}

if ($dbGeo -match "Up") {
    Write-Host "   OK: PostGIS: $dbGeo" -ForegroundColor Green
} else {
    Write-Host "   ERREUR: PostGIS non actif!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Tester le health check
Write-Host "2. Test health check..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8005/health" -UseBasicParsing | ConvertFrom-Json
    Write-Host "   OK: Service: $($health.service), Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Vérifier le listener Redis
Write-Host "3. Verification du listener Redis..." -ForegroundColor Yellow
try {
    $listener = Invoke-WebRequest -Uri "http://localhost:8005/api/map/redis-listener-status" -UseBasicParsing | ConvertFrom-Json
    if ($listener.active -eq $true) {
        Write-Host "   OK: Listener actif sur canal: $($listener.channel)" -ForegroundColor Green
        Write-Host "   Status: $($listener.status)" -ForegroundColor Cyan
    } else {
        Write-Host "   ATTENTION: Listener non actif!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 4. Récupérer l'état actuel des zones
Write-Host "4. Etat actuel des zones..." -ForegroundColor Yellow
try {
    $statsBefore = Invoke-WebRequest -Uri "http://localhost:8005/api/map/stats" -UseBasicParsing | ConvertFrom-Json
    Write-Host "   Total zones: $($statsBefore.total_zones)" -ForegroundColor Cyan
    Write-Host "   Zones BONNES: $($statsBefore.zones_bonnes)" -ForegroundColor Green
    Write-Host "   Zones MOYENNES: $($statsBefore.zones_moyennes)" -ForegroundColor Yellow
    Write-Host "   Zones MAUVAISES: $($statsBefore.zones_mauvaises)" -ForegroundColor Red
    Write-Host "   Zones INCONNUES: $($statsBefore.zones_inconnues)" -ForegroundColor Gray
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 5. Publier une prédiction de test
Write-Host "5. Publication d'une prediction de test..." -ForegroundColor Yellow

# Choisir une zone aléatoire
$zones = @(
    @{nom="Agadir"; lat=30.4278; lon=-9.5981},
    @{nom="Essaouira"; lat=31.5085; lon=-9.7595},
    @{nom="Casablanca"; lat=33.5731; lon=-7.5898},
    @{nom="Rabat"; lat=34.0209; lon=-6.8416},
    @{nom="Tanger"; lat=35.7595; lon=-5.8340}
)

$zone = $zones | Get-Random
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$predictionId = "TEST_INTEGRATION_$timestamp"
$dateISO = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

# Choisir une qualité aléatoire
$qualites = @(
    @{nom="BONNE"; score=8.5},
    @{nom="MOYENNE"; score=6.0},
    @{nom="MAUVAISE"; score=2.5}
)
$qualite = $qualites | Get-Random

$jsonPayload = @"
{
  \"prediction_id\": \"$predictionId\",
  \"zone\": {
    \"latitude\": $($zone.lat),
    \"longitude\": $($zone.lon)
  },
  \"predictions\": {
    \"qualite_eau\": \"$($qualite.nom)\",
    \"score_qualite\": $($qualite.score)
  },
  \"confidence\": 0.95,
  \"timestamp\": \"$dateISO\"
}
"@

Write-Host "   Zone: $($zone.nom) ($($zone.lat)N, $($zone.lon)W)" -ForegroundColor Cyan
Write-Host "   Qualite: $($qualite.nom) (score: $($qualite.score)/10)" -ForegroundColor Cyan
Write-Host "   Prediction ID: $predictionId" -ForegroundColor Cyan

# Publier via Redis
$result = docker exec -i aquawatch-ms-redis_queue-1 redis-cli PUBLISH new_prediction $jsonPayload

if ($result -eq "2") {
    Write-Host "   OK: Prediction publiee (2 subscribers)" -ForegroundColor Green
} else {
    Write-Host "   ATTENTION: Subscribers: $result (attendu: 2)" -ForegroundColor Yellow
}

Write-Host ""

# 6. Attendre le traitement
Write-Host "6. Attente du traitement (3 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 7. Vérifier les logs
Write-Host ""
Write-Host "7. Verification des logs API-SIG..." -ForegroundColor Yellow
$logs = docker logs aquawatch-ms-service_api_sig-1 --tail 10

if ($logs -match "Zone \d+ updated: $($qualite.nom)") {
    Write-Host "   OK: Zone mise a jour avec succes!" -ForegroundColor Green
} else {
    Write-Host "   ATTENTION: Pas de confirmation dans les logs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Logs recents:" -ForegroundColor Gray
$logs | Select-Object -Last 5 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }

Write-Host ""

# 8. Vérifier les nouvelles statistiques
Write-Host "8. Nouvelles statistiques..." -ForegroundColor Yellow
try {
    $statsAfter = Invoke-WebRequest -Uri "http://localhost:8005/api/map/stats" -UseBasicParsing | ConvertFrom-Json
    Write-Host "   Total zones: $($statsAfter.total_zones)" -ForegroundColor Cyan
    Write-Host "   Zones BONNES: $($statsAfter.zones_bonnes)" -ForegroundColor Green
    Write-Host "   Zones MOYENNES: $($statsAfter.zones_moyennes)" -ForegroundColor Yellow
    Write-Host "   Zones MAUVAISES: $($statsAfter.zones_mauvaises)" -ForegroundColor Red
    Write-Host "   Zones INCONNUES: $($statsAfter.zones_inconnues)" -ForegroundColor Gray
    
    # Vérifier le changement
    if ($qualite.nom -eq "BONNE" -and [int]$statsAfter.zones_bonnes -gt [int]$statsBefore.zones_bonnes) {
        Write-Host "   OK: Zone BONNE ajoutee!" -ForegroundColor Green
    } elseif ($qualite.nom -eq "MOYENNE" -and [int]$statsAfter.zones_moyennes -gt [int]$statsBefore.zones_moyennes) {
        Write-Host "   OK: Zone MOYENNE ajoutee!" -ForegroundColor Green
    } elseif ($qualite.nom -eq "MAUVAISE" -and [int]$statsAfter.zones_mauvaises -gt [int]$statsBefore.zones_mauvaises) {
        Write-Host "   OK: Zone MAUVAISE ajoutee!" -ForegroundColor Green
    } else {
        Write-Host "   Statistiques mises a jour" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 9. Vérifier la zone en base de données
Write-Host "9. Verification de la zone en base de donnees..." -ForegroundColor Yellow
$zoneQuery = "SELECT zone_id, nom, qualite_actuelle, derniere_mise_a_jour FROM zones_map WHERE nom='$($zone.nom)';"
$zoneData = docker exec -i aquawatch-ms-db_geo-1 psql -U aquawatch_user -d aquawatch_geo -c $zoneQuery

Write-Host $zoneData -ForegroundColor Cyan

Write-Host ""

# 10. Tester l'API zones
Write-Host "10. Test API zones (GeoJSON)..." -ForegroundColor Yellow
try {
    $zones = Invoke-WebRequest -Uri "http://localhost:8005/api/map/zones" -UseBasicParsing | ConvertFrom-Json
    Write-Host "   OK: $($zones.features.Count) zones recuperees" -ForegroundColor Green
    
    # Afficher les zones avec leur qualité
    Write-Host "   Zones:" -ForegroundColor Cyan
    foreach ($feature in $zones.features) {
        $color = switch ($feature.properties.qualite) {
            "BONNE" { "Green" }
            "MOYENNE" { "Yellow" }
            "MAUVAISE" { "Red" }
            default { "Gray" }
        }
        Write-Host "      - $($feature.properties.nom): $($feature.properties.qualite)" -ForegroundColor $color
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 11. Vérifier l'API capteurs (si disponible)
Write-Host "11. Test API capteurs (Bilal)..." -ForegroundColor Yellow
try {
    $capteurStatus = Invoke-WebRequest -Uri "http://localhost:8005/api/map/capteur-api-status" -UseBasicParsing | ConvertFrom-Json
    if ($capteurStatus.available -eq $true) {
        Write-Host "   OK: API capteurs disponible" -ForegroundColor Green
        Write-Host "   URL: $($capteurStatus.url)" -ForegroundColor Cyan
    } else {
        Write-Host "   ATTENTION: API capteurs non disponible" -ForegroundColor Yellow
        Write-Host "   Erreur: $($capteurStatus.error)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ERREUR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST TERMINE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ouvrir la carte interactive: http://localhost:8005/" -ForegroundColor Yellow
Write-Host "   La zone $($zone.nom) devrait etre coloree en fonction de la qualite: $($qualite.nom)" -ForegroundColor Cyan
Write-Host ""
