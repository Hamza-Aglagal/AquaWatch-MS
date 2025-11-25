# Guide de Simulation du Service d'Alertes

## Vue d'ensemble
Ce guide explique comment simuler et tester le système d'alertes email d'AquaWatch.

---

## Prérequis

### 1. Services démarrés
```powershell
# Démarrer tous les services
docker compose up -d

# Vérifier que les services sont actifs
docker compose ps
```

Les services nécessaires :
- ✅ `db_alerts` (PostgreSQL)
- ✅ `redis_queue` (Redis)
- ✅ `service_alertes` (Node.js)

### 2. Configuration Email
Le fichier `.env.alertes` doit contenir :
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-application
```

### 3. Destinataire configuré dans la base de données
```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT email, is_active FROM alert_recipients WHERE is_active = true;"
```

---

## Méthodes de Simulation

## 🔹 Méthode 1 : Script de Test Intégré (Recommandé)

### Étape 1 : Publier une prédiction de mauvaise qualité
```powershell
docker compose exec service_alertes node src/scripts/publishTest.js
```

**Ce que fait ce script :**
- Génère une prédiction aléatoire avec `qualite_eau = "MAUVAISE"`
- Score de qualité entre 2.0 et 4.0
- Coordonnées GPS aléatoires au Maroc
- Publie sur le channel Redis `new_prediction`

**Sortie attendue :**
```
Published to channel `new_prediction`, receivers: 1
Payload: {"prediction_id":"SCRIPT_1763671911330_618_SCRIPT","zone":{"latitude":34.36,"longitude":-7.36},"predictions":{"qualite_eau":"MAUVAISE","score_qualite":2.81},...}
```

### Étape 2 : Vérifier les logs du service
```powershell
docker compose logs --tail=30 service_alertes
```

**Logs attendus :**
```
Alert created (Sequelize): { alert_id: '...', status: 'pending', ... }
✉️ Email sent to: votre-email@gmail.com
Alert status updated to: sent
```

### Étape 3 : Vérifier la base de données
```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT alert_id, prediction_id, status, zone_latitude, zone_longitude, created_at FROM alerts ORDER BY created_at DESC LIMIT 3;"
```

**Résultat attendu :**
```
alert_id                              | prediction_id            | status | zone_latitude | zone_longitude | created_at
--------------------------------------+--------------------------+--------+---------------+----------------+------------------------
fc42a3e1-dbd2-4878-905e-f13872634869 | SCRIPT_1763670037_SCRIPT | sent   | 34.03130789   | -6.70280278    | 2025-11-20 20:20:37.689
```

### Étape 4 : Vérifier votre boîte email
- Ouvrez Gmail
- Vérifiez la réception de l'email (peut prendre 10-30 secondes)
- Si absent, vérifiez les **Spams/Courrier indésirable**

---

## 🔹 Méthode 2 : Publication Manuelle via Redis CLI

### Étape 1 : Se connecter à Redis
```powershell
docker compose exec redis_queue redis-cli
```

### Étape 2 : Publier une prédiction manuellement
```redis
PUBLISH new_prediction '{"prediction_id":"MANUAL_TEST_001","zone":{"latitude":34.02,"longitude":-6.84},"predictions":{"qualite_eau":"MAUVAISE","score_qualite":3.2},"confidence":0.9,"timestamp":"2025-11-20T20:00:00.000Z"}'
```

### Étape 3 : Vérifier le nombre de subscribers
```redis
PUBSUB NUMSUB new_prediction
```
**Résultat attendu :** `1` subscriber (le service_alertes)

### Étape 4 : Quitter Redis CLI
```redis
exit
```

---

## 🔹 Méthode 3 : Test de Bonne Qualité (Pas d'alerte)

### Publier une prédiction de bonne qualité
```powershell
docker compose exec service_alertes node src/scripts/publishGoodQuality.js
```

**Ce que fait ce script :**
- Génère une prédiction avec `qualite_eau = "BONNE"`
- Score de qualité entre 7.0 et 9.0
- **Aucune alerte ne doit être créée**

**Vérification :**
```powershell
# Compter les alertes avant
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT COUNT(*) FROM alerts;"

# Publier la bonne qualité
docker compose exec service_alertes node src/scripts/publishGoodQuality.js

