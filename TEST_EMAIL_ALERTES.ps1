# Script de test pour envoyer une alerte email
# Usage: .\TEST_EMAIL_ALERTES.ps1

Write-Host "=== TEST ENVOI EMAIL ALERTES ===" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier que les services sont actifs
Write-Host "1. Vérification des services..." -ForegroundColor Yellow
$serviceAlertes = docker ps --filter "name=service_alertes" --format "{{.Status}}"
$redis = docker ps --filter "name=redis_queue" --format "{{.Status}}"

if ($serviceAlertes -match "Up") {
    Write-Host "   ✅ Service alertes: $serviceAlertes" -ForegroundColor Green
} else {
    Write-Host "   ❌ Service alertes non actif!" -ForegroundColor Red
    exit 1
}

if ($redis -match "Up") {
    Write-Host "   ✅ Redis: $redis" -ForegroundColor Green
} else {
    Write-Host "   ❌ Redis non actif!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Tester la route racine
Write-Host "2. Test route racine (http://localhost:8004/)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8004/" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Service: $($data.service)" -ForegroundColor Green
    Write-Host "   ✅ Version: $($data.version)" -ForegroundColor Green
    Write-Host "   ✅ Status: $($data.status)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Vérifier les destinataires actifs
Write-Host "3. Vérification des destinataires actifs..." -ForegroundColor Yellow
$recipients = docker exec -i aquawatch-ms-db_alerts-1 psql -U aquawatch_user -d aquawatch_alerts -t -c "SELECT email FROM alert_recipients WHERE is_active=true;"
$recipientsList = $recipients.Trim() -split "`n" | Where-Object { $_.Trim() -ne "" }

if ($recipientsList.Count -gt 0) {
    foreach ($email in $recipientsList) {
        Write-Host "   ✅ $($email.Trim())" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Aucun destinataire actif trouvé!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 4. Vérifier EMAIL_ENABLED
Write-Host "4. Vérification EMAIL_ENABLED..." -ForegroundColor Yellow
$emailEnabled = docker exec aquawatch-ms-service_alertes-1 printenv EMAIL_ENABLED
if ($emailEnabled -eq "true") {
    Write-Host "   ✅ EMAIL_ENABLED = true" -ForegroundColor Green
} else {
    Write-Host "   ❌ EMAIL_ENABLED = $emailEnabled (devrait être 'true')" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 5. Publier une prédiction de test
Write-Host "5. Publication d'une prédiction de test..." -ForegroundColor Yellow

# Générer un timestamp unique
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$predictionId = "TEST_EMAIL_$timestamp"
$dateISO = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

# Construire le JSON
$jsonPayload = @"
{
  \"prediction_id\": \"$predictionId\",
  \"zone\": {
    \"latitude\": 34.02088200,
    \"longitude\": -6.84165000
  },
  \"predictions\": {
    \"qualite_eau\": \"MAUVAISE\",
    \"score_qualite\": 2.3
  },
  \"confidence\": 0.92,
  \"timestamp\": \"$dateISO\"
}
"@

Write-Host "   Zone: Rabat (34.02N, -6.84W)" -ForegroundColor Cyan
Write-Host "   Qualite: MAUVAISE (score 2.3/10)" -ForegroundColor Cyan
Write-Host "   Prediction ID: $predictionId" -ForegroundColor Cyan

# Publier via Redis
$result = docker exec -i aquawatch-ms-redis_queue-1 redis-cli PUBLISH new_prediction $jsonPayload

if ($result -eq "1") {
    Write-Host "   OK: Prediction publiee avec succes (1 subscriber)" -ForegroundColor Green
} else {
    Write-Host "   ERREUR lors de la publication (subscribers: $result)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 6. Attendre le traitement
Write-Host "6. Attente du traitement (3 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 7. Vérifier les logs
Write-Host ""
Write-Host "7. Vérification des logs..." -ForegroundColor Yellow
$logs = docker logs aquawatch-ms-service_alertes-1 --tail 15

if ($logs -match "Email sent successfully") {
    Write-Host "   OK: EMAIL ENVOYE AVEC SUCCES!" -ForegroundColor Green
    
    # Extraire le message ID
    $messageIdPattern = 'Message ID: <(.+?)>'
    if ($logs -match $messageIdPattern) {
        Write-Host "   Message ID: $($matches[1])" -ForegroundColor Cyan
    }
    
} else {
    Write-Host "   ATTENTION: Aucune confirmation d'envoi trouvee dans les logs" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Logs récents:" -ForegroundColor Gray
    Write-Host $logs -ForegroundColor Gray
}

Write-Host ""

# 8. Vérifier l'alerte en base de données
Write-Host "8. Vérification de l'alerte en base de données..." -ForegroundColor Yellow
$alertQuery = "SELECT alert_id, type, status, score_qualite, created_at FROM alerts WHERE prediction_id='$predictionId';"
$alertData = docker exec -i aquawatch-ms-db_alerts-1 psql -U aquawatch_user -d aquawatch_alerts -c $alertQuery

Write-Host $alertData -ForegroundColor Cyan

Write-Host ""
Write-Host "=== TEST TERMINÉ ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verifiez votre boite email: yassineouhadi99@gmail.com" -ForegroundColor Yellow
Write-Host "   L'email devrait contenir:" -ForegroundColor Gray
Write-Host "   - Titre: Alerte Qualite Eau - Rabat" -ForegroundColor Gray
Write-Host "   - Localisation: Rabat" -ForegroundColor Gray
Write-Host "   - Lien Google Maps" -ForegroundColor Gray
Write-Host "   - Score: 2.3/10" -ForegroundColor Gray
Write-Host "   - Gravite: Moyenne" -ForegroundColor Gray
Write-Host ""
