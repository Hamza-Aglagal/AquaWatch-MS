# 🌊 AquaWatch - Plan de Développement Complet

## 📊 État Actuel des Services

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| service_capteurs | 8001 | ✅ Opérationnel | IoT sensors, MQTT, TimescaleDB |
| service_satellite | 8002 | ✅ Opérationnel | Sentinel-2, MongoDB, MinIO |
| service_stmodel | 8003 | ✅ Opérationnel | LSTM predictions, PyTorch |
| service_alertes | 8004 | ✅ Opérationnel | Email notifications, Redis |
| service_api_sig | 8005 | ⚠️ Partiel | Frontend Next.js (base créée) |

---

## 🎯 PHASE 1: Authentification & Gestion des Rôles
**Durée estimée: 2-3 heures**

### 1.1 Backend - Service Auth (Nouveau ou dans service_api_sig)
- [ ] Créer modèle User (id, email, password_hash, role, name, created_at)
- [ ] Rôles: `admin`, `autorite`, `citoyen`
- [ ] API endpoints:
  - `POST /api/auth/register` - Inscription
  - `POST /api/auth/login` - Connexion (retourne JWT)
  - `POST /api/auth/logout` - Déconnexion
  - `GET /api/auth/me` - Profil utilisateur
  - `PUT /api/auth/profile` - Modifier profil
- [ ] Middleware JWT validation
- [ ] Hash passwords avec bcrypt

### 1.2 Frontend - Pages Auth
- [ ] `/login` - Page connexion
- [ ] `/register` - Page inscription (citoyens uniquement)
- [ ] `/profile` - Page profil utilisateur
- [ ] Context AuthProvider avec état utilisateur
- [ ] Protection des routes selon rôle
- [ ] Stockage token (httpOnly cookies ou localStorage)

### 1.3 Permissions par Rôle
| Fonctionnalité | Admin | Autorité | Citoyen |
|----------------|-------|----------|---------|
| Dashboard complet | ✅ | ✅ | ❌ |
| Carte interactive | ✅ | ✅ | ✅ (lecture) |
| Gestion capteurs | ✅ | ✅ | ❌ |
| Voir alertes | ✅ | ✅ | ✅ (zone) |
| Créer alertes | ✅ | ✅ | ❌ |
| Prédictions détaillées | ✅ | ✅ | ❌ |
| Données satellite | ✅ | ✅ | ❌ |
| Paramètres système | ✅ | ❌ | ❌ |
| Gestion utilisateurs | ✅ | ❌ | ❌ |

---

## 🎯 PHASE 2: Interface Citoyens
**Durée estimée: 2-3 heures**

### 2.1 Dashboard Citoyen Simplifié
- [ ] Vue simplifiée de la qualité de l'eau par zone
- [ ] Indicateur visuel (vert/jaune/rouge)
- [ ] Historique des 7 derniers jours
- [ ] Recommandations de consommation

### 2.2 Carte Publique
- [ ] Carte avec zones colorées par qualité
- [ ] Popup avec infos basiques (pas de données techniques)
- [ ] Légende explicative simple
- [ ] Recherche par ville/quartier

### 2.3 Alertes Citoyens
- [ ] Liste des alertes de leur zone
- [ ] Abonnement aux notifications (email)
- [ ] Historique des alertes passées

### 2.4 Signalement Citoyen
- [ ] Formulaire de signalement (problème eau)
- [ ] Upload photo
- [ ] Géolocalisation automatique
- [ ] Suivi du signalement

---

## 🎯 PHASE 3: Interface Autorités
**Durée estimée: 3-4 heures**

### 3.1 Dashboard Avancé
- [ ] KPIs en temps réel (nombre capteurs, alertes actives, qualité moyenne)
- [ ] Graphiques interactifs (évolution qualité, tendances)
- [ ] Comparaison entre zones
- [ ] Export rapports PDF

### 3.2 Gestion Capteurs
- [ ] Liste complète des capteurs avec statut
- [ ] Ajout/modification/suppression capteurs
- [ ] Configuration seuils d'alerte par capteur
- [ ] Historique maintenance