# Compter les alertes après (doit être identique)
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT COUNT(*) FROM alerts;"
```

---

## 🔹 Méthode 4 : API REST - Créer une alerte de test

### Utiliser l'endpoint API
```powershell
# Via Invoke-WebRequest (PowerShell)
Invoke-WebRequest -Uri "http://localhost:8004/api/alerts/test" -Method POST -ContentType "application/json" -Body '{"zone_latitude":34.02,"zone_longitude":-6.84,"type":"TEST_ALERT","message":"Test manuel via API","score_qualite":3.5,"severity":"medium"}'
```

**Ou via curl :**
```bash
curl -X POST http://localhost:8004/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{"zone_latitude":34.02,"zone_longitude":-6.84,"type":"TEST_ALERT","message":"Test manuel via API","score_qualite":3.5,"severity":"medium"}'
```

**Réponse attendue :**
```json
{
  "message": "Test alert created",
  "alert": {
    "alert_id": "...",
    "status": "sent",
    "zone_latitude": 34.02,
    ...
  }
}
```

---

## 🔹 Méthode 5 : Simulation Multiple (Tests en Masse)

### Script pour générer 10 alertes consécutives
```powershell
# Générer 10 alertes espacées de 5 secondes
for ($i=1; $i -le 10; $i++) {
    Write-Host "🔄 Envoi de l'alerte $i/10..." -ForegroundColor Cyan
    docker compose exec service_alertes node src/scripts/publishTest.js
    Start-Sleep -Seconds 5
}
Write-Host "✅ 10 alertes envoyées !" -ForegroundColor Green
```

### Vérifier le taux de réussite
```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT status, COUNT(*) as count FROM alerts GROUP BY status;"
```

**Résultat attendu :**
```
 status  | count
---------+-------
 sent    |    10
 pending |     0
 failed  |     0
```

---

## 📊 Vérifications et Diagnostics

### 1. Vérifier que Redis reçoit les messages
```powershell
docker compose exec redis_queue redis-cli MONITOR
```
Puis dans un autre terminal, publier une prédiction. Vous devriez voir le message apparaître en temps réel.

### 2. Vérifier les variables d'environnement
```powershell
docker compose exec service_alertes printenv | Select-String "EMAIL"
```

**Résultat attendu :**
```
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yassineouhadi99@gmail.com
SMTP_PASSWORD=****
```

### 3. Vérifier les destinataires actifs
```powershell
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT id, email, name, is_active FROM alert_recipients;"
```

### 4. Consulter l'historique des alertes via API
```powershell
# Toutes les alertes
Invoke-RestMethod -Uri "http://localhost:8004/api/alerts/history"

# Alertes filtrées par type
Invoke-RestMethod -Uri "http://localhost:8004/api/alerts/history?type=QUALITE_EAU_MAUVAISE"

# Alertes des dernières 24h
$yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
Invoke-RestMethod -Uri "http://localhost:8004/api/alerts/history?startDate=$yesterday"
```

### 5. Vérifier les logs en temps réel
```powershell
docker compose logs -f service_alertes
```

---

## 🎨 Contenu de l'Email Envoyé

L'email contient les informations suivantes :

### Header
- 🌊 **AquaWatch - Alerte Qualité Eau**

### Corps du message
- ⚠️ **Type d'alerte** : QUALITE_EAU_MAUVAISE
- **Message** : "Alerte : Qualité eau dégradée dans la zone [lat, lon]"
- 📍 **Localisation** : Région de Rabat-Salé-Kénitra (Maroc) *(détection automatique)*
- 🗺️ **Coordonnées GPS** : Lien cliquable vers Google Maps
- 📊 **Score Qualité** : 2.81/10
- ⚡ **Gravité** : 🟡 Moyenne
- 📅 **Date d'alerte** : 20 novembre 2025 à 20:51 *(format français)*
- 🆔 **Référence** : SCRIPT_1763671911330_618_SCRIPT

### Footer
- AquaWatch - Système de surveillance de la qualité de l'eau
- Cet email a été envoyé automatiquement. Ne pas répondre.

---

## ⚙️ Personnalisation des Tests

### Modifier le script de test (publishTest.js)

Vous pouvez éditer `services/service_alertes/src/scripts/publishTest.js` pour :

1. **Changer la zone géographique** :
```javascript
const zones = [
    { latitude: 33.57, longitude: -7.59 }, // Casablanca
    { latitude: 35.77, longitude: -5.80 }, // Tanger
    { latitude: 30.42, longitude: -9.60 }  // Agadir
];
```

2. **Forcer un score spécifique** :
```javascript
const score_qualite = 2.5; // Score fixe au lieu de aléatoire
```

3. **Tester différents niveaux de gravité** :
Modifiez `alertService.js` ligne 26 pour changer `severity` :
```javascript
alertData.severity = 'critical'; // Au lieu de 'medium'
```

---

## 🚨 Résolution de Problèmes

### Problème 1 : Aucun email reçu

**Vérifications :**
```powershell
# 1. EMAIL_ENABLED est-il activé ?
docker compose exec service_alertes printenv EMAIL_ENABLED

