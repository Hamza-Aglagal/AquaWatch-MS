# SonarQube - Analyse de Qualité de Code

## 📋 Vue d'ensemble

SonarQube est intégré dans AquaWatch-MS pour analyser la qualité du code des 5 microservices :
- **service_capteurs** (Node.js)
- **service_alertes** (Node.js)
- **service_api_sig** (Next.js/TypeScript)
- **service_satellite** (Python)
- **service_stmodel** (Python)

## 🚀 Démarrage de SonarQube

### 1. Démarrer les services

```powershell
# Démarrer uniquement SonarQube et sa base de données
docker-compose up -d sonarqube_db sonarqube

# Vérifier les logs
docker-compose logs -f sonarqube
```

### 2. Accéder à l'interface

- **URL**: http://localhost:9090
- **Identifiants par défaut**: 
  - Username: `admin`
  - Password: `admin`

> ⚠️ **Important**: Changez le mot de passe admin lors de la première connexion !

### 3. Attendre le démarrage complet

SonarQube peut prendre 2-3 minutes pour démarrer complètement. Attendez que les logs affichent :
```
SonarQube is operational
```

## 📊 Lancer une analyse

### Analyse de tous les services

```powershell
.\scripts\sonarqube-analyze.ps1
```

### Analyse d'un service spécifique

```powershell
# Exemples
.\scripts\sonarqube-analyze.ps1 -Service service_capteurs
.\scripts\sonarqube-analyze.ps1 -Service service_stmodel
```

### Options du script

```powershell
.\scripts\sonarqube-analyze.ps1 [-Service <nom>] [-SonarHost <url>]

# Paramètres:
#   -Service    : Nom du service à analyser (défaut: "all")
#   -SonarHost  : URL de SonarQube (défaut: "http://localhost:9090")
```

## 📁 Structure des fichiers

Chaque service contient un fichier `sonar-project.properties` :

```
services/
├── service_capteurs/
│   └── sonar-project.properties
├── service_alertes/
│   └── sonar-project.properties
├── service_api_sig/
│   └── sonar-project.properties
├── service_satellite/
│   └── sonar-project.properties
└── service_stmodel/
    └── sonar-project.properties
```

## 🔍 Interpréter les résultats

### Métriques principales

1. **Bugs** 🐛
   - Erreurs de code qui peuvent causer des dysfonctionnements

2. **Vulnérabilités** 🔒
   - Problèmes de sécurité potentiels

3. **Code Smells** 👃
   - Problèmes de maintenabilité du code

4. **Couverture de code** 📈
   - Pourcentage de code testé (si configuré)

5. **Duplication** 📋
   - Pourcentage de code dupliqué

### Quality Gates

SonarQube utilise des "Quality Gates" pour déterminer si le code est acceptable :
- ✅ **Passed**: Le code respecte tous les critères
- ❌ **Failed**: Le code ne respecte pas certains critères

## 🛠️ Configuration avancée

### Ajouter la couverture de code

#### Pour les services Node.js (Jest)

1. Exécuter les tests avec couverture :
```powershell
npm test -- --coverage
```

2. Décommenter dans `sonar-project.properties` :
```properties
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

#### Pour les services Python (pytest)

1. Installer pytest-cov :
```powershell
pip install pytest-cov
```

2. Exécuter les tests :
```powershell
pytest --cov=src --cov-report=xml
```

3. Décommenter dans `sonar-project.properties` :
```properties
sonar.python.coverage.reportPaths=coverage.xml
```

### Personnaliser les Quality Gates

1. Connectez-vous à SonarQube
2. Allez dans **Quality Gates**
3. Créez un nouveau Quality Gate ou modifiez celui par défaut
4. Définissez vos propres seuils

## 🔧 Dépannage

### SonarQube ne démarre pas

```powershell
# Vérifier les logs
docker-compose logs sonarqube

# Redémarrer les services
docker-compose restart sonarqube_db sonarqube
```

### Erreur de connexion à la base de données

```powershell
# Vérifier que PostgreSQL est démarré
docker-compose ps sonarqube_db

# Recréer les conteneurs
docker-compose down
docker-compose up -d sonarqube_db sonarqube
```

### L'analyse échoue

1. Vérifiez que SonarQube est accessible : http://localhost:9090
2. Vérifiez que le fichier `sonar-project.properties` existe
3. Consultez les logs d'erreur détaillés

### Problème de mémoire

Si SonarQube manque de mémoire, ajoutez dans `docker-compose.yml` :

```yaml
sonarqube:
  environment:
    - SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true
  deploy:
    resources:
      limits:
        memory: 4G
```

## 📚 Ressources

- [Documentation SonarQube](https://docs.sonarqube.org/latest/)
- [SonarQube JavaScript/TypeScript](https://docs.sonarqube.org/latest/analysis/languages/javascript/)
- [SonarQube Python](https://docs.sonarqube.org/latest/analysis/languages/python/)

## 🔐 Sécurité

### Changer le mot de passe admin

1. Connectez-vous avec `admin/admin`
2. Allez dans **Administration** → **Security** → **Users**
3. Cliquez sur l'icône de changement de mot de passe pour l'utilisateur admin

### Créer des utilisateurs supplémentaires

1. **Administration** → **Security** → **Users**
2. Cliquez sur **Create User**
3. Définissez les permissions appropriées

## 🌐 Intégration CI/CD (Optionnel)

Pour intégrer SonarQube dans un pipeline CI/CD :

```yaml
# Exemple GitHub Actions
- name: SonarQube Scan
  run: |
    .\scripts\sonarqube-analyze.ps1 -SonarHost ${{ secrets.SONAR_HOST }}
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## 📊 Arrêter SonarQube

```powershell
# Arrêter SonarQube
docker-compose stop sonarqube sonarqube_db

# Supprimer les conteneurs (les données sont préservées)
docker-compose down
```
