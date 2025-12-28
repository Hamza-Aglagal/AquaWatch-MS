# Jenkins - CI/CD pour AquaWatch-MS

## 📋 Vue d'ensemble

Jenkins est intégré dans AquaWatch-MS pour automatiser le build, les tests, l'analyse de code et le déploiement des 5 microservices.

## 🚀 Démarrage de Jenkins

### 1. Build et démarrer Jenkins

```powershell
# Build l'image Jenkins personnalisée
docker-compose build jenkins

# Démarrer Jenkins
docker-compose up -d jenkins

# Vérifier les logs
docker-compose logs -f jenkins
```

### 2. Accéder à l'interface

- **URL**: http://localhost:8080
- **Identifiants par défaut**: 
  - Username: `admin`
  - Password: `admin123`

> ⚠️ **Important**: Changez le mot de passe admin après la première connexion !

### 3. Attendre le démarrage complet

Jenkins peut prendre 2-3 minutes pour démarrer. Attendez que les logs affichent :
```
Jenkins is fully up and running
```

---

## 📊 Pipelines Disponibles

### Services Individuels

Chaque service a son propre Jenkinsfile avec un pipeline complet :

1. **service_capteurs** (Node.js)
   - Checkout → Install → Test → SonarQube → Build → Deploy

2. **service_alertes** (Node.js)
   - Checkout → Install → Test → SonarQube → Build → Deploy

3. **service_api_sig** (Next.js/TypeScript)
   - Checkout → Install → Build → Test → SonarQube → Build Docker → Deploy

4. **service_satellite** (Python)
   - Checkout → Setup Venv → Test → SonarQube → Build → Deploy

5. **service_stmodel** (Python)
   - Checkout → Setup Venv → Test → SonarQube → Build → Deploy

### Pipeline Global

Le Jenkinsfile à la racine orchestre tous les services :
- Build parallèle de tous les services
- Tests d'intégration
- Déploiement orchestré

---

## 🔧 Configuration Initiale

### 1. Configurer SonarQube

1. Allez dans **Manage Jenkins** → **Configure System**
2. Trouvez la section **SonarQube servers**
3. Ajoutez un serveur :
   - Name: `SonarQube`
   - Server URL: `http://sonarqube:9000`
   - Server authentication token: (à créer dans SonarQube)

### 2. Configurer SonarScanner

1. Allez dans **Manage Jenkins** → **Global Tool Configuration**
2. Trouvez **SonarQube Scanner**
3. Ajoutez SonarScanner :
   - Name: `SonarScanner`
   - Install automatically: ✅

### 3. Créer les Jobs

Pour chaque service, créez un Pipeline Job :

1. **New Item** → Nom du service → **Pipeline**
2. Dans **Pipeline** :
   - Definition: `Pipeline script from SCM`
   - SCM: `Git`
   - Repository URL: votre repo Git
   - Script Path: `services/[service_name]/Jenkinsfile`

---

## 🔄 Exécution des Pipelines

### Manuellement

1. Allez sur le dashboard Jenkins
2. Cliquez sur le job désiré
3. Cliquez sur **Build Now**

### Automatiquement (Webhooks GitHub)

1. Dans votre repo GitHub, allez dans **Settings** → **Webhooks**
2. Ajoutez un webhook :
   - Payload URL: `http://[votre-jenkins]:8080/github-webhook/`
   - Content type: `application/json`
   - Events: `Just the push event`

3. Dans Jenkins, dans la configuration du job :
   - Cochez **GitHub hook trigger for GITScm polling**

---

## 📁 Structure des Fichiers

