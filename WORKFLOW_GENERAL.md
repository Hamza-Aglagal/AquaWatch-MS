# 🚀 GUIDE GÉNÉRAL - Workflow Git/Docker AquaWatch-MS
**Guide commun pour tous les développeurs : Hamza, Bilal, Yassin**  
**Workflow Git, Docker, et collaboration équipe**

---

## 👥 ÉQUIPE & RESPONSABILITÉS

| **Développeur** | **Services** | **Branches principales** |
|----------------|-------------|-------------------------|
| **Hamza** | STModel + Infrastructure | `feature/stmodel-hamza`, `feature/infrastructure-hamza` |
| **Bilal** | Capteurs + Satellite | `feature/capteurs-bilal`, `feature/satellite-bilal` |
| **Yassin** | Alertes + API-SIG | `feature/alertes-yassin`, `feature/api-sig-yassin` |

---

## 🔄 WORKFLOW GIT QUOTIDIEN

### **1. Début de journée**
```powershell
# Aller dans le projet
cd "C:\Users\[VotreNom]\Documents\EMSI 5\ML+DM+MicroServices\aquawatch-ms"

# Récupérer les dernières modifications de development
git checkout development
git pull origin development

# Retourner sur votre branche de travail
git checkout feature/[service]-[nom]

# Merger les nouveautés de development dans votre branche
git merge development
```

### **2. Pendant le développement**
```powershell
# Voir l'état de vos modifications
git status

# Voir les différences
git diff

# Ajouter fichiers modifiés
git add .
# OU ajouter fichiers spécifiques
git add services/service_capteurs/src/index.js

# Commiter avec message descriptif
git commit -m "feat(capteurs): ajout client MQTT pour données temps réel"

# Pousser régulièrement (sauvegarde cloud)
git push origin feature/[service]-[nom]
```

### **3. Fin de journée**
```powershell
# Commit final de la journée
git add .
git commit -m "wip: travail en cours sur [fonctionnalité]"
git push origin feature/[service]-[nom]
```

---

## 🌟 CONVENTION MESSAGES COMMIT

### **Préfixes obligatoires**
```
feat:     Nouvelle fonctionnalité
fix:      Correction bug
docs:     Documentation
style:    Formatage code (pas de changement logique)
refactor: Refactoring code
test:     Ajout/modification tests
chore:    Tâches maintenance (config, build)
wip:      Work in progress (travail en cours)
```

### **Exemples concrets**
```bash
# Bonnes pratiques
git commit -m "feat(capteurs): ajout client MQTT pour collecte données temps réel"
git commit -m "fix(alertes): correction envoi emails avec caractères spéciaux"
git commit -m "docs(stmodel): ajout documentation API prédictions"
git commit -m "refactor(satellite): optimisation traitement images GDAL"

# À éviter
git commit -m "update"
git commit -m "fix bug"
git commit -m "ajout trucs"
```

---

## 🐳 WORKFLOW DOCKER QUOTIDIEN

### **1. Démarrage Docker Desktop**
```powershell
# OBLIGATOIRE : Lancer Docker Desktop manuellement
# Attendre que l'icône soit verte (Docker complètement démarré)

# Vérifier que Docker fonctionne
docker --version
docker compose --version
```

### **2. Infrastructure commune**
```powershell
# Démarrer base de données et stockage (partagés par tous)
docker compose up db_timescale minio_storage -d

# Vérifier que les services sont actifs
docker compose ps
```

### **3. Développement service individuel**
```powershell
# Tester VOTRE service spécifique
docker compose up service_capteurs     # Pour Bilal
docker compose up service_satellite    # Pour Bilal
docker compose up service_stmodel      # Pour Hamza
docker compose up service_alertes      # Pour Yassin
docker compose up service_api_sig      # Pour Yassin

# Voir les logs en temps réel
docker compose logs -f service_capteurs
```

### **4. Test intégration complète**
```powershell
# Une fois par jour : tester tous les services ensemble
docker compose up --build

# Arrêter tous les services
docker compose down
```

---

## 🔧 COMMANDES DOCKER UTILES

### **Gestion services**
```powershell
# Voir status de tous les services
docker compose ps

# Logs d'un service spécifique
docker compose logs service_capteurs
docker compose logs -f service_capteurs    # Suivre en temps réel

# Redémarrer un service
docker compose restart service_capteurs

# Reconstruire un service après modifications
docker compose build service_capteurs
docker compose up service_capteurs --build
```

### **Accès aux containers**
```powershell
# Accéder au shell d'un container
docker compose exec service_capteurs bash      # Pour Node.js
docker compose exec service_stmodel bash       # Pour Python
docker compose exec db_timescale psql -U aquawatch_user -d aquawatch_db

# Voir l'utilisation ressources
docker stats

# Nettoyer espace disque
docker system prune -f
docker volume prune -f
```

### **Dépannage courant**
```powershell
# Problème de build : nettoyer et reconstruire
docker compose down -v
docker system prune -f
docker compose build --no-cache
docker compose up

# Problème base de données : reset complet
docker compose down -v
docker volume rm aquawatch-ms_db_data
docker compose up db_timescale -d

# Voir les images Docker créées
docker images | grep aquawatch
```

---

## 🔀 GESTION BRANCHES & COLLABORATION

### **Structure branches**
```
main                    # Production (ne pas toucher)
└── development         # Branche principale équipe
    ├── feature/infrastructure-hamza
    ├── feature/stmodel-hamza
    ├── feature/capteurs-bilal
    ├── feature/satellite-bilal
    ├── feature/alertes-yassin
    └── feature/api-sig-yassin
```

