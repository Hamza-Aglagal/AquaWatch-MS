# 📡 Service Capteurs - AquaWatch

**Service de collecte et gestion des données IoT des capteurs de qualité d'eau**

## 🎯 Objectif

Collecter, stocker et exposer les données capteurs IoT en temps réel via API REST pour les services STModel (ML) et API-SIG (cartographie).

## 🚀 Démarrage Rapide

```bash
# Lancer le service avec Docker Compose
docker compose up db_capteurs redis_queue service_capteurs -d

# Vérifier health
curl http://localhost:8001/health

# Tester API
curl http://localhost:8001/api/capteurs
```

## 📡 Endpoints Principaux

| Endpoint | Method | Description | Pour qui |
|----------|--------|-------------|----------|
| `/health` | GET | Health check | Monitoring |
| `/api/capteurs` | GET | Liste capteurs | Admin |
| `/api/capteurs/positions` | GET | GPS capteurs | **Yassin (Carte)** |
| `/api/capteurs/data/latest` | GET | Dernières mesures | **Hamza (ML)** |
| `/api/capteurs/mesures` | POST | Ajouter mesure | Tests |
| `/api/capteurs/:id/mesures` | GET | Historique | Analytics |

## 🔧 Technologies

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: TimescaleDB (PostgreSQL + time-series)
- **ORM**: Sequelize
- **Features**: MQTT simulation, Winston logging, Helmet security

## 📊 Capteurs Actifs

- **CAP001** - Capteur Rabat Centre (34.020882, -6.841650)
- **CAP002** - Capteur Casablanca Port (33.606892, -7.639133)
- **CAP003** - Capteur Fès Ville (34.037732, -4.999448)

## 🔄 Simulation MQTT

Génération automatique de mesures toutes les **30 secondes** pour tous les capteurs actifs.

## 📝 Logs

```bash
# Voir logs en temps réel
docker logs -f aquawatch-ms-service_capteurs-1

# Dernières 50 lignes
docker logs aquawatch-ms-service_capteurs-1 --tail 50
```

## ✅ Status

**✅ COMPLET & TESTÉ** - Ready pour intégration avec STModel et API-SIG

---

**Développeur**: Bilal  
**Documentation complète**: Voir `SERVICE_CAPTEURS_DOCUMENTATION.md`  
**Tests**: Voir `TESTS_POSTMAN_CAPTEURS.md`