```
AquaWatch-MS/
├── Jenkinsfile (pipeline global)
├── docker-compose.yml (modifié - GeoServer: 8090, Jenkins: 8080)
├── infrastructure/
│   └── jenkins/
│       ├── Dockerfile
│       ├── plugins.txt
│       ├── init-scripts/
│       │   └── 01-configure-jenkins.groovy
│       ├── data/ (généré automatiquement)
│       └── README.md
└── services/
    ├── service_capteurs/Jenkinsfile
    ├── service_alertes/Jenkinsfile
    ├── service_api_sig/Jenkinsfile
    ├── service_satellite/Jenkinsfile
    └── service_stmodel/Jenkinsfile
```

---

## 🛠️ Fonctionnalités

### Image Jenkins Personnalisée

L'image Jenkins inclut :
- ✅ Docker CLI (pour build des images)
- ✅ Node.js 18.x et npm
- ✅ Python 3 et pip
- ✅ Docker Compose
- ✅ Plugins pré-installés (Git, Docker, SonarQube, Blue Ocean)

### Plugins Installés

- `docker-workflow` - Pipeline Docker
- `git` - Intégration Git
- `nodejs` - Support Node.js
- `sonar` - Intégration SonarQube
- `blueocean` - Interface moderne
- `pipeline-stage-view` - Vue des stages
- `workflow-aggregator` - Pipeline complet

---

## 🔍 Blue Ocean (Interface Moderne)

Accédez à l'interface moderne de Jenkins :
- URL: http://localhost:8080/blue

Avantages :
- Visualisation claire des pipelines
- Logs en temps réel
- Interface intuitive

---

## 🐛 Dépannage

### Jenkins ne démarre pas

```powershell
# Vérifier les logs
docker-compose logs jenkins

# Redémarrer
docker-compose restart jenkins
```

### Erreur de permission Docker

Si Jenkins ne peut pas accéder à Docker :

```powershell
# Sur l'hôte Windows, assurez-vous que Docker Desktop est en cours d'exécution
# Le socket Docker est monté dans le conteneur
```

### Build échoue

1. Vérifiez les logs du build dans Jenkins
2. Vérifiez que les dépendances sont installées
3. Vérifiez la connexion à SonarQube

---

## 📚 Ressources

- [Documentation Jenkins](https://www.jenkins.io/doc/)
- [Pipeline Syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Blue Ocean](https://www.jenkins.io/doc/book/blueocean/)
- [Docker Pipeline Plugin](https://plugins.jenkins.io/docker-workflow/)

---

## 🔐 Sécurité

### Changer le mot de passe admin

1. Connectez-vous avec `admin/admin123`
2. Cliquez sur votre nom en haut à droite
3. **Configure** → **Password**
4. Changez le mot de passe

### Créer des utilisateurs supplémentaires

1. **Manage Jenkins** → **Manage Users**
2. **Create User**
3. Définissez les permissions appropriées

---

## 🌐 Intégration Continue

### Workflow Recommandé

1. **Développeur** pousse du code sur GitHub
2. **Webhook GitHub** déclenche Jenkins
3. **Jenkins** exécute le pipeline :
   - Checkout du code
   - Installation des dépendances
   - Exécution des tests
   - Analyse SonarQube
   - Build de l'image Docker
   - Déploiement automatique
4. **Notifications** envoyées (email, Slack, etc.)

---

## 📊 Métriques et Rapports

Jenkins collecte automatiquement :
- ✅ Résultats des tests
- ✅ Rapports SonarQube
- ✅ Temps de build
- ✅ Taux de succès/échec
- ✅ Historique des déploiements

---

## 🔄 Arrêter Jenkins

```powershell
# Arrêter Jenkins
docker-compose stop jenkins

# Supprimer le conteneur (les données sont préservées)
docker-compose down jenkins
```

---

## ⚠️ Notes Importantes

1. **Port GeoServer** : Déplacé de 8080 à **8090**
2. **Port Jenkins** : **8080** (interface web)
3. **Port Jenkins Agent** : **50000**
4. **Accès Docker** : Jenkins a accès au daemon Docker de l'hôte
5. **Workspace** : Le projet est monté dans `/workspace` dans le conteneur
