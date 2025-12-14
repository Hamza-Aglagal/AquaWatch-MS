# AquaWatch-MS Integration Test Script
# Tests the complete flow: Capteurs -> STModel -> Redis -> Alertes/API-SIG

param(
    [string]$BaseUrl = "http://localhost",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# Service URLs
$CAPTEURS_URL = "$BaseUrl`:8001"
$SATELLITE_URL = "$BaseUrl`:8002"
$STMODEL_URL = "$BaseUrl`:8003"
$ALERTES_URL = "$BaseUrl`:8004"
$API_SIG_URL = "$BaseUrl`:8005"

# Output functions
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Header { param($msg) Write-Host "`n========== $msg ==========" -ForegroundColor Magenta }

# Test counter
$global:TestsPassed = 0
$global:TestsFailed = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [string]$ExpectedField = $null
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        
        if ($ExpectedField -and -not $response.$ExpectedField) {
            Write-Fail "$Name - Missing expected field: $ExpectedField"
            $global:TestsFailed++
            return $null
        }
        
        Write-Success "$Name"
        if ($Verbose) {
            $response | ConvertTo-Json -Depth 3 | Write-Host
        }
        $global:TestsPassed++
        return $response
    }
    catch {
        Write-Fail "$Name - $($_.Exception.Message)"
        $global:TestsFailed++
        return $null
    }
}

# ==================== START TESTS ====================

Write-Host "`n"
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "          AquaWatch-MS Integration Test Suite                   " -ForegroundColor Cyan
Write-Host "          Testing Complete Microservices Flow                   " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "`n"

# ---------- Test 1: Health Checks ----------
Write-Header "PHASE 1: Service Health Checks"

Test-Endpoint -Name "Capteurs Service Health" -Url "$CAPTEURS_URL/health"
Test-Endpoint -Name "Satellite Service Health" -Url "$SATELLITE_URL/health"
Test-Endpoint -Name "STModel Service Health" -Url "$STMODEL_URL/health"
Test-Endpoint -Name "Alertes Service Health" -Url "$ALERTES_URL/health"
Test-Endpoint -Name "API-SIG Service Health" -Url "$API_SIG_URL/health"

# ---------- Test 2: Capteurs Service ----------
Write-Header "PHASE 2: Capteurs Service"

$capteurs = Test-Endpoint -Name "Get All Capteurs" -Url "$CAPTEURS_URL/api/capteurs" -ExpectedField "success"
if ($capteurs) {
    Write-Info "Found $($capteurs.count) capteurs"
}

$positions = Test-Endpoint -Name "Get Capteur Positions" -Url "$CAPTEURS_URL/api/capteurs/positions" -ExpectedField "success"
if ($positions) {
    Write-Info "Found $($positions.count) active positions"
}

$latestData = Test-Endpoint -Name "Get Latest Sensor Data" -Url "$CAPTEURS_URL/api/capteurs/data/latest?hours=24&limit=10" -ExpectedField "success"
if ($latestData) {
    Write-Info "Retrieved $($latestData.count) recent measurements"
}

# ---------- Test 3: Satellite Service ----------
Write-Header "PHASE 3: Satellite Service"

$satelliteIndices = Test-Endpoint -Name "Get Satellite Indices (Latest)" -Url "$SATELLITE_URL/api/satellite/indices/latest?hours=336&limit=10"
if ($satelliteIndices) {
    Write-Info "Retrieved $($satelliteIndices.count) satellite indices"
}

$locationIndices = Test-Endpoint -Name "Get Indices by Location (Casablanca)" -Url "$SATELLITE_URL/api/satellite/indices/location?lat=33.5731&lon=-7.5898&limit=14"
if ($locationIndices) {
    Write-Info "Retrieved $($locationIndices.count) indices for Casablanca"
    if ($locationIndices.indices[0].simulated) {
        Write-Warn "Using simulated satellite data (MongoDB unavailable)"
    }
}

# ---------- Test 4: STModel Service ----------
Write-Header "PHASE 4: STModel Service (ML Predictions)"

$modelInfo = Test-Endpoint -Name "Get Model Info" -Url "$STMODEL_URL/api/model/info"
if ($modelInfo) {
    Write-Info "Model loaded: $($modelInfo.model_loaded), R2: $($modelInfo.metrics.r2)"
}

# Test auto prediction with sample data (good quality)
Write-Info "Testing Auto Prediction (Good Quality Sample Data)..."
$predGood = Test-Endpoint -Name "Auto Prediction (Good Quality)" -Url "$STMODEL_URL/api/predictions/auto?use_sample_data=true&sample_quality=good&latitude=33.5731&longitude=-7.5898" -Method "POST" -ExpectedField "prediction_id"

if ($predGood) {
    Write-Info "Prediction ID: $($predGood.prediction_id)"
    Write-Info "Quality Score: $($predGood.quality_score_real) (Normalized: $($predGood.quality_score))"
    Write-Info "Confidence: $([math]::Round($predGood.confidence * 100, 1))%"
}