### 3.3 Centre d'Alertes
- [ ] Tableau de bord alertes en temps réel
- [ ] Filtres avancés (type, gravité, zone, date)
- [ ] Actions: acquitter, résoudre, escalader
- [ ] Commentaires et notes
- [ ] Historique complet

### 3.4 Analyse Satellite
- [ ] Visualisation indices (NDWI, NDCI, turbidité)
- [ ] Comparaison temporelle
- [ ] Téléchargement images
- [ ] Génération rapports

### 3.5 Prédictions ML
- [ ] Dashboard prédictions 14 jours
- [ ] Alertes préventives
- [ ] Analyse de confiance
- [ ] Historique précision modèle

---

## 🎯 PHASE 4: Connexion Inter-Services
**Durée estimée: 2-3 heures**

### 4.1 API Gateway (service_api_sig)
- [ ] Proxy vers tous les services backend
- [ ] Rate limiting
- [ ] Cache Redis
- [ ] Logs centralisés

### 4.2 Routes API Unifiées
```
/api/capteurs/*     → service_capteurs:8001
/api/satellite/*    → service_satellite:8002
/api/predictions/*  → service_stmodel:8003
/api/alertes/*      → service_alertes:8004
/api/auth/*         → service_api_sig (local)
/api/users/*        → service_api_sig (local)
```

### 4.3 Synchronisation Données
- [ ] WebSocket pour temps réel (capteurs)
- [ ] Server-Sent Events pour alertes
- [ ] Polling pour données non-critiques

### 4.4 Tests d'Intégration
- [ ] Tests end-to-end complets
- [ ] Vérification flux de données
- [ ] Performance tests

---

## 🎯 PHASE 5: Fonctionnalités Avancées
**Durée estimée: 4-5 heures**

### 5.1 Notifications Push
- [ ] Service Worker pour PWA
- [ ] Notifications navigateur
- [ ] Configuration préférences

### 5.2 Rapports & Export
- [ ] Génération PDF automatique
- [ ] Export Excel des données
- [ ] Rapports programmés (hebdo/mensuel)

### 5.3 Tableau de Bord Admin
- [ ] Gestion utilisateurs (CRUD)
- [ ] Logs d'audit
- [ ] Configuration système
- [ ] Monitoring services

### 5.4 Multi-langue
- [ ] Français (défaut)
- [ ] Arabe
- [ ] Anglais

### 5.5 Mode Hors-ligne (PWA)
- [ ] Cache des données critiques
- [ ] Synchronisation au retour en ligne

---

## 📋 Commandes de Démarrage

### Démarrer tous les services
```bash
docker-compose up -d
```

### Accéder aux services
- Frontend: http://localhost:8005
- Capteurs API: http://localhost:8001
- Satellite API: http://localhost:8002
- STModel API: http://localhost:8003
- Alertes API: http://localhost:8004
- GeoServer: http://localhost:8080
- MinIO Console: http://localhost:9001

### Logs
```bash
docker-compose logs -f service_api_sig
docker-compose logs -f service_alertes
```

---

## 🚀 Ordre d'Implémentation Recommandé

1. **PHASE 1** - Authentification (critique pour la sécurité)
2. **PHASE 4** - Connexion services (base technique)
3. **PHASE 3** - Interface Autorités (utilisateurs principaux)
4. **PHASE 2** - Interface Citoyens (accès public)
5. **PHASE 5** - Fonctionnalités avancées (améliorations)

---

## 📝 Notes Techniques

### Stack Frontend
- Next.js 16 + TypeScript
- Tailwind CSS v4
- React Query (cache & fetching)
- Leaflet (cartes)
- Recharts (graphiques)
- NextAuth.js (authentification recommandée)

### Stack Backend
- Node.js + Express (capteurs, alertes)
- Python + FastAPI (satellite, stmodel)
- PostgreSQL + TimescaleDB + MongoDB
- Redis (cache, pub/sub)

### Sécurité
- JWT tokens (15min access, 7j refresh)
- HTTPS en production
- CORS configuré
- Rate limiting
- Input validation
- SQL injection prevention (ORM)

---

*Dernière mise à jour: 26 Décembre 2025*