### **Merge Request / Pull Request**
```powershell
# Quand votre fonctionnalité est prête
# 1. Finaliser votre branche
git add .
git commit -m "feat: finalisation [fonctionnalité]"
git push origin feature/[service]-[nom]

# 2. Créer Pull Request sur GitHub
# development ← feature/[service]-[nom]

# 3. Code review par équipe
# 4. Merge après validation
```

### **Synchronisation équipe**
```powershell
# Récupérer le travail des collègues (matin)
git checkout development
git pull origin development

# Intégrer dans votre branche
git checkout feature/[service]-[nom]
git merge development

# Résoudre conflits si nécessaire
# Éditer fichiers avec conflits
git add .
git commit -m "resolve: merge conflicts with development"
```

---

## 📁 STRUCTURE PROJET COMMUNE

### **Dossiers à ne pas modifier**
```
docker-compose.yml        # Hamza seulement
.env                      # Hamza seulement (local)
.env.template            # Template pour tous
infrastructure/          # Hamza seulement
README.md                # Documentation partagée
```

### **Dossiers par service**
```
services/
├── service_capteurs/     # Bilal
├── service_satellite/    # Bilal
├── service_stmodel/      # Hamza
├── service_alertes/      # Yassin
└── service_api_sig/      # Yassin
```

### **Fichiers personnels autorisés**
```
# Dans votre service uniquement
services/[votre-service]/
├── src/                  # Votre code
├── tests/               # Vos tests
├── package.json         # Dépendances Node.js
├── requirements.txt     # Dépendances Python
├── Dockerfile          # Configuration Docker
└── README.md           # Documentation service
```

---

## 🧪 TESTS ET QUALITÉ CODE

### **Tests par service**
```powershell
# Node.js (Bilal, Yassin)
cd services/service_capteurs
npm test
npm run test:watch

# Python (Hamza, Bilal satellite)
cd services/service_stmodel
python -m pytest
python -m pytest --watch
```

### **Linting et formatage**
```powershell
# Node.js
npm run lint
npm run format

# Python
pip install black flake8
black src/
flake8 src/
```

### **Test intégration**
```powershell
# Test complet une fois par semaine
docker compose up --build
# Vérifier que tous les services démarrent sans erreur
# Tester endpoints principaux
```

---

## 🌐 PORTS ET URLS SERVICES

### **Services en développement**
```
Base de données TimescaleDB : localhost:5432
MinIO (stockage)          : localhost:9000 (API), localhost:9001 (Console)
Service Capteurs          : localhost:8001
Service Satellite         : localhost:8002  
Service STModel           : localhost:8003
Service Alertes           : localhost:8004
Service API-SIG           : localhost:8005
```

### **URLs de développement**
```
http://localhost:8001/api     # API Capteurs
http://localhost:8002/api     # API Satellite
http://localhost:8003/api     # API STModel  
http://localhost:8004/api     # API Alertes
http://localhost:8005/map     # Interface cartographique
http://localhost:9001         # Console MinIO
```

---

## 📞 COMMUNICATION ÉQUIPE

### **Daily Standup (recommandé)**
**Chaque matin 15min** :
- Qu'est-ce que j'ai fait hier ?
- Qu'est-ce que je fais aujourd'hui ?
- Est-ce que j'ai des blocages ?
- Est-ce que j'ai besoin d'aide d'un collègue ?

### **Code Review**
- **Pull Requests** : Au moins 1 collègue doit reviewer
- **Standards** : Respecter conventions nommage et commit
- **Tests** : Vérifier que le code ne casse rien
- **Documentation** : Mettre à jour si nécessaire

### **Integration**
- **Hebdomadaire** : Test complet tous services ensemble
- **Demo** : Présentation fonctionnalités développées
- **Planning** : Prioriser tâches semaine suivante

---

## 🆘 RÉSOLUTION PROBLÈMES COURANTS

### **Git conflicts**
```powershell
# Conflit lors du merge
git status                    # Voir les fichiers en conflit
# Éditer manuellement les fichiers avec <<<<< ===== >>>>>
git add .
git commit -m "resolve: merge conflict"
```

### **Docker ne build pas**
```powershell
# Solution progressive
docker compose down -v
docker system prune -f
docker compose build --no-cache
docker compose up
```

### **Service ne démarre pas**
```powershell
# Debug étape par étape
docker compose logs service_capteurs    # Voir l'erreur
docker compose build service_capteurs   # Reconstruire
docker compose up service_capteurs      # Tester individuellement
```

### **Base de données inaccessible**
```powershell
# Reset base de données
docker compose down -v
docker volume rm aquawatch-ms_db_data
docker compose up db_timescale -d
# Attendre 30 secondes pour initialisation
docker compose up [votre-service]
```

---

## 📋 CHECKLIST DÉVELOPPEUR

### **Début de semaine**
- [ ] `git pull origin development`
- [ ] Vérifier Docker Desktop démarré
- [ ] `docker compose up db_timescale minio_storage -d`
- [ ] Planifier tâches de la semaine

### **Chaque jour**
- [ ] `git pull origin development` le matin
- [ ] Commit réguliers avec messages clairs
- [ ] `git push` le soir
- [ ] Tester son service individuellement

### **Fin de semaine**
- [ ] Pull Request si fonctionnalité terminée
- [ ] Test intégration complet
- [ ] Documentation mise à jour
- [ ] Demo équipe si possible

---

**💡 Rappel : Communication = Clé du succès ! N'hésitez pas à vous entraider et partager vos découvertes !**