# Wait for Redis propagation
Start-Sleep -Seconds 2

# Test auto prediction with bad quality (should trigger alert)
Write-Info "Testing Auto Prediction (Bad Quality - Should Trigger Alert)..."
$predBad = Test-Endpoint -Name "Auto Prediction (Bad Quality)" -Url "$STMODEL_URL/api/predictions/auto?use_sample_data=true&sample_quality=bad&latitude=34.0&longitude=-6.8" -Method "POST" -ExpectedField "prediction_id"

if ($predBad) {
    Write-Info "Prediction ID: $($predBad.prediction_id)"
    Write-Info "Quality Score: $($predBad.quality_score_real)"
}

# Wait for Redis propagation
Start-Sleep -Seconds 2

# Get latest predictions from DB
$latestPreds = Test-Endpoint -Name "Get Latest Predictions" -Url "$STMODEL_URL/api/predictions/latest?limit=5"
if ($latestPreds) {
    Write-Info "Found $($latestPreds.count) predictions in database"
}

# ---------- Test 5: Alertes Service ----------
Write-Header "PHASE 5: Alertes Service"

$alertHistory = Test-Endpoint -Name "Get Alert History" -Url "$ALERTES_URL/api/alerts/history"
if ($alertHistory) {
    $alertCount = if ($alertHistory.alerts) { $alertHistory.alerts.Count } else { 0 }
    Write-Info "Found $alertCount alerts in history"
}

# ---------- Test 6: API-SIG Service ----------
Write-Header "PHASE 6: API-SIG Service (GIS/Maps)"

$zonesGeoJSON = Test-Endpoint -Name "Get Zones GeoJSON" -Url "$API_SIG_URL/api/map/zones"
if ($zonesGeoJSON -and $zonesGeoJSON.type -eq "FeatureCollection") {
    Write-Info "GeoJSON valid with $($zonesGeoJSON.features.Count) features"
    foreach ($feature in $zonesGeoJSON.features) {
        if ($feature.properties.qualite -and $feature.properties.qualite -ne "INCONNU") {
            Write-Info "Zone '$($feature.properties.nom)' quality: $($feature.properties.qualite)"
        }
    }
}

$points = Test-Endpoint -Name "Get Points GeoJSON" -Url "$API_SIG_URL/api/map/points"
if ($points -and $points.type -eq "FeatureCollection") {
    Write-Info "Found $($points.features.Count) points of interest"
}

# ---------- Test 7: Data Flow Verification ----------
Write-Header "PHASE 7: Data Flow Verification"

Write-Info "Checking Docker logs for Redis message flow..."

# Check if services received Redis messages
$alertesLogs = docker logs aquawatch-ms-service_alertes-1 --tail 20 2>&1
$apiSigLogs = docker logs aquawatch-ms-service_api_sig-1 --tail 20 2>&1

if ($alertesLogs -match "Processing prediction") {
    Write-Success "Alertes Service received Redis predictions"
} else {
    Write-Warn "No recent predictions in Alertes logs"
}

if ($apiSigLogs -match "Received prediction") {
    Write-Success "API-SIG Service received Redis predictions"
} else {
    Write-Warn "No recent predictions in API-SIG logs"
}

if ($apiSigLogs -match "Updated zone") {
    Write-Success "API-SIG updated zone quality from prediction"
}

# ==================== SUMMARY ====================

Write-Host "`n"
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                    TEST SUMMARY                                " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$totalTests = $global:TestsPassed + $global:TestsFailed
$passRate = if ($totalTests -gt 0) { [math]::Round(($global:TestsPassed / $totalTests) * 100, 1) } else { 0 }

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $($global:TestsPassed)" -ForegroundColor Green
Write-Host "Failed: $($global:TestsFailed)" -ForegroundColor Red

if ($passRate -ge 80) {
    Write-Host "Pass Rate: $passRate%" -ForegroundColor Green
} elseif ($passRate -ge 60) {
    Write-Host "Pass Rate: $passRate%" -ForegroundColor Yellow
} else {
    Write-Host "Pass Rate: $passRate%" -ForegroundColor Red
}

Write-Host ""

if ($global:TestsFailed -eq 0) {
    Write-Host "All tests passed! The AquaWatch-MS system is fully operational." -ForegroundColor Green
} elseif ($passRate -ge 80) {
    Write-Host "Most tests passed. Some minor issues may need attention." -ForegroundColor Yellow
} else {
    Write-Host "Several tests failed. Please check service logs for details." -ForegroundColor Red
}

Write-Host ""
Write-Host "Data Flow:" -ForegroundColor Cyan
Write-Host "  Capteurs (8001) -> STModel (8003) -> Redis -> Alertes (8004)" -ForegroundColor White
Write-Host "                                           -> API-SIG (8005)" -ForegroundColor White
Write-Host ""
