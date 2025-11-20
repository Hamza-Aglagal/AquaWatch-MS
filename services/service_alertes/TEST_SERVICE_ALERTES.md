# 🧪 GUIDE DE TEST - SERVICE ALERTES

**Date de validation** : 20 Novembre 2025  
**Service** : `service_alertes` (Port 8004)  
**Status** : ✅ Tous les tests réussis

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [Tests de Base](#tests-de-base)
3. [Tests Fonctionnels](#tests-fonctionnels)
4. [Tests API](#tests-api)
5. [Tests de Seuils](#tests-de-seuils)
6. [Vérification Base de Données](#vérification-base-de-données)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 PRÉREQUIS

### **Démarrer l'environnement**
```powershell
# 1. Démarrer les dépendances
docker compose up db_alerts redis_queue -d

# 2. Attendre 5 secondes que les bases démarrent
Start-Sleep -Seconds 5

# 3. Démarrer le service alertes
docker compose up service_alertes -d

# 4. Vérifier que le service est actif
docker compose ps service_alertes
```

### **Vérifier les logs de démarrage**
```powershell
docker compose logs --tail 20 service_alertes
```

**Logs attendus** :
```
✓ Service alertes started on port 8000
✓ Subscribed to new_prediction channel
✓ Database synchronized
```

---

## ✅ TESTS DE BASE

### **Test 1 : Service démarré**
```powershell
# Vérifier que le conteneur tourne
docker compose ps service_alertes
```
**Résultat attendu** : Status = `Up`

---

### **Test 2 : Health Check**
```powershell
# Tester l'endpoint de santé
Invoke-WebRequest -Uri "http://localhost:8004/health" -UseBasicParsing | Select-Object -ExpandProperty Content
```
**Résultat attendu** :
```json
{"status":"ok","service":"alertes"}
```

---

### **Test 3 : Connexion PostgreSQL**
```powershell
# Vérifier les tables créées
docker compose exec db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "\dt"
```
**Résultat attendu** : Tables `alerts`, `alert_recipients`, `alert_types`, etc.

---

### **Test 4 : Connexion Redis**
```powershell
# Vérifier l'abonnement au canal
docker compose exec redis_queue redis-cli PUBSUB NUMSUB new_prediction
```
**Résultat attendu** :
```
1) "new_prediction"
2) (integer) 1    <- Un subscriber actif
```

---

## 🎯 TESTS FONCTIONNELS

### **Test 5 : Créer une alerte avec qualité MAUVAISE**

#### **Étape 1 : Compter les alertes avant**
```powershell
$count_before = (docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -t -c "SELECT COUNT(*) FROM alerts;" | Out-String).Trim()
Write-Host "Alertes avant: $count_before"
```

#### **Étape 2 : Publier une prédiction MAUVAISE**
```powershell
docker compose exec service_alertes node src/scripts/publishTest.js
```
**Résultat attendu** :
```
Published to channel `new_prediction`, receivers: 1
Payload: {..., "qualite_eau":"MAUVAISE", "score_qualite":2.xx}
```

#### **Étape 3 : Vérifier qu'une alerte a été créée**
```powershell
Start-Sleep -Seconds 2
$count_after = (docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -t -c "SELECT COUNT(*) FROM alerts;" | Out-String).Trim()
Write-Host "Alertes après: $count_after"
Write-Host "Différence: $($count_after - $count_before) (doit être 1)"
```

#### **Étape 4 : Voir la dernière alerte créée**
```powershell
docker compose exec db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT alert_id, type, status, score_qualite FROM alerts ORDER BY created_at DESC LIMIT 1;"
```
**Résultat attendu** :
```
type = QUALITE_EAU_MAUVAISE
status = pending (si EMAIL_ENABLED non activé)
score_qualite < 4.0
```

✅ **Test réussi si** : Une nouvelle alerte est créée avec `type=QUALITE_EAU_MAUVAISE`

---

### **Test 6 : Pas d'alerte avec qualité BONNE**

#### **Étape 1 : Compter les alertes avant**
```powershell
$count_before = (docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -t -c "SELECT COUNT(*) FROM alerts;" | Out-String).Trim()
Write-Host "Alertes avant: $count_before"
```

#### **Étape 2 : Publier une prédiction BONNE**
```powershell
docker compose exec service_alertes node src/scripts/publishGoodQuality.js
```
**Résultat attendu** :
```
Published to channel `new_prediction`, receivers: 1
Payload: {..., "qualite_eau":"BONNE", "score_qualite":8.xx}
```

#### **Étape 3 : Vérifier qu'AUCUNE alerte n'a été créée**
```powershell
Start-Sleep -Seconds 2
$count_after = (docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -t -c "SELECT COUNT(*) FROM alerts;" | Out-String).Trim()
Write-Host "Alertes après: $count_after"
Write-Host "Différence: $($count_after - $count_before) (doit être 0)"
```

✅ **Test réussi si** : Aucune nouvelle alerte créée (différence = 0)

---

## 🔌 TESTS API

### **Test 7 : GET /api/alerts/history (sans filtre)**
```powershell
Invoke-WebRequest -Uri "http://localhost:8004/api/alerts/history" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
```
**Résultat attendu** :
```json
{
  "alerts": [
    {
      "alert_id": "...",
      "type": "QUALITE_EAU_MAUVAISE",
      "status": "pending",
      "score_qualite": 3.37,
      "created_at": "2025-11-20T..."
    }
  ]
}
```

✅ **Test réussi si** : Retourne un tableau d'alertes

---

### **Test 8 : GET /api/alerts/history?type=QUALITE_EAU_MAUVAISE**
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:8004/api/alerts/history?type=QUALITE_EAU_MAUVAISE" -UseBasicParsing
$alerts = ($response.Content | ConvertFrom-Json).alerts
Write-Host "Nombre d'alertes QUALITE_EAU_MAUVAISE: $($alerts.Count)"
$alerts | Select-Object alert_id, type, status, score_qualite
```

✅ **Test réussi si** : Toutes les alertes retournées ont `type=QUALITE_EAU_MAUVAISE`

---

### **Test 9 : GET /api/alerts/history?startDate=YYYY-MM-DD**
```powershell
$today = Get-Date -Format "yyyy-MM-dd"
$response = Invoke-WebRequest -Uri "http://localhost:8004/api/alerts/history?startDate=$today" -UseBasicParsing
$alerts = ($response.Content | ConvertFrom-Json).alerts
Write-Host "Alertes depuis aujourd'hui: $($alerts.Count)"
$alerts | Select-Object alert_id, @{Name='date';Expression={([datetime]$_.created_at).ToString('yyyy-MM-dd')}}
```

✅ **Test réussi si** : Toutes les alertes retournées sont du jour spécifié

---

### **Test 10 : POST /api/alerts/test**
```powershell
Invoke-WebRequest -Uri "http://localhost:8004/api/alerts/test" -Method POST -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
```
**Résultat attendu** :
```json
{
  "status": "success",
  "alert": {
    "alert_id": "...",
    "type": "TEST_ALERT",
    "status": "pending",
    "score_qualite": 3.5
  }
}
```

✅ **Test réussi si** : Retourne une alerte de test avec `status=success`

---

## 📊 TESTS DE SEUILS

### **Test 11 : Vérifier la logique de seuil**

#### **Cas 1 : qualite_eau = "MAUVAISE" → Alerte**
```powershell
# Publier avec qualite_eau="MAUVAISE" et score=3.5
docker compose exec service_alertes node src/scripts/publishTest.js
Start-Sleep -Seconds 2
# Vérifier qu'une alerte existe
docker compose exec db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT COUNT(*) FROM alerts WHERE type='QUALITE_EAU_MAUVAISE' AND score_qualite < 4.0;"
```
✅ **Attendu** : Au moins 1 alerte

---

#### **Cas 2 : qualite_eau = "BONNE" ET score > 4.0 → Pas d'alerte**
```powershell
# Publier avec qualite_eau="BONNE" et score=8.5
docker compose exec service_alertes node src/scripts/publishGoodQuality.js
```
✅ **Attendu** : Aucun log "Alert created" dans les logs du service

---

#### **Cas 3 : score < 4.0 même si qualite_eau != "MAUVAISE" → Alerte**
```powershell
# Créer un script de test avec score=3.0 et qualite_eau="MOYENNE"
docker compose exec service_alertes node -e "
const Redis = require('ioredis');
const redis = new Redis('redis://redis_queue:6379');
const payload = {
  prediction_id: 'TEST_SCORE_LOW',
  zone: {latitude: 34.0, longitude: -6.0},
  predictions: {qualite_eau: 'MOYENNE', score_qualite: 3.0},
  confidence: 0.9,
  timestamp: new Date().toISOString()
};
redis.publish('new_prediction', JSON.stringify(payload)).then(() => {
  console.log('Published:', JSON.stringify(payload));
  redis.quit();
});
"
```
✅ **Attendu** : Une alerte est créée car score_qualite < 4.0

---

## 💾 VÉRIFICATION BASE DE DONNÉES

### **Test 12 : Structure de la table alerts**
```powershell
docker compose exec db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "\d alerts"
```
**Colonnes attendues** :
- `alert_id` (UUID, PRIMARY KEY)
- `prediction_id` (VARCHAR)
- `zone_latitude` (NUMERIC)
- `zone_longitude` (NUMERIC)
- `type` (VARCHAR)
- `message` (TEXT)
- `severity` (VARCHAR, NOT NULL)
- `status` (VARCHAR, DEFAULT 'pending')
- `score_qualite` (DOUBLE PRECISION)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

### **Test 13 : Statistiques des alertes**
```powershell
docker compose exec db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "
SELECT 
  status, 
  COUNT(*) as count,
  AVG(score_qualite) as avg_score,
  MIN(score_qualite) as min_score,
  MAX(score_qualite) as max_score
FROM alerts 
GROUP BY status 
ORDER BY status;
"
```
**Résultat attendu** :
```
 status  | count | avg_score | min_score | max_score
---------+-------+-----------+-----------+-----------
 pending |   4   |   3.08    |   2.24    |   3.89
 sent    |   3   |   3.15    |   2.72    |   3.63
```

---

### **Test 14 : Alertes récentes**
```powershell
docker compose exec db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "
SELECT 
  LEFT(alert_id::text, 8) as id,
  type,
  status,
  score_qualite,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created
FROM alerts 
ORDER BY created_at DESC 
LIMIT 5;
"
```

---

## 📧 TEST ENVOI EMAIL (OPTIONNEL)

### **Test 15 : Vérifier configuration EMAIL_ENABLED**
```powershell
docker compose exec service_alertes printenv | Select-String "EMAIL"
```
**Résultat attendu** :
```
EMAIL_ENABLED non défini (ou vide)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=***
SMTP_PORT=587
```

---

### **Test 16 : Logs d'envoi désactivé**
```powershell
docker compose logs --tail 10 service_alertes | Select-String "EMAIL_ENABLED"
```
**Résultat attendu** :
```
EMAIL_ENABLED not set to true - skipping sending emails
```

---

### **Test 17 : Activer l'envoi email (PRODUCTION UNIQUEMENT)**

⚠️ **Ne pas exécuter en développement sans SMTP réel**

```powershell
# 1. Créer fichier .env.alertes avec vos credentials SMTP
@"
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
"@ | Out-File -FilePath .env.alertes -Encoding utf8

# 2. Modifier docker-compose.yml pour charger .env.alertes
# Ajouter sous service_alertes:
#   env_file:
#     - .env
#     - .env.alertes

# 3. Redémarrer le service
docker compose restart service_alertes

# 4. Publier une alerte de test
docker compose exec service_alertes node src/scripts/publishTest.js

# 5. Vérifier les logs d'envoi
docker compose logs --tail 20 service_alertes | Select-String "email"
```

**Résultat attendu** :
```
✓ Email sent successfully to xxx@example.com
✓ Alert status updated to 'sent'
```

---

## 🐛 TROUBLESHOOTING

### **Problème : Service ne démarre pas**
```powershell
# 1. Vérifier les logs d'erreur
docker compose logs service_alertes | Select-String "error" -Context 3

# 2. Reconstruire l'image
docker compose build service_alertes --no-cache

# 3. Redémarrer
docker compose up service_alertes
```

---

### **Problème : Pas d'abonnement Redis**
```powershell
# 1. Vérifier que Redis tourne
docker compose ps redis_queue

# 2. Tester la connexion Redis
docker compose exec redis_queue redis-cli PING
# Attendu: PONG

# 3. Vérifier l'URL Redis dans le service
docker compose exec service_alertes printenv REDIS_URL
# Attendu: redis://redis_queue:6379
```

---

### **Problème : Alertes non créées**
```powershell
# 1. Vérifier que le listener reçoit les messages
docker compose logs -f service_alertes | Select-String "Received raw prediction"

# 2. Publier un test et surveiller
docker compose exec service_alertes node src/scripts/publishTest.js

# 3. Vérifier les logs de traitement
docker compose logs --tail 50 service_alertes | Select-String "Alert created"
```

---

### **Problème : Erreur "column severity violates not-null constraint"**
```powershell
# Solution : Le modèle Sequelize a été corrigé pour définir severity par défaut

# Vérifier que le code contient :
# if (!alertData.severity) {
#   alertData.severity = 'medium';
# }

# Redémarrer le service
docker compose restart service_alertes
```

---

### **Problème : API retourne erreur 500**
```powershell
# 1. Vérifier les logs API
docker compose logs --tail 20 service_alertes | Select-String "Error"

# 2. Tester l'endpoint health d'abord
Invoke-WebRequest -Uri "http://localhost:8004/health" -UseBasicParsing

# 3. Si health OK, tester avec paramètres simples
Invoke-WebRequest -Uri "http://localhost:8004/api/alerts/history" -UseBasicParsing
```

---

## ✅ CHECKLIST COMPLÈTE

Cochez après chaque test réussi :

- [ ] ✅ Test 1 : Service démarré
- [ ] ✅ Test 2 : Health check
- [ ] ✅ Test 3 : Connexion PostgreSQL
- [ ] ✅ Test 4 : Connexion Redis
- [ ] ✅ Test 5 : Alerte créée avec qualité MAUVAISE
- [ ] ✅ Test 6 : Pas d'alerte avec qualité BONNE
- [ ] ✅ Test 7 : API /history sans filtre
- [ ] ✅ Test 8 : API /history avec filtre type
- [ ] ✅ Test 9 : API /history avec filtre date
- [ ] ✅ Test 10 : API /test POST
- [ ] ✅ Test 11 : Logique de seuils
- [ ] ✅ Test 12 : Structure table alerts
- [ ] ✅ Test 13 : Statistiques alertes
- [ ] ✅ Test 14 : Alertes récentes
- [ ] ✅ Test 15 : Configuration EMAIL_ENABLED
- [ ] ✅ Test 16 : Logs envoi désactivé
- [ ] ⏸️ Test 17 : Envoi email réel (PRODUCTION)

---

## 📝 RAPPORT DE TEST

```powershell
# Générer un rapport de test complet
Write-Host "=== RAPPORT DE TEST SERVICE ALERTES ===" -ForegroundColor Cyan
Write-Host ""

# 1. Status du service
$service_status = docker compose ps service_alertes --format json | ConvertFrom-Json
Write-Host "✓ Service Status: $($service_status.State)" -ForegroundColor Green

# 2. Nombre d'alertes
$alert_count = docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -t -c "SELECT COUNT(*) FROM alerts;" | Out-String
Write-Host "✓ Total Alertes: $($alert_count.Trim())" -ForegroundColor Green

# 3. Statut des alertes
Write-Host "✓ Distribution des statuts:" -ForegroundColor Green
docker compose exec db_alerts psql -U aquawatch_user -d aquawatch_alerts -t -A -F'|' -c "SELECT status, COUNT(*) FROM alerts GROUP BY status;" | ForEach-Object {
    $parts = $_ -split '\|'
    Write-Host "   - $($parts[0]): $($parts[1])" -ForegroundColor Gray
}

# 4. Test API
try {
    $api_response = Invoke-WebRequest -Uri "http://localhost:8004/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ API Health: OK (Status $($api_response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ API Health: FAILED" -ForegroundColor Red
}

# 5. Redis
$redis_subs = docker compose exec redis_queue redis-cli PUBSUB NUMSUB new_prediction 2>$null
Write-Host "✓ Redis Subscribers: $(($redis_subs -split '\n')[1])" -ForegroundColor Green

Write-Host ""
Write-Host "=== FIN DU RAPPORT ===" -ForegroundColor Cyan
```

---

## 🎓 BONNES PRATIQUES

1. **Toujours tester après modifications** :
   ```powershell
   # Après chaque modification de code
   docker compose restart service_alertes
   docker compose logs -f service_alertes
   ```

2. **Vérifier les logs en temps réel** :
   ```powershell
   # Pendant les tests
   docker compose logs -f service_alertes
   ```

3. **Nettoyer régulièrement** :
   ```powershell
   # Supprimer les anciennes alertes de test
   docker compose exec db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "DELETE FROM alerts WHERE type='TEST_ALERT';"
   ```

4. **Sauvegarder les tests** :
   - Créer des scripts PowerShell réutilisables
   - Documenter les résultats attendus
   - Versionner les scripts de test dans Git

---

**🎉 Si tous les tests passent, votre service alertes est 100% fonctionnel !**
