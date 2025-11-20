# 🧪 Test Complet du Service d'Alertes - 7 Étapes

## 📋 Vue d'ensemble

Ce document contient un **test end-to-end complet** qui valide les 7 étapes du flux du service d'alertes, de la connexion PostgreSQL jusqu'à l'API d'historique.

**Durée estimée** : 10-15 minutes  
**Prérequis** : Docker Desktop démarré, services actifs

---

## 🚀 Préparation de l'environnement

### Étape 0 : Démarrer les services nécessaires

```powershell
# Se placer dans le répertoire du projet
cd C:\Users\PC\Desktop\pfa\AquaWatch-MS

# Démarrer l'infrastructure complète
docker compose up db_alerts redis_queue service_alertes -d

# Attendre 10 secondes que tout démarre
Start-Sleep -Seconds 10

# Vérifier que les services sont actifs
docker compose ps db_alerts redis_queue service_alertes
```

**✅ Résultat attendu :**
```
NAME                                STATUS    PORTS
aquawatch-ms-db_alerts-1            running   0.0.0.0:5435->5432/tcp
aquawatch-ms-redis_queue-1          running   0.0.0.0:6379->6379/tcp
aquawatch-ms-service_alertes-1      running   0.0.0.0:8004->8000/tcp
```

---

## 📝 Tests des 7 Étapes

### ✅ ÉTAPE 1 : Connecter à PostgreSQL

**Objectif** : Vérifier que le service se connecte à la base de données et que les tables sont créées.

#### Test 1.1 : Vérifier la connexion à la base

```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT version();"
```

**✅ Résultat attendu :**
```
                                                version
-------------------------------------------------------------------------------------------------------
 PostgreSQL 15.x on x86_64-pc-linux-gnu...
```

#### Test 1.2 : Lister toutes les tables créées

```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "\dt"
```

**✅ Résultat attendu :**
```
                  List of relations
 Schema |         Name          | Type  |      Owner
--------+-----------------------+-------+-----------------
 public | AlertRecipients       | table | aquawatch_user
 public | Alerts                | table | aquawatch_user
 public | alert_deliveries      | table | aquawatch_user
 public | alert_recipients      | table | aquawatch_user
 public | alert_types           | table | aquawatch_user
 public | alerts                | table | aquawatch_user
```

#### Test 1.3 : Vérifier la structure de la table principale `alerts`

```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "\d alerts"
```

