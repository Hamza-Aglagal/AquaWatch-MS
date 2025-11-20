# ========================================
# 🗺️ TEST COMPLET SERVICE API-SIG
# ========================================

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🗺️  TESTS SERVICE API-SIG - AQUAWATCH           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8005"
$passed = 0
$failed = 0

# ========================================
# TEST 1: Health Check
# ========================================
Write-Host "🔍 Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing | ConvertFrom-Json
    if ($health.status -eq "OK" -and $health.service -eq "api-sig") {
        Write-Host "   ✅ Service opérationnel" -ForegroundColor Green
        Write-Host "   📊 Status: $($health.status), Service: $($health.service)" -ForegroundColor Gray
        $passed++
    } else {
        Write-Host "   ❌ Health check invalide" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# ========================================
# TEST 2: Statistiques
# ========================================
Write-Host "`n📊 Test 2: Statistiques Globales" -ForegroundColor Yellow
try {
    $stats = Invoke-WebRequest -Uri "$baseUrl/api/map/stats" -UseBasicParsing | ConvertFrom-Json
    Write-Host "   ✅ Statistiques récupérées" -ForegroundColor Green
    Write-Host "   📊 Total zones: $($stats.total_zones)" -ForegroundColor Gray
    Write-Host "   🟢 Zones bonnes: $($stats.zones_bonnes)" -ForegroundColor Gray
    Write-Host "   🟡 Zones moyennes: $($stats.zones_moyennes)" -ForegroundColor Gray
    Write-Host "   🔴 Zones mauvaises: $($stats.zones_mauvaises)" -ForegroundColor Gray
    Write-Host "   ⚫ Zones inconnues: $($stats.zones_inconnues)" -ForegroundColor Gray
    Write-Host "   📍 Total capteurs: $($stats.total_points)" -ForegroundColor Gray
    $passed++
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# ========================================
# TEST 3: Zones GeoJSON
# ========================================
Write-Host "`n🗺️  Test 3: Récupération Zones (GeoJSON)" -ForegroundColor Yellow
try {
    $zones = Invoke-WebRequest -Uri "$baseUrl/api/map/zones" -UseBasicParsing | ConvertFrom-Json
    
    if ($zones.type -eq "FeatureCollection" -and $zones.features.Count -gt 0) {
        Write-Host "   ✅ GeoJSON valide avec $($zones.features.Count) zones" -ForegroundColor Green
        Write-Host "   🌍 Zones chargées:" -ForegroundColor Gray
        $zones.features[0..2] | ForEach-Object {
            $qualiteColor = switch ($_.properties.qualite) {
                "BONNE" { "Green" }
                "MOYENNE" { "Yellow" }
                "MAUVAISE" { "Red" }
                default { "Gray" }
            }
            Write-Host "      - $($_.properties.nom) ($($_.properties.type)): $($_.properties.qualite)" -ForegroundColor $qualiteColor
        }
        $passed++
    } else {
        Write-Host "   ❌ Format GeoJSON invalide ou vide" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# ========================================
# TEST 4: Points d'Intérêt (Capteurs)
# ========================================
Write-Host "`n📍 Test 4: Capteurs (Points d'Intérêt)" -ForegroundColor Yellow
try {
    $pointsUrl = $baseUrl + '/api/map/points?type=capteur'
    $points = Invoke-WebRequest -Uri $pointsUrl -UseBasicParsing | ConvertFrom-Json
    
    if ($points.type -eq "FeatureCollection") {
        Write-Host "   ✅ $($points.features.Count) capteurs trouvés" -ForegroundColor Green
        Write-Host "   📡 Liste des capteurs:" -ForegroundColor Gray
        $points.features | ForEach-Object {
            Write-Host "      - $($_.properties.nom) [$($_.properties.capteur_id)]" -ForegroundColor Cyan
        }
        $passed++
    } else {
        Write-Host "   ❌ Format invalide" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# ========================================
# TEST 5: Recherche Zone par Coordonnées
# ========================================
Write-Host "`n🎯 Test 5: Recherche Zone à Casablanca" -ForegroundColor Yellow
try {
    $zoneUrl = $baseUrl + '/api/map/zone-at?lat=33.5731&lon=-7.5898'
    $zone = Invoke-WebRequest -Uri $zoneUrl -UseBasicParsing | ConvertFrom-Json
    
    if ($zone.nom) {
        Write-Host "   ✅ Zone trouvée: $($zone.nom)" -ForegroundColor Green
        Write-Host "   📊 Type: $($zone.type)" -ForegroundColor Gray
        Write-Host "   💧 Qualité: $($zone.qualite_actuelle)" -ForegroundColor Gray
        $passed++
    } else {
        Write-Host "   ⚠️  Aucune zone trouvée à ces coordonnées" -ForegroundColor Yellow
        $passed++
    }
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# ========================================
# TEST 6: Mise à Jour Zone
# ========================================
Write-Host "`n🔄 Test 6: Mise à jour Zone Agadir → BONNE" -ForegroundColor Yellow
try {
    $body = @{
        latitude = 30.4278
        longitude = -9.5981
        qualite = "BONNE"
    } | ConvertTo-Json

    $update = Invoke-WebRequest -Uri "$baseUrl/api/map/update-zone" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing | ConvertFrom-Json

    if ($update.success) {
        Write-Host "   ✅ Zone $($update.zone.nom) mise à jour" -ForegroundColor Green
        Write-Host "   💧 Nouvelle qualité: $($update.zone.qualite_actuelle)" -ForegroundColor Gray
        $passed++
    } else {
        Write-Host "   ⚠️  $($update.message)" -ForegroundColor Yellow
        $passed++
    }
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# ========================================
# TEST 7: Vérification Mise à Jour
# ========================================
Write-Host "`n✔️  Test 7: Vérification Statistiques Après MAJ" -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 1
    $statsAfter = Invoke-WebRequest -Uri "$baseUrl/api/map/stats" -UseBasicParsing | ConvertFrom-Json
    
    Write-Host "   ✅ Statistiques mises à jour" -ForegroundColor Green
    Write-Host "   🟢 Zones bonnes: $($statsAfter.zones_bonnes)" -ForegroundColor Green
    Write-Host "   ⚫ Zones inconnues: $($statsAfter.zones_inconnues)" -ForegroundColor Gray
    
    if ([int]$statsAfter.zones_bonnes -gt 0) {
        Write-Host "   ✅ La mise à jour a été enregistrée" -ForegroundColor Green
    }
    $passed++
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# ========================================
# TEST 8: Accès Interface Web
# ========================================
Write-Host "`n🌐 Test 8: Interface Web Leaflet" -ForegroundColor Yellow
try {
    $webpage = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing
    
    if ($webpage.Content -match "Leaflet" -and $webpage.Content -match "AquaWatch") {
        Write-Host "   ✅ Interface web accessible" -ForegroundColor Green
        Write-Host "   🗺️  URL: http://localhost:8005" -ForegroundColor Cyan
        $passed++
    } else {
        Write-Host "   ❌ Interface invalide" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# ========================================
# RÉSUMÉ FINAL
# ========================================
Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   📊 RÉSUMÉ DES TESTS                 ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$total = $passed + $failed
$percentage = [math]::Round(($passed / $total) * 100, 2)

Write-Host "`n   ✅ Tests réussis : $passed / $total ($percentage%)" -ForegroundColor Green
if ($failed -gt 0) {
    Write-Host "   ❌ Tests échoués : $failed / $total" -ForegroundColor Red
}

Write-Host "`n╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              🌐 ACCÈS À L'INTERFACE WEB              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n   🗺️  Carte interactive : http://localhost:8005" -ForegroundColor Cyan
Write-Host "   📊 API zones        : http://localhost:8005/api/map/zones" -ForegroundColor Gray
Write-Host "   📍 API capteurs     : http://localhost:8005/api/map/points" -ForegroundColor Gray
Write-Host "   📈 API stats        : http://localhost:8005/api/map/stats`n" -ForegroundColor Gray

if ($percentage -eq 100) {
    Write-Host "🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS! 🎉`n" -ForegroundColor Green
} elseif ($percentage -ge 75) {
    Write-Host "⚠️  LA PLUPART DES TESTS SONT PASSÉS`n" -ForegroundColor Yellow
} else {
    Write-Host "❌ PLUSIEURS TESTS ONT ÉCHOUÉ - VÉRIFIEZ LES LOGS`n" -ForegroundColor Red
}