# 2. Y a-t-il des erreurs dans les logs ?
docker compose logs --tail=50 service_alertes | Select-String "error|Error|failed"

# 3. L'alerte a-t-elle le status 'sent' ?
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT status, COUNT(*) FROM alerts GROUP BY status;"
```

**Solutions :**
- Si status = `pending` → EMAIL_ENABLED n'est pas à 'true'
- Si status = `failed` → Erreur SMTP (vérifier mot de passe Gmail)
- Vérifier les **Spams** dans Gmail

### Problème 2 : Service ne répond pas

```powershell
# Redémarrer le service
docker compose restart service_alertes

# Vérifier qu'il est actif
docker compose ps service_alertes

# Vérifier les logs de démarrage
docker compose logs --tail=20 service_alertes
```

### Problème 3 : Redis ne reçoit pas les messages

```powershell
# Vérifier que Redis fonctionne
docker compose exec redis_queue redis-cli PING
# Résultat attendu : PONG

# Vérifier les subscribers
docker compose exec redis_queue redis-cli PUBSUB NUMSUB new_prediction
# Résultat attendu : new_prediction 1
```

---

## 📈 Scénarios de Test Complets

### Scénario 1 : Test de Bout en Bout
1. ✅ Publier une prédiction de mauvaise qualité
2. ✅ Vérifier la création de l'alerte en base
3. ✅ Vérifier le status 'sent'
4. ✅ Confirmer la réception de l'email
5. ✅ Vérifier le contenu de l'email (localisation, date, etc.)

### Scénario 2 : Test de Non-Alerte
1. ✅ Publier une prédiction de bonne qualité
2. ✅ Vérifier qu'**aucune** alerte n'est créée
3. ✅ Confirmer qu'**aucun** email n'est envoyé

### Scénario 3 : Test de Volume
1. ✅ Générer 50 alertes en 5 minutes
2. ✅ Vérifier que toutes sont traitées
3. ✅ Calculer le taux de succès (sent vs failed)
4. ✅ Mesurer le temps de traitement moyen

---

## 🎯 Checklist de Validation Finale

Avant la mise en production, vérifier :

- [ ] Les 3 services (db_alerts, redis_queue, service_alertes) sont actifs
- [ ] EMAIL_ENABLED=true est configuré
- [ ] Le mot de passe Gmail est valide
- [ ] Au moins 1 destinataire actif existe en base
- [ ] Les prédictions de mauvaise qualité créent des alertes
- [ ] Les prédictions de bonne qualité ne créent PAS d'alertes
- [ ] Les emails sont reçus avec les bonnes informations
- [ ] La détection de localisation fonctionne (pas "Côte Atlantique" générique)
- [ ] La date est en français et au bon fuseau horaire
- [ ] Le lien Google Maps est cliquable et correct
- [ ] Le design de l'email est propre et lisible

---

## 📝 Commandes Rapides (Mémo)

```powershell
# Publier un test
docker compose exec service_alertes node src/scripts/publishTest.js

# Voir les logs
docker compose logs -f service_alertes

# Compter les alertes
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT COUNT(*) FROM alerts;"

# Voir les dernières alertes
docker compose exec -T db_alerts psql -U aquawatch_user -d aquawatch_alerts -c "SELECT * FROM alerts ORDER BY created_at DESC LIMIT 5;"

# Vérifier les variables
docker compose exec service_alertes printenv | Select-String "EMAIL"

# Redémarrer le service
docker compose restart service_alertes
```

---

## 🎓 Conclusion

Vous disposez maintenant de 5 méthodes différentes pour simuler et tester le système d'alertes :
1. ✅ Script de test intégré (le plus simple)
2. ✅ Publication manuelle Redis
3. ✅ Test de non-alerte (bonne qualité)
4. ✅ API REST
5. ✅ Tests en masse

Utilisez le **Scénario 1** (Test de Bout en Bout) pour une validation complète du système avant toute démo ou mise en production.

---

**Auteur** : Service AquaWatch  
**Date** : 20 novembre 2025  
**Version** : 1.0