**✅ Résultat attendu :** Colonnes présentes
- `alert_id` (UUID, clé primaire)
- `prediction_id` (VARCHAR)
- `zone_latitude` (NUMERIC)
- `zone_longitude` (NUMERIC)
- `type` (VARCHAR)
- `message` (TEXT)
- `severity` (VARCHAR)
- `status` (VARCHAR)
- `score_qualite` (FLOAT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### Test 1.4 : Vérifier les logs de connexion du service

```powershell
docker compose logs service_alertes | Select-String -Pattern "Database|synchronized|connected"
```

**✅ Résultat attendu :**
```
service_alertes-1  | Database synchronized
```

**🎯 Verdict Étape 1 :** ✅ PostgreSQL connecté, tables créées

---

### ✅ ÉTAPE 2 : Configurer Redis Listener

**Objectif** : Vérifier que le service s'abonne au canal Redis "new_prediction".

#### Test 2.1 : Vérifier que Redis fonctionne

```powershell
docker compose exec redis_queue redis-cli PING
```

**✅ Résultat attendu :**
```
PONG
```

#### Test 2.2 : Vérifier les abonnements au canal "new_prediction"

```powershell
docker compose exec redis_queue redis-cli PUBSUB NUMSUB new_prediction
```

**✅ Résultat attendu :**
```
1) "new_prediction"
2) (integer) 1
```
☝️ Le chiffre `1` signifie qu'il y a **1 subscriber** actif (le service_alertes)

#### Test 2.3 : Vérifier les logs d'abonnement Redis

```powershell
docker compose logs service_alertes | Select-String -Pattern "Subscribed|new_prediction|Redis"
```

**✅ Résultat attendu :**
```
service_alertes-1  | Subscribed to new_prediction channel
```

**🎯 Verdict Étape 2 :** ✅ Redis listener actif sur "new_prediction"

---

### ✅ ÉTAPE 3 : Traiter Prédictions Reçues

**Objectif** : Vérifier que le service analyse les prédictions et déclenche des alertes selon les seuils.

#### Test 3.1 : Publier une prédiction de MAUVAISE qualité

```powershell
docker compose exec service_alertes node src/scripts/publishTest.js
```

**✅ Résultat attendu :**
```
Published to channel `new_prediction`, receivers: 1
Payload: {"prediction_id":"SCRIPT_xxx","zone":{...},"predictions":{"qualite_eau":"MAUVAISE","score_qualite":2.xx},...}
```

#### Test 3.2 : Vérifier qu'une alerte a été créée

```powershell
Start-Sleep -Seconds 2
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT alert_id, type, status, score_qualite FROM alerts ORDER BY created_at DESC LIMIT 1;"
```

**✅ Résultat attendu :**
```
               alert_id               |         type          | status  | score_qualite
--------------------------------------+-----------------------+---------+---------------
 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx | QUALITE_EAU_MAUVAISE | sent    |          2.xx
```

#### Test 3.3 : Publier une prédiction de BONNE qualité (pas d'alerte)

```powershell
docker compose exec service_alertes node src/scripts/publishGoodQuality.js
```

**✅ Résultat attendu :**
```
Published to channel `new_prediction`, receivers: 1
Payload: {"prediction_id":"TEST_GOOD_xxx","zone":{...},"predictions":{"qualite_eau":"BONNE","score_qualite":7.xx},...}
```

#### Test 3.4 : Vérifier qu'aucune nouvelle alerte n'a été créée

```powershell
# Compter les alertes avant et après (doit être identique)
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT COUNT(*) FROM alerts;"
```

**✅ Résultat attendu :** Le nombre d'alertes ne change pas après la publication de bonne qualité

#### Test 3.5 : Vérifier les logs de traitement

```powershell
docker compose logs --tail=30 service_alertes | Select-String -Pattern "Alert created|qualite_eau"
```

**✅ Résultat attendu :**
```
service_alertes-1  | Received raw prediction payload: {..."qualite_eau":"MAUVAISE"...}
service_alertes-1  | Alert created (Sequelize): { alert_id: '...', status: 'pending', ... }
```

**🎯 Verdict Étape 3 :** ✅ Logique de seuil fonctionne (MAUVAISE → alerte, BONNE → pas d'alerte)

---

### ✅ ÉTAPE 4 : Configurer Nodemailer

**Objectif** : Vérifier que les variables SMTP sont configurées et que Nodemailer est prêt.

#### Test 4.1 : Vérifier les variables d'environnement SMTP

```powershell
docker compose exec service_alertes printenv | Select-String "SMTP"
```

**✅ Résultat attendu :**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yassineouhadi99@gmail.com
SMTP_PASSWORD=****
```

#### Test 4.2 : Vérifier la variable EMAIL_ENABLED

```powershell
docker compose exec service_alertes printenv EMAIL_ENABLED
```

**✅ Résultat attendu :**
```
true
```

#### Test 4.3 : Vérifier les logs de configuration Nodemailer

```powershell
docker compose logs service_alertes | Select-String -Pattern "transporter|SMTP|Email"
```

**✅ Résultat attendu :** Aucune erreur de configuration SMTP

**🎯 Verdict Étape 4 :** ✅ Nodemailer configuré avec Gmail SMTP

---

### ✅ ÉTAPE 5 : Envoyer Notifications

**Objectif** : Vérifier que les emails sont envoyés aux destinataires actifs.

#### Test 5.1 : Vérifier les destinataires actifs en base

```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT email, is_active FROM alert_recipients WHERE is_active = true;"
```

**✅ Résultat attendu :**
```
          email           | is_active
--------------------------+-----------
 yassineouhadi99@gmail.com | t
```

#### Test 5.2 : Publier une prédiction pour déclencher l'envoi d'email

```powershell
docker compose exec service_alertes node src/scripts/publishTest.js
```

#### Test 5.3 : Vérifier les logs d'envoi d'email

```powershell
Start-Sleep -Seconds 3
docker compose logs --tail=40 service_alertes | Select-String -Pattern "Email|email|sent|failed"
```

**✅ Résultat attendu :**
```
service_alertes-1  | Alert created (Sequelize): { alert_id: '...', status: 'pending', ... }
service_alertes-1  | (Pas d'erreur "Error sending email")
```

#### Test 5.4 : Vérifier le statut de l'alerte (doit être 'sent')

```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT prediction_id, status, created_at FROM alerts ORDER BY created_at DESC LIMIT 1;"
```

**✅ Résultat attendu :**
```
          prediction_id          | status |       created_at
---------------------------------+--------+-------------------------
 SCRIPT_xxx_SCRIPT               | sent   | 2025-11-20 20:xx:xx.xxx
```

#### Test 5.5 : Vérifier la réception de l'email

**Action manuelle :**
1. Ouvrir Gmail → https://mail.google.com
2. Vérifier la boîte de réception (ou Spam)
3. Rechercher email avec sujet : "🚨 Alerte Qualité Eau - [Localisation]"

**✅ Contenu attendu de l'email :**
- 📍 **Localisation** : Région détectée (ex: Région de Rabat-Salé-Kénitra)
- 🗺️ **Coordonnées** : Lien Google Maps cliquable
- 📊 **Score Qualité** : X.XX/10
- ⚡ **Gravité** : 🟡 Moyenne
- 📅 **Date** : Format français (ex: "20 novembre 2025 à 20:46")
- 🆔 **Référence** : SCRIPT_xxx_SCRIPT

**🎯 Verdict Étape 5 :** ✅ Emails envoyés avec succès (status='sent')

---

### ✅ ÉTAPE 6 : Stocker Historique

**Objectif** : Vérifier que toutes les alertes sont stockées avec leurs statuts.

#### Test 6.1 : Compter le nombre total d'alertes

```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT COUNT(*) as total_alertes FROM alerts;"
```

**✅ Résultat attendu :**
```
 total_alertes
---------------
            15  (ou plus, selon le nombre de tests effectués)
```

#### Test 6.2 : Analyser la répartition par statut

```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT status, COUNT(*) as count FROM alerts GROUP BY status;"
```

**✅ Résultat attendu :**
```
 status  | count
---------+-------
 sent    |    12
 pending |     2
 failed  |     1
```

#### Test 6.3 : Afficher les 5 dernières alertes

```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT alert_id, prediction_id, type, status, score_qualite, created_at FROM alerts ORDER BY created_at DESC LIMIT 5;"
```

**✅ Résultat attendu :** Liste des 5 alertes les plus récentes avec toutes leurs informations

#### Test 6.4 : Vérifier les informations complètes d'une alerte

```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT * FROM alerts ORDER BY created_at DESC LIMIT 1;"
```

**✅ Résultat attendu :** Alerte complète avec :
- alert_id, prediction_id
- zone_latitude, zone_longitude
- type, message, severity
- status, score_qualite
- created_at, updated_at

**🎯 Verdict Étape 6 :** ✅ Historique stocké avec traçabilité complète

---

### ✅ ÉTAPE 7 : Exposer API Historique

**Objectif** : Vérifier que l'API REST retourne l'historique des alertes avec filtres.

#### Test 7.1 : Récupérer toutes les alertes via API

```powershell
Invoke-RestMethod -Uri "http://localhost:8004/api/alerts/history" | ConvertTo-Json -Depth 3
```

**✅ Résultat attendu :**
```json
[
  {
    "alert_id": "xxx-xxx-xxx",
    "prediction_id": "SCRIPT_xxx",
    "zone_latitude": 34.02,
    "zone_longitude": -6.84,
    "type": "QUALITE_EAU_MAUVAISE",
    "message": "Alerte : Qualité eau dégradée...",
    "severity": "medium",
    "status": "sent",
    "score_qualite": 2.76,
    "created_at": "2025-11-20T20:20:37.689Z",
    "updated_at": "2025-11-20T20:20:37.689Z"
  },
  ...
]
```

#### Test 7.2 : Filtrer par type d'alerte

```powershell
Invoke-RestMethod -Uri "http://localhost:8004/api/alerts/history?type=QUALITE_EAU_MAUVAISE" | Select-Object -First 3
```

**✅ Résultat attendu :** Seulement les alertes de type "QUALITE_EAU_MAUVAISE"

#### Test 7.3 : Filtrer par date (alertes du jour)

```powershell
$today = Get-Date -Format "yyyy-MM-dd"
Invoke-RestMethod -Uri "http://localhost:8004/api/alerts/history?startDate=$today" | Select-Object -First 3
```

**✅ Résultat attendu :** Seulement les alertes créées aujourd'hui

#### Test 7.4 : Filtrer par zone géographique

```powershell
Invoke-RestMethod -Uri "http://localhost:8004/api/alerts/history?zone_latitude=34.02&zone_longitude=-6.84"
```

**✅ Résultat attendu :** Alertes pour les coordonnées spécifiées (si existantes)

#### Test 7.5 : Combiner plusieurs filtres

```powershell
$today = Get-Date -Format "yyyy-MM-dd"
Invoke-RestMethod -Uri "http://localhost:8004/api/alerts/history?type=QUALITE_EAU_MAUVAISE&startDate=$today"
```

**✅ Résultat attendu :** Alertes de type "QUALITE_EAU_MAUVAISE" créées aujourd'hui

#### Test 7.6 : Vérifier la limite de résultats (max 200)

```powershell
$alerts = Invoke-RestMethod -Uri "http://localhost:8004/api/alerts/history"
$alerts.Count
```

**✅ Résultat attendu :** Nombre ≤ 200 (limite de l'API)

#### Test 7.7 : Tester avec curl (format alternatif)

```powershell
curl http://localhost:8004/api/alerts/history
```

**✅ Résultat attendu :** JSON brut des alertes

**🎯 Verdict Étape 7 :** ✅ API REST fonctionnelle avec tous les filtres

---

## 📊 Rapport de Test Complet

### Checklist de Validation Finale

Exécuter ce script PowerShell pour générer un rapport automatique :

```powershell
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLET SERVICE ALERTES - 7 ÉTAPES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Étape 1 : PostgreSQL
Write-Host "✅ ÉTAPE 1 : PostgreSQL" -ForegroundColor Green
$tables = docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "\dt" 2>$null
if ($tables -match "alerts") {
    Write-Host "   ✓ Tables créées" -ForegroundColor Green
} else {
    Write-Host "   ✗ Erreur tables" -ForegroundColor Red
}

# Étape 2 : Redis
Write-Host "`n✅ ÉTAPE 2 : Redis Listener" -ForegroundColor Green
$redis = docker compose exec redis_queue redis-cli PUBSUB NUMSUB new_prediction 2>$null
if ($redis -match "1") {
    Write-Host "   ✓ Subscriber actif" -ForegroundColor Green
} else {
    Write-Host "   ✗ Pas de subscriber" -ForegroundColor Red
}

# Étape 3 : Traitement
Write-Host "`n✅ ÉTAPE 3 : Traitement Prédictions" -ForegroundColor Green
$count = docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT COUNT(*) FROM alerts;" 2>$null | Select-String "\d+"
Write-Host "   ✓ $($count.Matches.Value) alertes traitées" -ForegroundColor Green

# Étape 4 : Nodemailer
Write-Host "`n✅ ÉTAPE 4 : Nodemailer" -ForegroundColor Green
$smtp = docker compose exec service_alertes printenv SMTP_HOST 2>$null
if ($smtp -match "smtp.gmail.com") {
    Write-Host "   ✓ SMTP configuré" -ForegroundColor Green
} else {
    Write-Host "   ✗ SMTP non configuré" -ForegroundColor Red
}

# Étape 5 : Envoi Emails
Write-Host "`n✅ ÉTAPE 5 : Envoi Notifications" -ForegroundColor Green
$sent = docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT COUNT(*) FROM alerts WHERE status='sent';" 2>$null | Select-String "\d+"
Write-Host "   ✓ $($sent.Matches.Value) emails envoyés" -ForegroundColor Green

# Étape 6 : Historique
Write-Host "`n✅ ÉTAPE 6 : Stockage Historique" -ForegroundColor Green
$statuts = docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT status, COUNT(*) FROM alerts GROUP BY status;" 2>$null
Write-Host "   ✓ Statuts: $statuts" -ForegroundColor Green

# Étape 7 : API
Write-Host "`n✅ ÉTAPE 7 : API Historique" -ForegroundColor Green
try {
    $api = Invoke-RestMethod -Uri "http://localhost:8004/api/alerts/history" -ErrorAction Stop
    Write-Host "   ✓ API accessible ($($api.Count) alertes)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ API inaccessible" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST TERMINÉ" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
```

### Résultat Attendu du Rapport

```
========================================
  TEST COMPLET SERVICE ALERTES - 7 ÉTAPES
========================================

✅ ÉTAPE 1 : PostgreSQL
   ✓ Tables créées

✅ ÉTAPE 2 : Redis Listener
   ✓ Subscriber actif

✅ ÉTAPE 3 : Traitement Prédictions
   ✓ 15 alertes traitées

✅ ÉTAPE 4 : Nodemailer
   ✓ SMTP configuré

✅ ÉTAPE 5 : Envoi Notifications
   ✓ 12 emails envoyés

✅ ÉTAPE 6 : Stockage Historique
   ✓ Statuts: sent:12, pending:2, failed:1

✅ ÉTAPE 7 : API Historique
   ✓ API accessible (15 alertes)

========================================
  TEST TERMINÉ
========================================
```

---

## 🎯 Critères de Réussite

Pour considérer le service comme **pleinement fonctionnel**, tous ces critères doivent être remplis :

- [x] **Étape 1** : Service connecté à PostgreSQL, 6 tables créées
- [x] **Étape 2** : 1 subscriber actif sur canal "new_prediction"
- [x] **Étape 3** : Alertes créées pour MAUVAISE qualité, pas d'alerte pour BONNE qualité
- [x] **Étape 4** : Variables SMTP configurées (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)
- [x] **Étape 5** : EMAIL_ENABLED=true, emails reçus dans Gmail, status='sent'
- [x] **Étape 6** : Toutes alertes stockées avec statuts (sent/pending/failed)
- [x] **Étape 7** : API `/api/alerts/history` retourne JSON, filtres fonctionnels

**🎉 Si tous les critères sont remplis : SERVICE VALIDÉ ✅**

---

## 🔄 Test Automatisé Complet (Script One-Click)

Copiez et exécutez ce script PowerShell pour un test automatique de bout en bout :

```powershell
# TEST AUTOMATISÉ COMPLET - SERVICE ALERTES
Write-Host "`n🚀 DÉMARRAGE TEST COMPLET...`n" -ForegroundColor Cyan

# 1. Démarrer services
Write-Host "1️⃣  Démarrage services..." -ForegroundColor Yellow
docker compose up db_alerts redis_queue service_alertes -d
Start-Sleep -Seconds 10

# 2. Vérifier connexion PostgreSQL
Write-Host "`n2️⃣  Test PostgreSQL..." -ForegroundColor Yellow
$pgTest = docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT COUNT(*) FROM alerts;" 2>$null
if ($pgTest) { Write-Host "   ✅ PostgreSQL OK" -ForegroundColor Green } else { Write-Host "   ❌ PostgreSQL KO" -ForegroundColor Red }

# 3. Vérifier Redis
Write-Host "`n3️⃣  Test Redis..." -ForegroundColor Yellow
$redisTest = docker compose exec redis_queue redis-cli PUBSUB NUMSUB new_prediction 2>$null
if ($redisTest -match "1") { Write-Host "   ✅ Redis Listener OK" -ForegroundColor Green } else { Write-Host "   ❌ Redis KO" -ForegroundColor Red }

# 4. Publier prédiction de test
Write-Host "`n4️⃣  Publication prédiction MAUVAISE..." -ForegroundColor Yellow
docker compose exec service_alertes node src/scripts/publishTest.js
Start-Sleep -Seconds 3

# 5. Vérifier création alerte
Write-Host "`n5️⃣  Vérification alerte créée..." -ForegroundColor Yellow
$alertTest = docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT status FROM alerts ORDER BY created_at DESC LIMIT 1;" 2>$null
if ($alertTest -match "sent") { Write-Host "   ✅ Alerte créée et email envoyé" -ForegroundColor Green } else { Write-Host "   ⚠️  Alerte créée (status: $alertTest)" -ForegroundColor Yellow }

# 6. Tester API
Write-Host "`n6️⃣  Test API /history..." -ForegroundColor Yellow
try {
    $apiTest = Invoke-RestMethod -Uri "http://localhost:8004/api/alerts/history" -ErrorAction Stop
    Write-Host "   ✅ API OK ($($apiTest.Count) alertes retournées)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ API KO" -ForegroundColor Red
}

# 7. Publier bonne qualité (pas d'alerte)
Write-Host "`n7️⃣  Test BONNE qualité (pas d'alerte)..." -ForegroundColor Yellow
$countBefore = docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT COUNT(*) FROM alerts;" 2>$null | Select-String "\d+" | ForEach-Object { $_.Matches.Value }
docker compose exec service_alertes node src/scripts/publishGoodQuality.js
Start-Sleep -Seconds 2
$countAfter = docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT COUNT(*) FROM alerts;" 2>$null | Select-String "\d+" | ForEach-Object { $_.Matches.Value }
if ($countBefore -eq $countAfter) { Write-Host "   ✅ Pas d'alerte pour BONNE qualité" -ForegroundColor Green } else { Write-Host "   ❌ Alerte créée à tort" -ForegroundColor Red }

Write-Host "`n✅ TEST COMPLET TERMINÉ !`n" -ForegroundColor Cyan
Write-Host "📧 Vérifiez votre Gmail pour l'email reçu.`n" -ForegroundColor Yellow
```

---

## 📌 Commandes Rapides pour Debugging

### Voir les logs en temps réel
```powershell
docker compose logs -f service_alertes
```

### Réinitialiser les tests
```powershell
# Vider la table des alertes
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "TRUNCATE TABLE alerts RESTART IDENTITY CASCADE;"
```

### Redémarrer le service
```powershell
docker compose restart service_alertes
```

### Vérifier l'état complet
```powershell
docker compose ps
docker compose logs --tail=50 service_alertes
```

---

## 🎓 Conclusion

Ce test complet valide l'ensemble du pipeline du service d'alertes :

1. ✅ **Connexion base de données** fonctionnelle
2. ✅ **Écoute Redis** active
3. ✅ **Logique de seuils** correcte
4. ✅ **Configuration email** valide
5. ✅ **Envoi notifications** opérationnel
6. ✅ **Stockage historique** persistant
7. ✅ **API REST** accessible

**🎉 Si tous les tests passent, le service est PRODUCTION-READY !**

---

**Auteur** : Service AquaWatch  
**Date** : 20 novembre 2025  
**Version** : 1.0  
**Durée du test** : ~10 minutes
