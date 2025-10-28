# 🧠 GUIDE SIMPLIFIÉ STModel - Prédiction Qualité de l'Eau

**Service** : STModel (Spatio-Temporal Model)  
**Développeur** : Hamza  
**Technologies** : Python, PyTorch, ConvLSTM, FastAPI

---

## 📋 TABLE DES MATIÈRES

1. [Votre Mission](#votre-mission)
2. [Stratégie en 2 Phases](#stratégie-en-2-phases)
3. [Étapes Recommandées - Phase 1](#étapes-recommandées---phase-1)
4. [Transition vers Phase 2](#transition-vers-phase-2)

---

## 🎯 VOTRE MISSION

Créer un **modèle d'intelligence artificielle** qui prédit la qualité de l'eau dans le **temps** (24h à l'avance) et l'**espace** (différentes zones géographiques).

**Exemple concret** : 
- Prédire qu'il y aura une augmentation de turbidité demain après une pluie
- Identifier les zones à risque de pollution

---

## 🚀 STRATÉGIE EN 2 PHASES

### **PHASE 1 : Développement Indépendant (MAINTENANT - 2 semaines)**

**Objectif** : Créer et tester votre modèle sans attendre Bilal

✅ **Avantages** :
- Vous travaillez de façon autonome
- Vous validez que votre modèle fonctionne
- API complète et testée

📊 **Source de données** : Dataset réel téléchargé depuis Internet (Kaggle)

---

### **PHASE 2 : Intégration avec APIs (PLUS TARD - 2 jours)**

**Objectif** : Connecter votre modèle aux services de Bilal

✅ **Avantages** :
- Données en temps réel
- Intégration complète microservices
- Prédictions sur vraies données capteurs

📡 **Source de données** : APIs de Bilal (Capteurs IoT + Satellites)

---

## 🎯 ÉTAPES RECOMMANDÉES - PHASE 1

### **ÉTAPE 1 : Télécharger Datasets (1-2 heures)**

#### **Pourquoi deux datasets ?**
Pour entraîner un modèle complet, vous avez besoin de :
- **Données capteurs** : Mesures au sol précises (pH, température, turbidité, oxygène)
- **Données satellites** : Vision globale (chlorophylle, NDWI, turbidité optique)

**Ces deux sources sont complémentaires** et permettent au modèle d'apprendre des patterns spatio-temporels riches.

---

#### **📊 A. DATASET CAPTEURS - Kaggle Water Quality**

**Lien** : https://www.kaggle.com/datasets/mssmartypants/water-quality

**Pourquoi ce dataset ?**
- ✅ **Données réelles** de capteurs de qualité de l'eau
- ✅ **Multiples paramètres** : pH, turbidité, température, oxygène, conductivité
- ✅ **Séries temporelles** : Mesures dans le temps
- ✅ **Localisations GPS** : Coordonnées des stations
- ✅ **Format CSV** : Facile à manipuler avec Python
- ✅ **Gratuit** avec compte Kaggle

**Contenu typique** :
```csv
date,                latitude, longitude, station_id,  ph,  temperature, turbidity, dissolved_oxygen, conductivity
2024-01-01 08:00:00, 33.5731,  -7.5898,   STATION_001, 7.2, 22.5,        12.3,      8.1,              450
2024-01-01 09:00:00, 33.5731,  -7.5898,   STATION_001, 7.3, 22.8,        11.9,      8.0,              455
2024-01-01 10:00:00, 33.5731,  -7.5898,   STATION_001, 7.5, 23.1,        13.2,      7.9,              460
...
```

**Représente** : Service Capteurs de Bilal (mesures IoT au sol)

---

#### **📥 Comment télécharger le dataset Capteurs ?**

**Outil nécessaire** : **Kaggle CLI** (Command Line Interface)

**Pourquoi Kaggle CLI ?**
- Téléchargement automatique des datasets
- Pas besoin de télécharger manuellement via navigateur
- Scriptable et reproductible

**Étapes** :

1. **Créer compte Kaggle** (gratuit)
   - Aller sur kaggle.com
   - S'inscrire avec email

2. **Générer token API**
   - Aller dans Settings → API → "Create New Token"
   - Un fichier `kaggle.json` se télécharge
   - **Rôle** : Authentification pour télécharger datasets

3. **Installer Kaggle CLI**
   ```powershell
   pip install kaggle
   ```
   - **Outil** : Package Python pour interagir avec Kaggle
   - **Pourquoi** : Automatiser téléchargements

4. **Placer le token**
   - Créer dossier : `C:\Users\Hamza\.kaggle\`
   - Y mettre `kaggle.json`
   - **Rôle** : Stockage sécurisé des credentials

5. **Télécharger dataset**
   ```powershell
   cd services/service_stmodel
   kaggle datasets download -d mssmartypants/water-quality -p data/raw/capteurs --unzip
   ```
   - **Explication** :
     - `kaggle datasets download` : Commande de téléchargement
     - `-d mssmartypants/water-quality` : ID du dataset
     - `-p data/raw/capteurs` : Destination (dossier capteurs)
     - `--unzip` : Décompresser automatiquement

**Résultat** : Fichier CSV dans `data/raw/capteurs/water_quality.csv`

---

#### **�️ B. DATASET SATELLITES - Sentinel Hub**

**Lien** : https://www.sentinel-hub.com/

**Pourquoi Sentinel Hub ?**
- ✅ **Données satellites Sentinel-2** (ESA - gratuit)
- ✅ **Indices pré-calculés** : Chlorophylle, NDWI, turbidité
- ✅ **API facile** : Téléchargement automatisé
- ✅ **Résolution spatiale** : 10-20m par pixel
- ✅ **Fréquence** : Passage tous les 5 jours

**Produits disponibles** :
- **Chlorophylle-a** : Concentration d'algues (mg/m³)
- **NDWI** (Normalized Difference Water Index) : Détection eau (0-1)
- **Turbidité optique** : Transparence vue du ciel (FNU)
- **Température de surface** : IR thermique (°C)

**Contenu typique** :
```csv
date,                latitude, longitude, chlorophyll, ndwi, turbidity_optical, temperature_surface
2024-01-01 10:30:00, 33.57,    -7.59,     0.8,         0.45, 15.2,             23.1
2024-01-06 10:30:00, 33.57,    -7.59,     0.85,        0.43, 14.8,             23.4
2024-01-11 10:30:00, 33.57,    -7.59,     0.92,        0.41, 16.1,             23.8
...
```

**Représente** : Service Satellite de Bilal (indices calculés depuis images satellites)

---

#### **📥 Comment télécharger le dataset Satellites ?**

**Option 1 : Sentinel Hub API (Recommandé)**

**Étape 1 : Créer compte Sentinel Hub**
- Aller sur : https://www.sentinel-hub.com/
- S'inscrire (gratuit, trial 30 jours avec crédits)
- Créer un "Configuration" → Noter OAuth Client ID et Secret

**Étape 2 : Installer sentinelhub-py**
```powershell
pip install sentinelhub
```

**Étape 3 : Configurer authentification**
```powershell
sentinelhub.config --sh_client_id <YOUR_CLIENT_ID> --sh_client_secret <YOUR_CLIENT_SECRET>
```

**Étape 4 : Script de téléchargement**

Créer `scripts/download_satellite_data.py` :

```python
from sentinelhub import SHConfig, BBox, CRS, DataCollection, SentinelHubRequest, bbox_to_dimensions, MimeType
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Configuration
config = SHConfig()
# Vos credentials déjà configurés

# Zone à télécharger (correspondant aux capteurs)
# Exemple : Casablanca
bbox = BBox(bbox=[-7.8, 33.4, -7.4, 33.7], crs=CRS.WGS84)
size = bbox_to_dimensions(bbox, resolution=60)  # 60m résolution

# Période (même que dataset capteurs)
start_date = datetime(2024, 1, 1)
end_date = datetime(2024, 12, 31)

# Requête Sentinel Hub pour indices
evalscript = """
//VERSION=3
function setup() {
  return {
    input: ["B03", "B04", "B08", "B11"],
    output: { bands: 3 }
  };
}

function evaluatePixel(sample) {
  // NDWI (Normalized Difference Water Index)
  let ndwi = (sample.B03 - sample.B08) / (sample.B03 + sample.B08);
  
  // Chlorophyll estimation (algorithme simplifié)
  let chlorophyll = (sample.B04 / sample.B03) * 10;
  
  // Turbidity (algorithme simplifié)
  let turbidity = sample.B04 * 100;
  
  return [ndwi, chlorophyll, turbidity];
}
"""

request = SentinelHubRequest(
    evalscript=evalscript,
    input_data=[
        SentinelHubRequest.input_data(
            data_collection=DataCollection.SENTINEL2_L2A,
            time_interval=(start_date, end_date),
        )
    ],
    responses=[
        SentinelHubRequest.output_response('default', MimeType.TIFF)
    ],
    bbox=bbox,
    size=size,
    config=config
)

# Télécharger
data = request.get_data()

# Sauvegarder
print(f"✅ {len(data)} images téléchargées")
```

**Lancer** :
```powershell
python scripts/download_satellite_data.py
```

---

**Option 2 : Copernicus Open Access Hub (Gratuit, plus manuel)**

**Lien** : https://scihub.copernicus.eu/

**Étapes** :
1. Créer compte (gratuit)
2. Rechercher images Sentinel-2 pour vos zones/dates
3. Télécharger produits L2A (réflectance de surface)
4. Traiter avec GDAL/rasterio pour extraire indices

**Note** : Plus complexe, requiert traitement d'images

---

**Option 3 : Dataset pré-traité (Plus simple pour débuter)**

**Kaggle - Satellite Water Quality Indices**

Chercher sur Kaggle : "sentinel water quality indices" ou "chlorophyll satellite"

**Exemple** : 
- https://www.kaggle.com/datasets/franciscoescobar/satellite-images-of-water-bodies

**Avantage** : Indices déjà calculés, format CSV prêt à l'emploi

---

#### **🔗 ÉTAPE 1.5 : Fusionner Capteurs + Satellites (1-2 heures)**

**Objectif** : Créer un dataset unique avec toutes les features (capteurs + satellites)

**Problème à résoudre** :
- Capteurs : Mesures toutes les heures, positions GPS précises
- Satellites : Passage tous les 5-10 jours, résolution spatiale 10-60m
- **Il faut aligner les données par temps et espace**

---

#### **� Étapes de Fusion**

**Créer `scripts/merge_datasets.py`** :

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

print("🔄 Fusion des datasets capteurs + satellites...\n")

# ─────────────────────────────────────────────────────────
# 1. CHARGER LES DATASETS
# ─────────────────────────────────────────────────────────

# Dataset Capteurs
df_capteurs = pd.read_csv('data/raw/capteurs/water_quality.csv')
print(f"📊 Capteurs chargés : {len(df_capteurs)} lignes")
print(f"Colonnes : {df_capteurs.columns.tolist()}\n")

# Dataset Satellites
df_satellites = pd.read_csv('data/raw/satellites/sentinel_indices.csv')
print(f"🛰️ Satellites chargés : {len(df_satellites)} lignes")
print(f"Colonnes : {df_satellites.columns.tolist()}\n")

# ─────────────────────────────────────────────────────────
# 2. STANDARDISER LES COLONNES
# ─────────────────────────────────────────────────────────

# Renommer pour cohérence
df_capteurs = df_capteurs.rename(columns={
    'date': 'timestamp',
    'dissolved_oxygen': 'oxygene_dissous',
    'turbidity': 'turbidite_capteur'
})

df_satellites = df_satellites.rename(columns={
    'date': 'timestamp',
    'turbidity_optical': 'turbidite_satellite',
    'chlorophyll': 'chlorophylle',
    'temperature_surface': 'temperature_surface'
})

# Convertir timestamps en datetime
df_capteurs['timestamp'] = pd.to_datetime(df_capteurs['timestamp'])
df_satellites['timestamp'] = pd.to_datetime(df_satellites['timestamp'])

print("✅ Colonnes standardisées\n")

# ─────────────────────────────────────────────────────────
# 3. ARRONDIR LES COORDONNÉES GPS
# ─────────────────────────────────────────────────────────

# Problème : Satellites ont résolution spatiale 10-60m
# Solution : Arrondir GPS à 2-3 décimales

df_capteurs['lat_round'] = df_capteurs['latitude'].round(2)  # ~1km précision
df_capteurs['lon_round'] = df_capteurs['longitude'].round(2)

df_satellites['lat_round'] = df_satellites['latitude'].round(2)
df_satellites['lon_round'] = df_satellites['longitude'].round(2)

print("✅ Coordonnées GPS arrondies\n")

# ─────────────────────────────────────────────────────────
# 4. ALIGNER TEMPORELLEMENT
# ─────────────────────────────────────────────────────────

# Problème : Satellites passent tous les 5-10 jours
# Solution : Forward fill (propager dernière valeur satellite)

# Créer une grille temporelle complète (toutes les heures)
date_range = pd.date_range(
    start=df_capteurs['timestamp'].min(),
    end=df_capteurs['timestamp'].max(),
    freq='H'  # Heure par heure
)

# Réindexer satellites sur cette grille
df_satellites_aligned = df_satellites.set_index('timestamp')
df_satellites_aligned = df_satellites_aligned.reindex(date_range)

# Forward fill : Propager dernière valeur satellite disponible
df_satellites_aligned = df_satellites_aligned.fillna(method='ffill')
df_satellites_aligned = df_satellites_aligned.reset_index()
df_satellites_aligned = df_satellites_aligned.rename(columns={'index': 'timestamp'})

print("✅ Alignement temporel effectué\n")

# ─────────────────────────────────────────────────────────
# 5. FUSIONNER PAR TIMESTAMP + GPS
# ─────────────────────────────────────────────────────────

df_combined = pd.merge(
    df_capteurs,
    df_satellites_aligned[['timestamp', 'lat_round', 'lon_round', 
                          'chlorophylle', 'ndwi', 'turbidite_satellite', 
                          'temperature_surface']],
    on=['timestamp', 'lat_round', 'lon_round'],
    how='left'  # Garder toutes les lignes capteurs
)

print(f"✅ Fusion effectuée : {len(df_combined)} lignes\n")

# ─────────────────────────────────────────────────────────
# 6. GÉRER VALEURS MANQUANTES
# ─────────────────────────────────────────────────────────

# Certaines zones peuvent ne pas avoir de données satellite
# Remplir avec valeurs moyennes ou interpolation

print("🔍 Valeurs manquantes avant traitement :")
print(df_combined[['chlorophylle', 'ndwi', 'turbidite_satellite']].isnull().sum())
print()

# Interpolation linéaire pour valeurs manquantes
df_combined['chlorophylle'] = df_combined['chlorophylle'].interpolate(method='linear')
df_combined['ndwi'] = df_combined['ndwi'].interpolate(method='linear')
df_combined['turbidite_satellite'] = df_combined['turbidite_satellite'].interpolate(method='linear')
df_combined['temperature_surface'] = df_combined['temperature_surface'].interpolate(method='linear')

# Remplir valeurs encore manquantes avec moyenne
df_combined = df_combined.fillna(df_combined.mean(numeric_only=True))

print("✅ Valeurs manquantes traitées\n")

# ─────────────────────────────────────────────────────────
# 7. SÉLECTIONNER FEATURES FINALES
# ─────────────────────────────────────────────────────────

# Colonnes à garder (format API Bilal)
features_finales = [
    # Métadonnées
    'timestamp',
    'latitude',
    'longitude',
    'station_id',
    
    # Capteurs (comme API Bilal - Service Capteurs)
    'ph',
    'temperature',
    'turbidite_capteur',
    'oxygene_dissous',
    'conductivity',
    
    # Satellites (comme API Bilal - Service Satellite)
    'chlorophylle',
    'ndwi',
    'turbidite_satellite',
    'temperature_surface'
]

df_final = df_combined[features_finales]

print("📋 Features finales sélectionnées :")
print(df_final.columns.tolist())
print()

# ─────────────────────────────────────────────────────────
# 8. CALCULER SCORE DE QUALITÉ (TARGET)
# ─────────────────────────────────────────────────────────

def calculer_qualite(row):
    """
    Calcule score de qualité (0-10) basé sur normes OMS
    """
    score = 10  # Parfait au départ
    
    # pH doit être entre 6.5 et 8.5
    if row['ph'] < 6.5 or row['ph'] > 8.5:
        score -= 3
    
    # Température < 25°C
    if row['temperature'] > 25:
        score -= 2
    
    # Turbidité < 5 NTU
    if row['turbidite_capteur'] > 5:
        score -= 2
    
    # Oxygène > 6 mg/L
    if row['oxygene_dissous'] < 6:
        score -= 3
    
    # Chlorophylle < 2 mg/m³ (risque algues)
    if row['chlorophylle'] > 2:
        score -= 2
    
    # NDWI > 0.3 (eau claire)
    if row['ndwi'] < 0.3:
        score -= 1
    
    return max(0, min(10, score))  # Entre 0 et 10

# Appliquer le calcul
df_final['qualite_score'] = df_final.apply(calculer_qualite, axis=1)

print("✅ Score de qualité calculé\n")

# ─────────────────────────────────────────────────────────
# 9. STATISTIQUES FINALES
# ─────────────────────────────────────────────────────────

print("📊 STATISTIQUES DATASET FINAL")
print("=" * 60)
print(f"Nombre total d'échantillons : {len(df_final)}")
print(f"Période : {df_final['timestamp'].min()} → {df_final['timestamp'].max()}")
print(f"Nombre de stations : {df_final['station_id'].nunique()}")
print()

print("Distribution qualité :")
print(df_final['qualite_score'].value_counts(bins=5).sort_index())
print()

print("Aperçu des données :")
print(df_final.head(3))
print()

# ─────────────────────────────────────────────────────────
# 10. SAUVEGARDER DATASET FINAL
# ─────────────────────────────────────────────────────────

output_path = 'data/processed/water_quality_combined.csv'
df_final.to_csv(output_path, index=False)

print(f"✅ Dataset final sauvegardé : {output_path}")
print(f"📁 Taille : {len(df_final)} lignes × {len(df_final.columns)} colonnes")
print()

print("🎉 Fusion terminée avec succès !")
print()
print("📋 Format compatible avec APIs Bilal :")
print("  - Capteurs : ph, temperature, turbidite, oxygene_dissous")
print("  - Satellites : chlorophylle, ndwi, turbidite_satellite, temperature_surface")
```

**Lancer la fusion** :
```powershell
python scripts/merge_datasets.py
```

---

#### **✅ Résultat de la Fusion**

**Fichier final** : `data/processed/water_quality_combined.csv`

**Structure (compatible APIs Bilal)** :
```csv
timestamp,           latitude, longitude, station_id,  ph,  temperature, turbidite_capteur, oxygene_dissous, conductivity, chlorophylle, ndwi, turbidite_satellite, temperature_surface, qualite_score
2024-01-01 08:00:00, 33.5731,  -7.5898,   STATION_001, 7.2, 22.5,        12.3,              8.1,             450,          0.8,          0.45, 15.2,                23.1,                6
2024-01-01 09:00:00, 33.5731,  -7.5898,   STATION_001, 7.3, 22.8,        11.9,              8.0,             455,          0.8,          0.45, 15.2,                23.1,                6
...
```

**Features (13 au total)** :
- **Capteurs (7)** : timestamp, lat, lon, pH, temp, turbidité, O2, conductivité
- **Satellites (4)** : chlorophylle, NDWI, turbidité optique, temp surface
- **Target (1)** : qualite_score (0-10)
- **Métadonnées (1)** : station_id

---

#### **🔍 Vérification de la Fusion**

**Créer `notebooks/01_verify_fusion.ipynb`** :

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Charger dataset fusionné
df = pd.read_csv('../data/processed/water_quality_combined.csv')

# Vérifications
print("✅ VÉRIFICATIONS")
print("=" * 60)
print(f"Nombre d'échantillons : {len(df)}")
print(f"Features : {df.columns.tolist()}")
print(f"Valeurs manquantes : {df.isnull().sum().sum()}")
print()

# Corrélations capteurs vs satellites
print("📊 CORRÉLATIONS CAPTEURS ↔ SATELLITES")
print("=" * 60)
print(f"Turbidité capteur vs satellite : {df['turbidite_capteur'].corr(df['turbidite_satellite']):.3f}")
print(f"Température eau vs surface : {df['temperature'].corr(df['temperature_surface']):.3f}")
print()

# Visualisation
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Corrélation turbidités
axes[0,0].scatter(df['turbidite_capteur'], df['turbidite_satellite'], alpha=0.5)
axes[0,0].set_xlabel('Turbidité Capteur (NTU)')
axes[0,0].set_ylabel('Turbidité Satellite (FNU)')
axes[0,0].set_title('Validation : Turbidités Capteur vs Satellite')

# Corrélation températures
axes[0,1].scatter(df['temperature'], df['temperature_surface'], alpha=0.5)
axes[0,1].set_xlabel('Température Eau (°C)')
axes[0,1].set_ylabel('Température Surface (°C)')
axes[0,1].set_title('Validation : Températures Eau vs Surface')

# Distribution qualité
df['qualite_score'].hist(bins=20, ax=axes[1,0])
axes[1,0].set_xlabel('Score Qualité')
axes[1,0].set_ylabel('Fréquence')
axes[1,0].set_title('Distribution Score Qualité')

# Heatmap corrélations
corr = df[['ph', 'temperature', 'turbidite_capteur', 'oxygene_dissous', 
           'chlorophylle', 'ndwi', 'qualite_score']].corr()
sns.heatmap(corr, annot=True, fmt='.2f', ax=axes[1,1], cmap='coolwarm')
axes[1,1].set_title('Matrice Corrélations')

plt.tight_layout()
plt.savefig('../data/processed/fusion_validation.png', dpi=300)
print("✅ Graphiques sauvegardés : fusion_validation.png")
```

---

### **ÉTAPE 2 : Explorer et Comprendre les Données (1-2 heures)**

#### **Pourquoi explorer ?**
Avant d'entraîner un modèle, vous devez **comprendre vos données** :
- Quelles sont les valeurs typiques ?
- Y a-t-il des valeurs manquantes ?
- Comment les paramètres évoluent dans le temps ?
- Y a-t-il des corrélations entre paramètres ?

---

#### **🔧 Outil : Jupyter Notebook**

**C'est quoi ?**
- **Interface interactive** pour analyser des données
- Mélange de code Python et visualisations
- Permet d'exécuter du code cellule par cellule
- Idéal pour exploration et tests

**Pourquoi Jupyter ?**
- Visualisation instantanée des résultats
- Graphiques intégrés
- Documentation au fil de l'eau
- Standard en Data Science

**Installation** :
```powershell
pip install jupyter notebook pandas matplotlib seaborn
```

---

#### **📊 Analyses à faire**

**1. Chargement et Inspection**
- **Outil** : `pandas` (bibliothèque Python pour manipuler tableaux)
- **Pourquoi pandas** : Lit CSV, manipule colonnes, calcule statistiques
- **Actions** :
  - Charger le CSV
  - Voir les premières lignes (`head()`)
  - Comprendre la structure (colonnes, types de données)
  - Compter le nombre de lignes (échantillons)

**2. Statistiques Descriptives**
- **Outil** : `pandas.describe()`
- **Pourquoi** : Obtenir min, max, moyenne, écart-type de chaque paramètre
- **Utilité** : Détecter valeurs aberrantes (ex: pH = 15 → impossible)

**3. Valeurs Manquantes**
- **Outil** : `pandas.isnull().sum()`
- **Pourquoi** : Certains capteurs peuvent avoir des pannes
- **Problème** : Modèles ML ne gèrent pas les trous de données
- **Solution** : Remplissage (imputation) ou suppression

**4. Distributions**
- **Outil** : `matplotlib` ou `seaborn` (visualisations graphiques)
- **Pourquoi** : Voir comment les valeurs sont réparties
- **Types de graphiques** :
  - **Histogramme** : Distribution d'un paramètre
  - **Boxplot** : Identifier outliers (valeurs extrêmes)
  - **Exemple** : Si pH est toujours entre 7-8 → normal

**5. Corrélations**
- **Outil** : `pandas.corr()` + Heatmap (carte de chaleur)
- **Pourquoi** : Voir si des paramètres sont liés
- **Exemple** :
  - Température ↑ → Oxygène ↓ (corrélation négative)
  - Turbidité ↑ → Chlorophylle ↑ (corrélation positive)
- **Utilité** : Comprendre les relations pour le modèle

**6. Évolution Temporelle**
- **Outil** : Graphiques de séries temporelles (lignes)
- **Pourquoi** : Voir les tendances dans le temps
- **Patterns à chercher** :
  - **Saisonnalité** : Température haute en été
  - **Tendances** : Pollution qui augmente progressivement
  - **Pics** : Turbidité après pluie
- **Utilité** : Le modèle doit apprendre ces patterns

---

### **ÉTAPE 3 : Préparation des Données (2-3 heures)**

#### **Pourquoi préparer ?**
Les modèles de Machine Learning ont besoin de données **propres** et **formatées** correctement. C'est l'étape la plus importante (80% du travail en ML) !

---

#### **🧹 Nettoyage des Données**

**1. Gérer les Valeurs Manquantes**

**Problème** : Capteur en panne → pas de mesure
**Exemple** : pH manquant à 14h00

**Solutions** :

- **Suppression** :
  - **Quand** : Peu de valeurs manquantes (< 5%)
  - **Comment** : Supprimer les lignes incomplètes
  - **Outil** : `pandas.dropna()`
  - **Inconvénient** : Perte d'informations

- **Imputation (Remplissage)** :
  - **Méthode 1 - Moyenne** : Remplacer par valeur moyenne
    - **Outil** : `pandas.fillna(df.mean())`
    - **Quand** : Données stables
  
  - **Méthode 2 - Forward Fill** : Répéter dernière valeur connue
    - **Outil** : `pandas.fillna(method='ffill')`
    - **Quand** : Valeurs qui changent lentement
    - **Exemple** : pH à 14h manquant → utiliser pH de 13h
  
  - **Méthode 3 - Interpolation** : Calculer valeur entre deux points
    - **Outil** : `pandas.interpolate()`
    - **Quand** : Séries temporelles continues
    - **Exemple** : pH = 7.0 à 13h, pH = 7.4 à 15h → pH 14h ≈ 7.2

**2. Supprimer les Outliers (Valeurs Aberrantes)**

**Problème** : Erreurs de capteur → valeurs impossibles
**Exemple** : pH = 25 (impossible, max théorique = 14)

**Méthodes** :

- **Règles métier** :
  - pH doit être entre 0 et 14
  - Température entre -5°C et 40°C
  - Supprimer tout ce qui sort des limites

- **Méthode statistique (Z-score)** :
  - **Principe** : Si valeur > 3 écarts-types → outlier
  - **Outil** : `scipy.stats.zscore`
  - **Exemple** : Si pH moyen = 7.5 et toutes les valeurs entre 7-8, une valeur à 12 est suspecte

---

#### **📏 Normalisation des Données**

**Problème** : Les paramètres ont des échelles différentes
- pH : 0-14
- Température : 0-40°C
- Conductivité : 0-2000 μS/cm

**Pourquoi normaliser ?**
- Les réseaux de neurones fonctionnent mieux avec valeurs entre 0 et 1
- Évite qu'un paramètre "domine" les autres
- Accélère l'apprentissage

**Méthode : Min-Max Scaling**
- **Formule** : `(valeur - min) / (max - min)`
- **Résultat** : Toutes les valeurs entre 0 et 1
- **Outil** : `scikit-learn.MinMaxScaler`
- **Exemple** :
  - Température originale : 20°C (min=0, max=40)
  - Normalisée : (20-0)/(40-0) = 0.5

**Méthode Alternative : Standardisation**
- **Formule** : `(valeur - moyenne) / écart-type`
- **Résultat** : Moyenne = 0, écart-type = 1
- **Outil** : `scikit-learn.StandardScaler`
- **Quand l'utiliser** : Quand distribution gaussienne (cloche)

---

#### **🔢 Créer des Séquences Temporelles**

**Pourquoi ?**
Votre modèle doit **apprendre des patterns temporels**. Il faut lui montrer une **fenêtre de temps passé** pour prédire le futur.

**Concept : Sliding Window (Fenêtre Glissante)**

**Exemple concret** :
- Vous voulez prédire la qualité à 24h
- Vous utilisez les 24 dernières heures comme input

```
Input (X) : 24 mesures passées (heures 0 à 23)
Output (y) : Qualité à l'heure 24
```

**Paramètres importants** :

1. **Sequence Length (Longueur de séquence)** :
   - **C'est quoi** : Nombre de pas de temps passés à utiliser
   - **Exemple** : `sequence_length = 24` → utiliser 24 heures passées
   - **Choix** : 
     - 24 heures → prédiction court terme
     - 72 heures (3 jours) → prédiction moyen terme
   - **Règle** : Plus long = plus de contexte, mais plus complexe

2. **Horizon (Horizon de prédiction)** :
   - **C'est quoi** : Combien de temps dans le futur prédire
   - **Exemple** : `horizon = 24` → prédire dans 24h
   - **Choix selon besoin** :
     - 6h → très court terme
     - 24h → court terme (recommandé)
     - 72h → moyen terme

**Construction des séquences** :

**Outil** : `numpy` (bibliothèque calcul matriciel)

**Mécanisme** :
```
Données brutes : [mesure1, mesure2, mesure3, ..., mesure100]

Séquence 1 :
  Input  : mesures 1-24
  Output : qualité heure 25

Séquence 2 :
  Input  : mesures 2-25
  Output : qualité heure 26

Séquence 3 :
  Input  : mesures 3-26
  Output : qualité heure 27

... etc
```

**Résultat** : 
- X : Tableau 3D (nombre_séquences, 24, nombre_features)
- y : Tableau 1D (nombre_séquences,) avec scores de qualité

---

#### **🗺️ Créer une Grille Spatiale (Avancé)**

**Pourquoi ?**
Le **ConvLSTM** combine :
- **LSTM** : Apprend le temps
- **CNN** : Apprend l'espace (comme les images)

Pour utiliser CNN, besoin d'une **grille 2D** (comme une image).

**Concept** :
- Transformer points GPS dispersés en grille régulière
- Chaque cellule = zone géographique

**Exemple** :
```
Zone : Casablanca (33.4-33.7 N, -7.8 à -7.4 W)
Grille : 10x10 cellules
Chaque cellule : 3km x 3km
```

**Méthode : Interpolation Spatiale**
- **Problème** : Capteur seulement à certains points
- **Solution** : Estimer valeurs entre les points
- **Outil** : `scipy.interpolate.griddata`
- **Techniques** :
  - **Nearest** : Prendre valeur du capteur le plus proche
  - **Linear** : Interpolation linéaire entre capteurs
  - **Cubic** : Interpolation lisse (courbe)

**Résultat** :
- X : Tableau 5D (séquences, temps, features, hauteur_grille, largeur_grille)
- **Exemple** : (1000, 24, 7, 10, 10)

**Note** : Pour débuter, vous pouvez **skip cette partie** et utiliser un LSTM simple (sans grille spatiale).

---

### **ÉTAPE 4 : Construire le Modèle ConvLSTM (3-4 heures)**

#### **🧠 Comprendre ConvLSTM**

**C'est quoi ?**
Un réseau de neurones qui combine :
- **LSTM** (Long Short-Term Memory) : Mémoire temporelle
- **Convolutions** (CNN) : Vision spatiale

---

#### **📚 Les Composants**

**1. LSTM (Mémoire Temporelle)**

**Problème résolu** : 
- Les réseaux classiques "oublient" le passé
- LSTM se souvient des informations importantes

**Comment ça marche** :
- **Cell State** : Mémoire à long terme
- **Hidden State** : Mémoire à court terme
- **Gates (Portes)** : Contrôlent ce qu'on garde/oublie
  - **Forget Gate** : Décide quoi oublier
  - **Input Gate** : Décide quoi mémoriser
  - **Output Gate** : Décide quoi sortir

**Exemple** :
```
Heure 1 : pH = 7.0 → LSTM mémorise
Heure 2 : pH = 7.1 → LSTM compare avec heure 1
Heure 3 : pH = 7.5 → LSTM détecte augmentation
Prédiction : Tendance à la hausse
```

**Pourquoi LSTM pour qualité eau ?**
- Qualité évolue lentement dans le temps
- Événements passés influencent le futur (ex: pluie → turbidité)
- Besoin de mémoire longue durée

---

**2. CNN (Vision Spatiale)**

**Problème résolu** :
- Capteurs voisins sont corrélés
- Pollution se propage dans l'espace

**Comment ça marche** :
- **Convolution** : Filtre qui scanne la grille spatiale
- **Kernel** : Petite fenêtre (ex: 3x3) qui cherche des patterns
- Détecte patterns locaux (ex: zone polluée)

**Exemple** :
```
Station A : pH = 7.0
Station B (voisine) : pH = 6.8
Station C (voisine) : pH = 6.9
→ CNN détecte : zone acidification
```

---

**3. ConvLSTM = LSTM + CNN**

**Principe** :
- Applique convolutions **dans le temps**
- Chaque pas de temps = image spatiale
- LSTM gère l'évolution temporelle de ces images

**Avantage** :
- Capture patterns spatio-temporels complexes
- Ex: Pollution qui se déplace dans l'espace et évolue dans le temps

---

#### **🏗️ Architecture du Modèle**

**Couches du modèle** :

**1. Couche Input**
- **Rôle** : Recevoir les données
- **Shape** : (batch, sequence, features, height, width)
- **Exemple** : (32, 24, 7, 10, 10)
  - 32 séquences à la fois
  - 24 pas de temps
  - 7 features (pH, temp, etc.)
  - Grille 10x10

**2. Couches ConvLSTM (x2 ou x3)**
- **Rôle** : Apprendre patterns spatio-temporels
- **Paramètres** :
  - **Hidden dim** : Nombre de filtres (ex: 64)
  - **Kernel size** : Taille fenêtre (ex: 3x3)
  - **Nombre de couches** : 2-3 couches empilées
- **Pourquoi plusieurs couches** :
  - Couche 1 : Patterns simples
  - Couche 2 : Patterns complexes
  - Couche 3 : Patterns très abstraits

**3. Pooling Layer**
- **Rôle** : Réduire dimensions spatiales
- **Type** : AdaptiveAvgPool2d
- **Effet** : Grille 10x10 → 1 valeur globale
- **Pourquoi** : Résumer l'information spatiale

**4. Fully Connected Layers (Dense)**
- **Rôle** : Transformer features en prédiction finale
- **Architecture typique** :
  - Layer 1 : 64 → 32 neurones
  - ReLU (activation)
  - Dropout (régularisation, évite overfitting)
  - Layer 2 : 32 → 1 neurone (score qualité)

**5. Output**
- **Résultat** : Score de qualité (0-10)

---

#### **🔧 Outils PyTorch**

**Pourquoi PyTorch ?**
- Framework ML flexible et puissant
- Très utilisé en recherche
- Support GPU (calcul rapide)
- Communauté active

**Modules utilisés** :

- **torch.nn.Module** : Classe de base pour modèles
- **torch.nn.Conv2d** : Convolutions spatiales
- **torch.nn.LSTM** ou **ConvLSTMCell** : Mémoire temporelle
- **torch.nn.Linear** : Couches fully connected
- **torch.nn.ReLU** : Fonction d'activation
- **torch.nn.Dropout** : Régularisation
- **torch.optim** : Optimiseurs (Adam, SGD)
- **torch.nn.MSELoss** : Fonction de perte (Mean Squared Error)

---

#### **🚀 Version Simplifiée : LSTM sans Convolutions**

**Recommandation** : Commencez par un **LSTM simple** sans grille spatiale !

**Pourquoi ?**
- Plus facile à implémenter
- Plus rapide à entraîner
- Valide déjà les prédictions temporelles
- Peut être amélioré plus tard

**Architecture simplifiée** :
```
Input (batch, 24, 7)  # 24 heures, 7 features
  ↓
LSTM Layer 1 (64 units)
  ↓
LSTM Layer 2 (64 units)
  ↓
Fully Connected (64 → 32)
  ↓
ReLU + Dropout
  ↓
Fully Connected (32 → 1)
  ↓
Output : Score qualité
```

**Quand passer à ConvLSTM ?**
- Quand LSTM simple marche bien
- Quand vous avez données multi-stations
- Pour améliorer précision spatiale

---

### **ÉTAPE 5 : Entraîner le Modèle (2-4 heures)**

#### **🎯 Comprendre l'Entraînement**

**C'est quoi l'entraînement ?**
Processus itératif où le modèle **apprend** à partir des données en ajustant ses paramètres (poids).

**Analogie** : Comme apprendre à faire du vélo
- Au début : Beaucoup d'erreurs
- Avec pratique : De mieux en mieux
- À la fin : Automatique et précis

---

#### **📊 Split des Données**

**Pourquoi diviser ?**
Pour évaluer si le modèle **généralise** (marche sur nouvelles données).

**3 Ensembles** :

**1. Train Set (70%)**
- **Rôle** : Entraîner le modèle
- **Usage** : Le modèle apprend sur ces données
- **Exemple** : 7000 échantillons sur 10000

**2. Validation Set (15%)**
- **Rôle** : Ajuster hyperparamètres pendant entraînement
- **Usage** : Vérifier performance sans "tricher"
- **Exemple** : 1500 échantillons
- **Pourquoi séparé** : Éviter l'overfitting (sur-apprentissage)

**3. Test Set (15%)**
- **Rôle** : Évaluation finale
- **Usage** : Mesurer performance réelle
- **Exemple** : 1500 échantillons
- **Règle** : Jamais utilisé pendant entraînement !

**Outil** : `scikit-learn.train_test_split`

---

#### **🔁 Le Processus d'Entraînement**

**1. Epoch (Époque)**
- **C'est quoi** : Un passage complet sur toutes les données d'entraînement
- **Nombre typique** : 50-100 epochs
- **Pourquoi plusieurs** : Apprentissage progressif

**2. Batch (Lot)**
- **C'est quoi** : Groupe d'échantillons traités ensemble
- **Taille typique** : 16, 32 ou 64
- **Pourquoi batches** : Optimise mémoire GPU
- **Outil** : `torch.utils.data.DataLoader`

**3. Forward Pass (Passe avant)**
- **Étape** : Données → Modèle → Prédiction
- **Exemple** : Input pH/temp → Modèle → Prédiction qualité = 7.2

**4. Loss (Perte/Erreur)**
- **C'est quoi** : Mesure de l'erreur du modèle
- **Formule MSE** : `(prédiction - vérité)²`
- **Exemple** :
  - Prédiction : 7.2
  - Vérité : 7.5
  - Loss : (7.2 - 7.5)² = 0.09
- **Objectif** : Minimiser la loss

**5. Backward Pass (Rétropropagation)**
- **Étape** : Calculer gradients (dérivées)
- **Rôle** : Savoir comment ajuster poids
- **Outil** : `loss.backward()` (automatique PyTorch)

**6. Optimization (Optimisation)**
- **Étape** : Ajuster poids du modèle
- **Algorithme** : **Adam** (recommandé)
- **Paramètre clé** : **Learning Rate** (taux d'apprentissage)
  - **C'est quoi** : Taille des pas d'ajustement
  - **Valeur typique** : 0.001 ou 0.0001
  - **Trop grand** : Modèle instable
  - **Trop petit** : Apprentissage très lent

---

#### **📈 Monitoring de l'Entraînement**

**Métriques à surveiller** :

**1. Train Loss**
- **C'est quoi** : Erreur sur données d'entraînement
- **Évolution** : Doit diminuer régulièrement
- **Problème si** : Ne diminue pas → learning rate trop faible ou modèle trop simple

**2. Validation Loss**
- **C'est quoi** : Erreur sur données de validation
- **Évolution** : Doit suivre train loss
- **Problème si** : Augmente alors que train loss baisse → **Overfitting**

**Overfitting (Sur-apprentissage)** :
- **Problème** : Modèle "apprend par cœur" au lieu de généraliser
- **Symptôme** : Train loss ↓, Val loss ↑
- **Solutions** :
  - **Dropout** : Désactive aléatoirement des neurones
  - **Early Stopping** : Arrêter avant overfitting
  - **Régularisation L2** : Pénaliser poids trop grands
  - **Plus de données** : Augmenter dataset

---

#### **🔧 Techniques Avancées**

**1. Learning Rate Scheduler**
- **Rôle** : Réduire learning rate progressivement
- **Stratégie** : `ReduceLROnPlateau`
  - Si validation loss stagne → réduire LR
- **Pourquoi** : Affiner apprentissage en fin d'entraînement

**2. Early Stopping**
- **Rôle** : Arrêter si pas d'amélioration
- **Paramètre** : Patience (ex: 10 epochs)
- **Exemple** : Si val loss ne s'améliore pas pendant 10 epochs → stop

**3. Model Checkpointing**
- **Rôle** : Sauvegarder le meilleur modèle
- **Critère** : Meilleure validation loss
- **Pourquoi** : Garder le modèle optimal (pas le dernier)

---

#### **💾 Sauvegarde du Modèle**

**Format PyTorch** : `.pth` file

**Contenu sauvegardé** :
- **State dict** : Tous les poids du modèle
- **Optimizer state** : État de l'optimiseur (optionnel)
- **Hyperparamètres** : Architecture (pour charger plus tard)
- **Metrics** : Performances (MSE, MAE, etc.)

**Outil** : `torch.save()` et `torch.load()`

**Métadonnées à sauvegarder** (fichier JSON séparé) :
- Type de modèle
- Hyperparamètres (hidden_dim, num_layers, etc.)
- Performances (MSE, MAE, R²)
- Date d'entraînement
- Nom du dataset
- Nombre d'échantillons

---

### **ÉTAPE 6 : Créer l'API REST avec FastAPI (2-3 heures)**

#### **🌐 Comprendre les APIs REST**

**C'est quoi une API ?**
- **Application Programming Interface**
- Permet à des programmes de communiquer
- Comme un restaurant : menu (API) → commander (requête) → plat (réponse)

**REST (Representational State Transfer)** :
- Style d'architecture API
- Utilise HTTP (protocole web)
- Format JSON pour échanges
- Verbes : GET (lire), POST (créer), PUT (modifier), DELETE (supprimer)

---

#### **🔧 Pourquoi FastAPI ?**

**Avantages** :
- **Rapide** : Performance excellente
- **Modern** : Python 3.7+, async/await
- **Documentation auto** : Génère interface interactive (Swagger)
- **Validation** : Vérification automatique des données (Pydantic)
- **Type hints** : Code plus clair et sûr

**Alternative** : Flask (plus ancien, moins features)

---

#### **📡 Endpoints à Créer**

**1. GET /health**
- **Rôle** : Vérifier que le service fonctionne
- **Réponse** :
  ```json
  {
    "status": "healthy",
    "service": "stmodel",
    "model_loaded": true
  }
  ```
- **Usage** : Monitoring, Docker healthcheck

**2. GET /api/model/info**
- **Rôle** : Informations sur le modèle actuel
- **Réponse** :
  ```json
  {
    "model_type": "SimpleWaterQualityLSTM",
    "hidden_dim": 64,
    "test_mse": 0.34,
    "trained_on": "2025-10-27"
  }
  ```
- **Usage** : Debugging, traçabilité

**3. POST /api/predictions/create**
- **Rôle** : Créer une nouvelle prédiction
- **Input** : 24 dernières mesures
- **Output** : Prédiction qualité
- **Exemple input** :
  ```json
  {
    "measurements": [
      {
        "latitude": 33.5731,
        "longitude": -7.5898,
        "ph": 7.2,
        "temperature": 22.5,
        "turbidite": 12.3,
        "oxygene_dissous": 8.1,
        "chlorophylle": 0.8
      },
      ... (24 mesures)
    ],
    "horizon": 24
  }
  ```
- **Exemple output** :
  ```json
  {
    "prediction_id": "PRED_20251027140530",
    "qualite_score": 7.2,
    "qualite_categorie": "BONNE",
    "confiance": 0.85,
    "horizon_heures": 24,
    "timestamp": "2025-10-27T14:05:30"
  }
  ```

**4. GET /api/predictions/latest**
- **Rôle** : Récupérer dernières prédictions
- **Usage** : Dashboard, historique
- **Note** : Phase 1 = mock, Phase 2 = vraie DB

---

#### **🔐 Validation avec Pydantic**

**C'est quoi Pydantic ?**
- Bibliothèque de validation de données
- Définit **schémas** (structures attendues)
- Vérifie automatiquement les types
- Génère erreurs claires si problème

**Exemple : Schéma de Mesure**
```python
class WaterQualityMeasurement(BaseModel):
    latitude: float      # Doit être un nombre décimal
    longitude: float
    ph: float
    temperature: float
    ...
```

**Avantages** :
- Évite erreurs (ex: pH = "sept" → refusé)
- Documentation automatique
- Code plus sûr

---

#### **⚡ Chargement du Modèle au Démarrage**

**Problème** : Charger le modèle est lent (plusieurs secondes)

**Solution** : Charger **une seule fois** au démarrage du service

**Mécanisme** :
- **Startup event** : `@app.on_event("startup")`
- FastAPI exécute au lancement
- Modèle chargé en mémoire
- Prêt pour toutes les requêtes suivantes

**Avantages** :
- Requêtes très rapides (<100ms)
- Pas de rechargement à chaque appel

---

#### **🔍 Gestion des Erreurs**

**Types d'erreurs à gérer** :

**1. Erreur 400 : Bad Request**
- **Cause** : Données input invalides
- **Exemple** : Seulement 10 mesures au lieu de 24
- **Réponse** :
  ```json
  {
    "detail": "24 mesures requises, 10 fournies"
  }
  ```

**2. Erreur 503 : Service Unavailable**
- **Cause** : Modèle non chargé
- **Exemple** : Fichier .pth manquant
- **Réponse** :
  ```json
  {
    "detail": "Modèle non disponible"
  }
  ```

**3. Erreur 500 : Internal Server Error**
- **Cause** : Erreur inattendue
- **Exemple** : Bug dans le code
- **Action** : Logger l'erreur pour debugging

**Outil** : `FastAPI.HTTPException`

---

### **ÉTAPE 7 : Stockage en Base de Données (1-2 heures)**

#### **🗄️ Pourquoi PostgreSQL ?**

**C'est quoi PostgreSQL ?**
- Base de données relationnelle (SQL)
- Open source et robuste
- Très utilisé en production

**Avantages** :
- Stockage persistant (données sauvegardées)
- Requêtes complexes (SQL)
- Transactions (cohérence des données)
- PostGIS pour données géographiques (bonus)

**Votre base dédiée** : `predictions_db` (port 5434)

---

#### **📋 Tables à Créer**

**1. Table `ml_models`**
- **Rôle** : Historique des modèles entraînés
- **Colonnes** :
  - `id` : Identifiant unique
  - `name` : Nom du modèle (ex: "water_quality_v1")
  - `version` : Numéro de version
  - `architecture` : Type (LSTM, ConvLSTM)
  - `hyperparameters` : JSON avec config
  - `metrics` : JSON avec performances
  - `trained_at` : Date entraînement
  - `model_path` : Chemin fichier .pth
  - `is_active` : Booléen (modèle en production)

**2. Table `predictions`**
- **Rôle** : Toutes les prédictions effectuées
- **Colonnes** :
  - `id` : Identifiant unique
  - `prediction_id` : ID lisible (ex: PRED_20251027...)
  - `model_id` : Référence au modèle utilisé
  - `latitude` : Position GPS
  - `longitude` : Position GPS
  - `qualite_score` : Résultat (0-10)
  - `qualite_categorie` : EXCELLENTE/BONNE/MOYENNE/MAUVAISE
  - `confiance` : Score de confiance (0-1)
  - `horizon_heures` : Horizon de prédiction
  - `created_at` : Timestamp création
  - `input_data` : JSON avec données input (optionnel)

**3. Table `training_logs` (Optionnel)**
- **Rôle** : Historique d'entraînements
- **Colonnes** :
  - `id`
  - `model_id`
  - `epoch` : Numéro d'époque
  - `train_loss` : Loss train
  - `val_loss` : Loss validation
  - `timestamp`

---

#### **🔌 Connexion à la Base**

**Outil** : **SQLAlchemy** (ORM Python)

**C'est quoi un ORM ?**
- **Object-Relational Mapping**
- Manipuler base de données avec objets Python
- Pas besoin d'écrire SQL manuellement
- Plus sécurisé (évite injections SQL)

**Alternative** : `psycopg2` (connexion directe, plus bas niveau)

**Connection String** :
```
postgresql://predictions_user:predictions_pass_2025@db_predictions:5432/predictions_db
```
- `predictions_user` : Utilisateur
- `predictions_pass_2025` : Mot de passe
- `db_predictions` : Nom du container Docker
- `5432` : Port PostgreSQL (interne Docker)
- `predictions_db` : Nom de la base

---

#### **💾 Sauvegarder une Prédiction**

**Workflow** :
1. Recevoir requête API
2. Faire prédiction avec modèle
3. **Insérer en base de données**
4. Retourner réponse API

**Avantages stockage** :
- Historique complet
- Analyses rétrospectives
- Traçabilité
- Dashboard avec statistiques

---

### **ÉTAPE 8 : Communication avec Yassin via Redis (1 heure)**

#### **📢 Pourquoi Redis ?**

**C'est quoi Redis ?**
- Base de données **en mémoire** (très rapide)
- Système de **Pub/Sub** (Publication/Souscription)
- Comme une messagerie entre services

**Pub/Sub expliqué** :
- **Publisher** (Vous) : Publie messages
- **Channel** : Canal de communication (ex: "new_prediction")
- **Subscriber** (Yassin) : Écoute les messages

**Analogie** : Radio
- Vous = Station radio qui émet
- Canal = Fréquence (ex: 95.5 FM)
- Yassin = Auditeur qui écoute cette fréquence

---

#### **🔗 Workflow avec Yassin**

**1. Vous créez prédiction** → **2. Publiez sur Redis** → **3. Yassin reçoit** → **4. Crée alerte si besoin**

**Exemple concret** :
```
Votre prédiction : Qualité = MAUVAISE, Score = 3.2
  ↓
Publiez sur canal "new_prediction"
  ↓
Yassin écoute ce canal
  ↓
Yassin voit : Qualité mauvaise !
  ↓
Yassin crée alerte email/SMS
```

---

#### **📨 Format du Message**

**Canal** : `"new_prediction"`

**Message (JSON)** :
```json
{
  "prediction_id": "PRED_20251027140530",
  "zone": {
    "latitude": 33.5731,
    "longitude": -7.5898
  },
  "predictions": {
    "qualite_eau": "MAUVAISE",
    "score_qualite": 3.2,
    "ph_predit": 8.7,
    "risque_pollution": "ELEVE"
  },
  "confiance": 0.85,
  "timestamp": "2025-10-27T14:05:30",
  "horizon_heures": 24
}
```

---

#### **🔧 Outil : redis-py**

**C'est quoi** : Client Redis pour Python

**Installation** : `pip install redis`

**Usage** :
```python
import redis

# Connexion
r = redis.Redis(host='redis_queue', port=6379)

# Publier
r.publish('new_prediction', message_json)
```

**Avantages** :
- Asynchrone (non-bloquant)
- Très rapide (millisecondes)
- Découplage entre services

---

## 🔄 TRANSITION VERS PHASE 2

### **Quand Bilal a Terminé ses Services**

#### **Étape 2.1 : Vérifier APIs de Bilal (30 min)**

**Tests à faire** :

**1. API Capteurs**
```powershell
curl http://localhost:8001/api/capteurs/data/latest?hours=24
```
**Vérifier** :
- Retourne JSON avec liste de mesures
- Contient : pH, température, turbidité, oxygène
- Au moins 24 mesures disponibles
- Timestamps corrects

**2. API Satellite**
```powershell
curl "http://localhost:8002/api/satellite/indices/latest?latitude=33.5731&longitude=-7.5898"
```
**Vérifier** :
- Retourne indices calculés
- Contient : chlorophylle, turbidité satellite, température surface
- Données récentes (< 1 semaine)

---

#### **Étape 2.2 : Créer Client API (1 heure)**

**Rôle** : Module Python pour appeler APIs de Bilal

**Fichier** : `src/data/api_client.py`

**Fonctionnalités** :

**1. Récupérer Données Capteurs**
- **Méthode** : `get_capteurs_data(hours=24)`
- **Outil** : `requests` (HTTP client Python)
- **Gestion erreurs** :
  - Timeout (10 secondes)
  - Service indisponible → fallback
  - Retry avec backoff exponentiel

**2. Récupérer Données Satellite**
- **Méthode** : `get_satellite_data(lat, lon, radius_km=5)`
- **Paramètre radius** : Zone autour du point
- **Agrégation** : Moyenne si plusieurs valeurs

**3. Fusionner Données**
- **Méthode** : `combine_data(capteurs, satellite)`
- **Logique** :
  - Pour chaque mesure capteur
  - Ajouter indices satellite correspondants (même zone/temps)
  - Créer DataFrame complet
- **Outil** : `pandas` pour fusion

---

#### **Étape 2.3 : Adapter Service de Prédiction (30 min)**

**Modification** : `src/services/prediction_service.py`

**Ajout : Mode API**

**Configuration** (fichier `.env`) :
```bash
# Phase 1
USE_API_DATA=false

# Phase 2 (activer quand prêt)
USE_API_DATA=true
```

**Logique conditionnelle** :
```python
if USE_API_DATA:
    # Récupérer données via APIs Bilal
    data = api_client.get_data()
else:
    # Utiliser dataset local (Phase 1)
    data = load_from_csv()
```

**Avantage** :
- Changement transparent
- Pas de réécriture majeure
- Testable (switch on/off)

---

#### **Étape 2.4 : Tests d'Intégration (1 heure)**

**1. Test Unitaire**
- Vérifier que client API fonctionne
- Mock (simuler) réponses pour tests

**2. Test End-to-End**
- Requête API → Appel Bilal → Prédiction → Réponse
- Vérifier temps de réponse (< 2 secondes)

**3. Test de Charge (Optionnel)**
- Outil : `locust` ou `ab` (Apache Bench)
- Simuler 100 requêtes/seconde
- Vérifier stabilité

---

#### **Étape 2.5 : Ré-entraînement (Optionnel, 1 jour)**

**Pourquoi ré-entraîner ?**
- Dataset initial ≠ vraies données terrain
- Améliorer précision avec données réelles

**Processus** :

**1. Collecte Données Réelles**
- Lancer APIs pendant 1-2 semaines
- Stocker toutes les mesures
- Constituer nouveau dataset

**2. Comparaison**
- Dataset Phase 1 vs Données réelles
- Vérifier distributions similaires
- Identifier différences

**3. Ré-entraînement**
- Même processus que Phase 1
- Utiliser nouveau dataset
- Comparer performances

**4. A/B Testing (Avancé)**
- Modèle v1 (Phase 1) sur 50% trafic
- Modèle v2 (Phase 2) sur 50% trafic
- Comparer précision
- Garder le meilleur

---

## ✅ RÉCAPITULATIF DES ÉTAPES RECOMMANDÉES

### **PHASE 1 (2 semaines)**

| Étape | Durée | Priorité |
|-------|-------|----------|
| 1. Télécharger dataset Kaggle | 30 min | ⭐⭐⭐ |
| 2. Explorer données (Jupyter) | 1-2h | ⭐⭐⭐ |
| 3. Prétraitement (nettoyage + normalisation) | 2-3h | ⭐⭐⭐ |
| 4. Modèle LSTM simple | 3-4h | ⭐⭐⭐ |
| 5. Entraînement | 2-4h | ⭐⭐⭐ |
| 6. API FastAPI | 2-3h | ⭐⭐⭐ |
| 7. Stockage PostgreSQL | 1-2h | ⭐⭐ |
| 8. Communication Redis | 1h | ⭐⭐ |

**Total** : ~15-20 heures de travail

---

### **PHASE 2 (2 jours)**

| Étape | Durée | Priorité |
|-------|-------|----------|
| 1. Tester APIs Bilal | 30 min | ⭐⭐⭐ |
| 2. Client API | 1h | ⭐⭐⭐ |
| 3. Adapter service | 30 min | ⭐⭐⭐ |
| 4. Tests intégration | 1h | ⭐⭐⭐ |
| 5. Ré-entraînement (optionnel) | 1 jour | ⭐ |

---

## 🎯 CONSEILS FINAUX

### **Pour Débuter**

1. ✅ **Commencez simple** : LSTM avant ConvLSTM
2. ✅ **Testez souvent** : Après chaque étape
3. ✅ **Logs partout** : Pour comprendre ce qui se passe
4. ✅ **Git régulièrement** : Commit après chaque fonctionnalité
5. ✅ **Documentation** : Notez vos décisions et résultats

### **Priorités**

**Semaine 1** :
- Dataset + Exploration + Prétraitement
- Modèle LSTM simple qui tourne

**Semaine 2** :
- Entraînement + Optimisation
- API fonctionnelle
- Intégration DB et Redis

**Après** :
- Améliorer modèle (ConvLSTM)
- Optimiser performances
- Monitoring et logging

---

## 🆘 RÉSOLUTION PROBLÈMES

### **Dataset ne télécharge pas**
- Vérifier token Kaggle dans bon dossier
- Vérifier connexion Internet
- Essayer téléchargement manuel

### **Modèle ne converge pas**
- Réduire learning rate (0.001 → 0.0001)
- Vérifier normalisation des données
- Simplifier architecture (moins de couches)
- Augmenter nombre d'epochs

### **API ne répond pas**
- Vérifier modèle chargé au startup
- Vérifier logs Docker : `docker compose logs -f service_stmodel`
- Tester health endpoint d'abord

### **Erreur mémoire (Out of Memory)**
- Réduire batch size (32 → 16)
- Réduire taille modèle (hidden_dim: 64 → 32)
- Utiliser CPU si GPU insuffisant

---

**🚀 Bonne chance ! Vous avez tout pour réussir ! 🌊**

---

## 📁 STRUCTURE DU PROJET

```
services/service_stmodel/
│
├── src/
│   ├── main.py                      # Point d'entrée FastAPI
│   ├── config.py                    # Configuration (DB, Redis, URLs)
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py            # Connexion PostgreSQL
│   │   └── models.py                # Tables SQL (predictions, models)
│   │
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── convlstm.py              # Architecture ConvLSTM PyTorch
│   │   ├── train.py                 # Script entraînement
│   │   ├── predict.py               # Service de prédiction
│   │   └── preprocessing.py         # Nettoyage et normalisation
│   │
│   ├── data/
│   │   ├── __init__.py
│   │   ├── data_loader.py           # PHASE 1 : Charger dataset externe
│   │   └── api_client.py            # PHASE 2 : Appeler APIs Bilal
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── prediction_service.py    # Logique prédiction
│   │   └── redis_publisher.py       # Publier vers Yassin
│   │
│   └── api/
│       ├── __init__.py
│       └── routes.py                # Endpoints REST
│
├── data/                            # Datasets pour Phase 1
│   ├── raw/                         # Données brutes téléchargées
│   ├── processed/                   # Données nettoyées
│   └── README.md                    # Documentation datasets
│
├── models/                          # Modèles entraînés
│   ├── convlstm_v1.pth             # Modèle Phase 1
│   ├── convlstm_v2.pth             # Modèle Phase 2 (avec APIs)
│   └── model_info.json             # Métadonnées (précision, etc.)
│
├── notebooks/                       # Jupyter pour exploration
│   ├── 01_data_exploration.ipynb   # Analyser dataset
│   ├── 02_model_training.ipynb     # Entraîner modèle
│   └── 03_evaluation.ipynb         # Tester performance
│
├── tests/
│   ├── test_api.py                 # Tests API
│   ├── test_model.py               # Tests modèle
│   └── test_data.py                # Tests chargement données
│
├── scripts/
│   ├── download_dataset.py         # Télécharger données Kaggle
│   ├── train_model.sh              # Lancer entraînement
│   └── test_api.sh                 # Tester endpoints
│
├── Dockerfile
├── requirements.txt
├── README.md
└── GUIDE.md                         # Ce fichier
```

---

## 🔥 PHASE 1 : ENTRAÎNEMENT AVEC DATASET EXTERNE

### **Étape 1.1 : Télécharger un dataset (30 min)**

#### **Option A : Kaggle (Recommandé)**

1. **Installer Kaggle CLI**
```powershell
pip install kaggle
```

2. **Configurer API Token**
   - Aller sur : https://www.kaggle.com/settings
   - Créer un token API → Télécharger `kaggle.json`
   - Placer dans : `C:\Users\Hamza\.kaggle\kaggle.json`

3. **Télécharger dataset**
```powershell
cd services/service_stmodel
kaggle datasets download -d adityakadiwal/water-potability -p data/raw --unzip
```

#### **Option B : Données simulées (Plus rapide pour débuter)**

**Créer `scripts/generate_synthetic_data.py`**

```python
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_water_quality_data(n_samples=10000):
    """
    Génère des données synthétiques de qualité de l'eau
    avec patterns temporels et spatiaux
    """
    
    np.random.seed(42)
    
    # Timestamps (1 an de données, mesures toutes les heures)
    start_date = datetime(2024, 1, 1)
    timestamps = [start_date + timedelta(hours=i) for i in range(n_samples)]
    
    # Localisations (Casablanca région)
    latitudes = np.random.uniform(33.4, 33.7, n_samples)
    longitudes = np.random.uniform(-7.8, -7.4, n_samples)
    
    # Paramètres avec patterns réalistes
    # pH : normale autour de 7.5, varie avec température
    ph = np.random.normal(7.5, 0.5, n_samples)
    
    # Température : saisonnalité
    temps = np.arange(n_samples)
    temperature = 20 + 5 * np.sin(2 * np.pi * temps / (365*24)) + np.random.normal(0, 2, n_samples)
    
    # Turbidité : pics après pluie (simulé)
    turbidite = np.abs(np.random.gamma(2, 3, n_samples))
    
    # Oxygène dissous : inversement corrélé à température
    oxygene = 10 - 0.15 * temperature + np.random.normal(0, 0.5, n_samples)
    
    # Chlorophylle : corrélée à température (algues)
    chlorophylle = np.maximum(0, 0.2 * temperature - 2 + np.random.normal(0, 0.5, n_samples))
    
    # Score qualité (0-10, 10 = excellente)
    qualite = (
        0.3 * (10 - np.abs(ph - 7.5) * 4) +  # pH optimal = 7.5
        0.2 * (10 - turbidite / 5) +          # Moins de turbidité = mieux
        0.3 * (oxygene / 1.2) +               # Plus d'oxygène = mieux
        0.2 * (10 - chlorophylle)             # Moins de chlorophylle = mieux
    )
    qualite = np.clip(qualite, 0, 10)
    
    # Créer DataFrame
    df = pd.DataFrame({
        'timestamp': timestamps,
        'latitude': latitudes,
        'longitude': longitudes,
        'ph': ph,
        'temperature': temperature,
        'turbidite': turbidite,
        'oxygene_dissous': oxygene,
        'chlorophylle': chlorophylle,
        'qualite_score': qualite
    })
    
    return df

if __name__ == "__main__":
    print("🌊 Génération de données synthétiques...")
    df = generate_water_quality_data(10000)
    
    # Sauvegarder
    df.to_csv('data/raw/synthetic_water_quality.csv', index=False)
    print(f"✅ {len(df)} échantillons générés dans data/raw/synthetic_water_quality.csv")
    print(f"\n📊 Aperçu des données :")
    print(df.head())
    print(f"\n📈 Statistiques :")
    print(df.describe())
```

**Lancer le script**
```powershell
cd services/service_stmodel
python scripts/generate_synthetic_data.py
```

---

### **Étape 1.2 : Exploration des données (1h)**

**Créer `notebooks/01_data_exploration.ipynb`**

```python
# Cellule 1 : Imports
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Cellule 2 : Charger données
df = pd.read_csv('../data/raw/synthetic_water_quality.csv')
print(f"📊 Dataset shape: {df.shape}")
df.head()

# Cellule 3 : Vérifier valeurs manquantes
print("❓ Valeurs manquantes :")
print(df.isnull().sum())

# Cellule 4 : Statistiques descriptives
df.describe()

# Cellule 5 : Distribution des paramètres
fig, axes = plt.subplots(2, 4, figsize=(16, 8))
parameters = ['ph', 'temperature', 'turbidite', 'oxygene_dissous', 
              'chlorophylle', 'qualite_score']

for i, param in enumerate(parameters):
    ax = axes[i // 4, i % 4]
    df[param].hist(bins=50, ax=ax)
    ax.set_title(f'Distribution {param}')
    ax.set_xlabel(param)
    
plt.tight_layout()
plt.show()

# Cellule 6 : Corrélations
plt.figure(figsize=(10, 8))
correlation = df[parameters].corr()
sns.heatmap(correlation, annot=True, cmap='coolwarm', center=0)
plt.title('Matrice de corrélation')
plt.show()

# Cellule 7 : Évolution temporelle
df['timestamp'] = pd.to_datetime(df['timestamp'])
df.set_index('timestamp').resample('D')['qualite_score'].mean().plot(figsize=(15, 5))
plt.title('Évolution qualité de l\'eau dans le temps')
plt.ylabel('Score qualité')
plt.show()
```

---

### **Étape 1.3 : Préparation des données (2h)**

**Créer `src/ml/preprocessing.py`**

```python
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler, StandardScaler
import torch

class WaterQualityPreprocessor:
    """
    Prépare les données pour le modèle ConvLSTM
    """
    
    def __init__(self, sequence_length=24):
        """
        Args:
            sequence_length: Nombre de pas de temps pour séquences (ex: 24h)
        """
        self.sequence_length = sequence_length
        self.scaler = MinMaxScaler()
        self.feature_columns = None
        
    def prepare_data(self, df):
        """
        Nettoie et normalise les données
        
        Args:
            df: DataFrame avec colonnes timestamp, lat, lon, paramètres
            
        Returns:
            X: Features normalisées
            y: Target (qualité à prédire)
        """
        # 1. Trier par temps
        df = df.sort_values('timestamp').reset_index(drop=True)
        
        # 2. Gérer valeurs manquantes
        df = df.fillna(df.mean(numeric_only=True))
        
        # 3. Sélectionner features
        self.feature_columns = ['latitude', 'longitude', 'ph', 'temperature', 
                                'turbidite', 'oxygene_dissous', 'chlorophylle']
        
        # 4. Normaliser (0-1)
        X = self.scaler.fit_transform(df[self.feature_columns])
        
        # 5. Target = qualité
        y = df['qualite_score'].values
        
        return X, y
    
    def create_sequences(self, X, y, horizon=24):
        """
        Crée des séquences temporelles pour ConvLSTM
        
        Args:
            X: Features (n_samples, n_features)
            y: Targets (n_samples,)
            horizon: Horizon de prédiction en heures
            
        Returns:
            X_seq: (n_sequences, sequence_length, n_features)
            y_seq: (n_sequences,) - qualité à horizon
        """
        X_sequences = []
        y_sequences = []
        
        for i in range(len(X) - self.sequence_length - horizon):
            # Séquence passée (24h par exemple)
            X_seq = X[i:i + self.sequence_length]
            
            # Target = qualité à l'horizon (24h dans le futur)
            y_target = y[i + self.sequence_length + horizon - 1]
            
            X_sequences.append(X_seq)
            y_sequences.append(y_target)
        
        X_sequences = np.array(X_sequences)
        y_sequences = np.array(y_sequences)
        
        return X_sequences, y_sequences
    
    def to_torch(self, X, y):
        """Convertit numpy arrays en tensors PyTorch"""
        X_torch = torch.FloatTensor(X)
        y_torch = torch.FloatTensor(y)
        return X_torch, y_torch
    
    def create_spatial_grid(self, X, grid_size=10):
        """
        Transforme données en grille spatiale pour ConvLSTM
        
        Args:
            X: (n_sequences, sequence_length, n_features)
            grid_size: Taille de la grille (10x10 par exemple)
            
        Returns:
            X_grid: (n_sequences, sequence_length, n_features, grid_size, grid_size)
        """
        # TODO: Implémenter interpolation spatiale
        # Pour l'instant, duplication simple (à améliorer)
        n_seq, seq_len, n_feat = X.shape
        X_grid = np.zeros((n_seq, seq_len, n_feat, grid_size, grid_size))
        
        for i in range(n_seq):
            for t in range(seq_len):
                # Remplir grille avec valeur moyenne (simplifié)
                X_grid[i, t, :, :, :] = X[i, t, :, np.newaxis, np.newaxis]
        
        return X_grid

# Exemple d'utilisation
if __name__ == "__main__":
    # Charger données
    df = pd.read_csv('../../data/raw/synthetic_water_quality.csv')
    
    # Préprocesseur
    preprocessor = WaterQualityPreprocessor(sequence_length=24)
    
    # Préparer
    X, y = preprocessor.prepare_data(df)
    print(f"✅ Features shape: {X.shape}")
    print(f"✅ Target shape: {y.shape}")
    
    # Créer séquences
    X_seq, y_seq = preprocessor.create_sequences(X, y, horizon=24)
    print(f"✅ Sequences shape: {X_seq.shape}")
    print(f"✅ Targets shape: {y_seq.shape}")
    
    # Convertir PyTorch
    X_torch, y_torch = preprocessor.to_torch(X_seq, y_seq)
    print(f"✅ PyTorch tensors créés")
```

---

### **Étape 1.4 : Modèle ConvLSTM (3-4h)**

**Créer `src/ml/convlstm.py`**

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ConvLSTMCell(nn.Module):
    """
    Cellule ConvLSTM : combine LSTM (temporel) + CNN (spatial)
    """
    
    def __init__(self, input_dim, hidden_dim, kernel_size, bias=True):
        """
        Args:
            input_dim: Nombre de channels input
            hidden_dim: Nombre de channels hidden state
            kernel_size: Taille du kernel convolutionnel
        """
        super(ConvLSTMCell, self).__init__()
        
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.kernel_size = kernel_size
        self.padding = kernel_size // 2
        self.bias = bias
        
        # Gates : input, forget, cell, output
        self.conv = nn.Conv2d(
            in_channels=self.input_dim + self.hidden_dim,
            out_channels=4 * self.hidden_dim,
            kernel_size=self.kernel_size,
            padding=self.padding,
            bias=self.bias
        )
    
    def forward(self, input_tensor, cur_state):
        """
        Args:
            input_tensor: (batch, input_dim, height, width)
            cur_state: (h_cur, c_cur) - hidden et cell states
            
        Returns:
            h_next, c_next: Nouveaux états
        """
        h_cur, c_cur = cur_state
        
        # Concaténer input et hidden state
        combined = torch.cat([input_tensor, h_cur], dim=1)
        
        # Appliquer convolution
        combined_conv = self.conv(combined)
        
        # Séparer les 4 gates
        cc_i, cc_f, cc_o, cc_g = torch.split(combined_conv, self.hidden_dim, dim=1)
        
        # Calcul des gates (formules LSTM)
        i = torch.sigmoid(cc_i)  # Input gate
        f = torch.sigmoid(cc_f)  # Forget gate
        o = torch.sigmoid(cc_o)  # Output gate
        g = torch.tanh(cc_g)     # Cell gate
        
        # Nouveau cell state
        c_next = f * c_cur + i * g
        
        # Nouveau hidden state
        h_next = o * torch.tanh(c_next)
        
        return h_next, c_next
    
    def init_hidden(self, batch_size, image_size):
        """Initialise les états à zéro"""
        height, width = image_size
        return (
            torch.zeros(batch_size, self.hidden_dim, height, width, 
                       device=self.conv.weight.device),
            torch.zeros(batch_size, self.hidden_dim, height, width,
                       device=self.conv.weight.device)
        )


class WaterQualityConvLSTM(nn.Module):
    """
    Modèle complet pour prédiction qualité de l'eau
    """
    
    def __init__(self, input_dim=7, hidden_dims=[64, 32], 
                 kernel_size=3, num_layers=2):
        """
        Args:
            input_dim: Nombre de features (lat, lon, ph, temp, etc.)
            hidden_dims: Liste des dimensions hidden pour chaque couche
            kernel_size: Taille kernel convolutionnel
            num_layers: Nombre de couches ConvLSTM
        """
        super(WaterQualityConvLSTM, self).__init__()
        
        self.input_dim = input_dim
        self.hidden_dims = hidden_dims
        self.kernel_size = kernel_size
        self.num_layers = num_layers
        
        # Créer couches ConvLSTM
        cell_list = []
        for i in range(num_layers):
            cur_input_dim = input_dim if i == 0 else hidden_dims[i - 1]
            cell_list.append(
                ConvLSTMCell(
                    input_dim=cur_input_dim,
                    hidden_dim=hidden_dims[i],
                    kernel_size=kernel_size
                )
            )
        
        self.cell_list = nn.ModuleList(cell_list)
        
        # Couche de sortie (prédiction qualité)
        self.output = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),  # Global pooling
            nn.Flatten(),
            nn.Linear(hidden_dims[-1], 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 1)  # Prédiction qualité (score 0-10)
        )
    
    def forward(self, x):
        """
        Args:
            x: (batch, seq_len, input_dim, height, width)
            
        Returns:
            pred: (batch, 1) - Score qualité prédit
        """
        batch_size, seq_len, _, height, width = x.size()
        
        # Initialiser états cachés
        hidden_states = []
        for i in range(self.num_layers):
            hidden_states.append(
                self.cell_list[i].init_hidden(batch_size, (height, width))
            )
        
        # Passer séquence temporelle
        for t in range(seq_len):
            x_t = x[:, t, :, :, :]  # Frame au temps t
            
            for layer_idx in range(self.num_layers):
                # Input de cette couche
                if layer_idx == 0:
                    input_t = x_t
                else:
                    input_t = hidden_states[layer_idx - 1][0]
                
                # Passer par ConvLSTMCell
                h, c = self.cell_list[layer_idx](input_t, hidden_states[layer_idx])
                hidden_states[layer_idx] = (h, c)
        
        # Dernière hidden state de dernière couche
        last_hidden = hidden_states[-1][0]
        
        # Prédiction
        pred = self.output(last_hidden)
        
        return pred


# VERSION SIMPLIFIÉE pour débuter (sans grille spatiale)
class SimpleWaterQualityLSTM(nn.Module):
    """
    Version simplifiée : LSTM classique sans convolutions
    Plus facile pour débuter !
    """
    
    def __init__(self, input_dim=7, hidden_dim=64, num_layers=2):
        super(SimpleWaterQualityLSTM, self).__init__()
        
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2
        )
        
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, 1)
        )
    
    def forward(self, x):
        """
        Args:
            x: (batch, seq_len, input_dim)
        Returns:
            pred: (batch, 1)
        """
        # LSTM
        lstm_out, _ = self.lstm(x)
        
        # Dernière sortie temporelle
        last_output = lstm_out[:, -1, :]
        
        # Prédiction
        pred = self.fc(last_output)
        
        return pred


# Test du modèle
if __name__ == "__main__":
    # Test version simple
    model_simple = SimpleWaterQualityLSTM(input_dim=7, hidden_dim=64)
    x_simple = torch.randn(8, 24, 7)  # batch=8, seq=24h, features=7
    pred_simple = model_simple(x_simple)
    print(f"✅ Simple LSTM output: {pred_simple.shape}")  # (8, 1)
    
    # Test ConvLSTM complet
    model_conv = WaterQualityConvLSTM(input_dim=7, hidden_dims=[64, 32])
    x_conv = torch.randn(8, 24, 7, 10, 10)  # avec grille spatiale 10x10
    pred_conv = model_conv(x_conv)
    print(f"✅ ConvLSTM output: {pred_conv.shape}")  # (8, 1)
```

---

### **Étape 1.5 : Entraînement (2-3h)**

**Créer `src/ml/train.py`**

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import json
from datetime import datetime

from preprocessing import WaterQualityPreprocessor
from convlstm import SimpleWaterQualityLSTM, WaterQualityConvLSTM


class WaterQualityTrainer:
    """
    Classe pour entraîner les modèles
    """
    
    def __init__(self, model, device='cuda' if torch.cuda.is_available() else 'cpu'):
        self.model = model.to(device)
        self.device = device
        self.history = {'train_loss': [], 'val_loss': []}
    
    def train(self, train_loader, val_loader, epochs=50, lr=0.001):
        """
        Entraîne le modèle
        
        Args:
            train_loader: DataLoader train
            val_loader: DataLoader validation
            epochs: Nombre d'époques
            lr: Learning rate
        """
        criterion = nn.MSELoss()
        optimizer = optim.Adam(self.model.parameters(), lr=lr)
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode='min', patience=5, factor=0.5
        )
        
        best_val_loss = float('inf')
        
        for epoch in range(epochs):
            # TRAIN
            self.model.train()
            train_loss = 0.0
            
            for batch_X, batch_y in train_loader:
                batch_X = batch_X.to(self.device)
                batch_y = batch_y.to(self.device)
                
                # Forward
                optimizer.zero_grad()
                predictions = self.model(batch_X).squeeze()
                loss = criterion(predictions, batch_y)
                
                # Backward
                loss.backward()
                optimizer.step()
                
                train_loss += loss.item()
            
            train_loss /= len(train_loader)
            
            # VALIDATION
            self.model.eval()
            val_loss = 0.0
            
            with torch.no_grad():
                for batch_X, batch_y in val_loader:
                    batch_X = batch_X.to(self.device)
                    batch_y = batch_y.to(self.device)
                    
                    predictions = self.model(batch_X).squeeze()
                    loss = criterion(predictions, batch_y)
                    val_loss += loss.item()
            
            val_loss /= len(val_loader)
            
            # Historique
            self.history['train_loss'].append(train_loss)
            self.history['val_loss'].append(val_loss)
            
            # Learning rate scheduling
            scheduler.step(val_loss)
            
            # Affichage
            if (epoch + 1) % 5 == 0:
                print(f"Epoch {epoch+1}/{epochs} - "
                      f"Train Loss: {train_loss:.4f} - "
                      f"Val Loss: {val_loss:.4f}")
            
            # Sauvegarder meilleur modèle
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                self.save_model('../../models/best_model.pth')
        
        print(f"\n✅ Entraînement terminé ! Meilleure val_loss: {best_val_loss:.4f}")
    
    def save_model(self, path):
        """Sauvegarde le modèle"""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'history': self.history
        }, path)
    
    def load_model(self, path):
        """Charge le modèle"""
        checkpoint = torch.load(path)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.history = checkpoint.get('history', {})
    
    def plot_history(self):
        """Affiche courbes d'apprentissage"""
        plt.figure(figsize=(10, 6))
        plt.plot(self.history['train_loss'], label='Train Loss')
        plt.plot(self.history['val_loss'], label='Validation Loss')
        plt.xlabel('Epoch')
        plt.ylabel('Loss (MSE)')
        plt.title('Courbes d\'apprentissage')
        plt.legend()
        plt.grid(True)
        plt.savefig('../../models/training_history.png')
        plt.show()


def main():
    """
    Script principal d'entraînement
    """
    print("🚀 Début de l'entraînement du modèle...")
    
    # 1. Charger données
    print("\n📊 Chargement des données...")
    df = pd.read_csv('../../data/raw/synthetic_water_quality.csv')
    print(f"✅ {len(df)} échantillons chargés")
    
    # 2. Préprocessing
    print("\n🔄 Prétraitement des données...")
    preprocessor = WaterQualityPreprocessor(sequence_length=24)
    X, y = preprocessor.prepare_data(df)
    X_seq, y_seq = preprocessor.create_sequences(X, y, horizon=24)
    print(f"✅ {len(X_seq)} séquences créées")
    
    # 3. Split train/val/test
    X_train, X_temp, y_train, y_temp = train_test_split(
        X_seq, y_seq, test_size=0.3, random_state=42
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42
    )
    
    print(f"✅ Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    
    # 4. Convertir en tensors PyTorch
    X_train_t = torch.FloatTensor(X_train)
    y_train_t = torch.FloatTensor(y_train)
    X_val_t = torch.FloatTensor(X_val)
    y_val_t = torch.FloatTensor(y_val)
    
    # 5. DataLoaders
    train_dataset = TensorDataset(X_train_t, y_train_t)
    val_dataset = TensorDataset(X_val_t, y_val_t)
    
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
    
    # 6. Créer modèle
    print("\n🧠 Création du modèle...")
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"✅ Device: {device}")
    
    model = SimpleWaterQualityLSTM(
        input_dim=7,
        hidden_dim=64,
        num_layers=2
    )
    
    # 7. Entraîner
    print("\n🏋️ Entraînement...")
    trainer = WaterQualityTrainer(model, device=device)
    trainer.train(train_loader, val_loader, epochs=50, lr=0.001)
    
    # 8. Visualiser
    print("\n📈 Génération des graphiques...")
    trainer.plot_history()
    
    # 9. Évaluation finale
    print("\n🎯 Évaluation sur test set...")
    model.eval()
    X_test_t = torch.FloatTensor(X_test).to(device)
    y_test_t = torch.FloatTensor(y_test).to(device)
    
    with torch.no_grad():
        predictions = model(X_test_t).squeeze().cpu().numpy()
    
    test_mse = np.mean((predictions - y_test) ** 2)
    test_mae = np.mean(np.abs(predictions - y_test))
    
    print(f"✅ Test MSE: {test_mse:.4f}")
    print(f"✅ Test MAE: {test_mae:.4f}")
    
    # 10. Sauvegarder métadonnées
    model_info = {
        'model_type': 'SimpleWaterQualityLSTM',
        'input_dim': 7,
        'hidden_dim': 64,
        'num_layers': 2,
        'sequence_length': 24,
        'horizon': 24,
        'test_mse': float(test_mse),
        'test_mae': float(test_mae),
        'trained_on': datetime.now().isoformat(),
        'dataset': 'synthetic_water_quality',
        'n_samples': len(df)
    }
    
    with open('../../models/model_info.json', 'w') as f:
        json.dump(model_info, f, indent=2)
    
    print("\n✅ Entraînement terminé avec succès !")
    print(f"📁 Modèle sauvegardé dans models/best_model.pth")


if __name__ == "__main__":
    main()
```

**Lancer l'entraînement**
```powershell
cd services/service_stmodel
python src/ml/train.py
```

---

### **Étape 1.6 : API avec modèle entraîné (2h)**

**Créer `src/main.py`**

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import numpy as np
import json
from typing import List, Optional
from datetime import datetime

# Imports locaux (à adapter selon structure)
from ml.convlstm import SimpleWaterQualityLSTM
from ml.preprocessing import WaterQualityPreprocessor

# Initialiser FastAPI
app = FastAPI(
    title="AquaWatch STModel API",
    description="API de prédiction de la qualité de l'eau avec modèles spatio-temporels",
    version="1.0.0"
)

# Charger le modèle au démarrage
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = None
model_info = None
preprocessor = WaterQualityPreprocessor(sequence_length=24)

@app.on_event("startup")
async def load_model():
    """Charge le modèle entraîné au démarrage"""
    global model, model_info
    
    try:
        # Charger métadonnées
        with open('../models/model_info.json', 'r') as f:
            model_info = json.load(f)
        
        # Créer modèle
        model = SimpleWaterQualityLSTM(
            input_dim=model_info['input_dim'],
            hidden_dim=model_info['hidden_dim'],
            num_layers=model_info['num_layers']
        )
        
        # Charger poids
        checkpoint = torch.load('../models/best_model.pth', map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        model.to(device)
        model.eval()
        
        print(f"✅ Modèle chargé avec succès ! MSE: {model_info['test_mse']:.4f}")
    except Exception as e:
        print(f"⚠️ Erreur chargement modèle: {e}")
        print("ℹ️ L'API fonctionnera en mode dégradé")


# Schémas Pydantic
class WaterQualityMeasurement(BaseModel):
    latitude: float
    longitude: float
    ph: float
    temperature: float
    turbidite: float
    oxygene_dissous: float
    chlorophylle: float

class PredictionRequest(BaseModel):
    measurements: List[WaterQualityMeasurement]  # 24 dernières heures
    horizon: int = 24  # Horizon de prédiction en heures

class PredictionResponse(BaseModel):
    prediction_id: str
    qualite_score: float
    qualite_categorie: str  # EXCELLENTE, BONNE, MOYENNE, MAUVAISE
    confiance: float
    horizon_heures: int
    timestamp: str


# Routes API
@app.get("/")
async def root():
    """Page d'accueil de l'API"""
    return {
        "service": "STModel - Prédiction qualité de l'eau",
        "version": "1.0.0",
        "status": "operational",
        "model_loaded": model is not None
    }

@app.get("/health")
async def health():
    """Vérification santé du service"""
    return {
        "status": "healthy",
        "service": "stmodel",
        "pytorch_version": torch.__version__,
        "device": device,
        "model_loaded": model is not None
    }

@app.get("/api/model/info")
async def get_model_info():
    """Informations sur le modèle actuel"""
    if model_info is None:
        raise HTTPException(status_code=503, detail="Modèle non chargé")
    
    return model_info

@app.post("/api/predictions/create", response_model=PredictionResponse)
async def create_prediction(request: PredictionRequest):
    """
    Crée une nouvelle prédiction de qualité de l'eau
    
    Nécessite 24 dernières mesures pour prédire la qualité future
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Modèle non disponible")
    
    if len(request.measurements) < 24:
        raise HTTPException(
            status_code=400, 
            detail=f"24 mesures requises, {len(request.measurements)} fournies"
        )
    
    try:
        # 1. Convertir en array numpy
        features = []
        for m in request.measurements[-24:]:  # 24 dernières
            features.append([
                m.latitude, m.longitude, m.ph, m.temperature,
                m.turbidite, m.oxygene_dissous, m.chlorophylle
            ])
        
        X = np.array(features)
        
        # 2. Normaliser
        X_normalized = preprocessor.scaler.fit_transform(X)
        
        # 3. Convertir en tensor
        X_tensor = torch.FloatTensor(X_normalized).unsqueeze(0).to(device)
        
        # 4. Prédiction
        with torch.no_grad():
            pred_score = model(X_tensor).item()
        
        # 5. Catégoriser
        if pred_score >= 8:
            categorie = "EXCELLENTE"
            confiance = 0.9
        elif pred_score >= 6:
            categorie = "BONNE"
            confiance = 0.85
        elif pred_score >= 4:
            categorie = "MOYENNE"
            confiance = 0.8
        else:
            categorie = "MAUVAISE"
            confiance = 0.75
        
        # 6. Réponse
        return PredictionResponse(
            prediction_id=f"PRED_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            qualite_score=round(pred_score, 2),
            qualite_categorie=categorie,
            confiance=confiance,
            horizon_heures=request.horizon,
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur prédiction: {str(e)}")


@app.get("/api/predictions/latest")
async def get_latest_predictions():
    """
    Retourne les dernières prédictions (mock pour Phase 1)
    """
    # TODO: Récupérer depuis la base de données
    return {
        "predictions": [
            {
                "prediction_id": "PRED001",
                "qualite_score": 7.2,
                "qualite_categorie": "BONNE",
                "timestamp": "2025-10-27T10:00:00"
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Tester l'API**
```powershell
# Démarrer
cd services/service_stmodel
python src/main.py

# Tester health
curl http://localhost:8000/health

# Tester infos modèle
curl http://localhost:8000/api/model/info
```

---

## 🔄 PHASE 2 : INTÉGRATION AVEC APIs DE BILAL

### **Étape 2.1 : Client API pour Bilal (1h)**

**Créer `src/data/api_client.py`**

```python
import requests
from typing import List, Dict, Optional
import pandas as pd
from datetime import datetime, timedelta

class BilalAPIClient:
    """
    Client pour récupérer données depuis les services de Bilal
    """
    
    def __init__(self, capteurs_url="http://service_capteurs:8000", 
                 satellite_url="http://service_satellite:8000"):
        self.capteurs_url = capteurs_url
        self.satellite_url = satellite_url
    
    def get_capteurs_data(self, hours=24) -> List[Dict]:
        """
        Récupère données capteurs des dernières heures
        
        Args:
            hours: Nombre d'heures à récupérer
            
        Returns:
            Liste de mesures capteurs
        """
        try:
            response = requests.get(
                f"{self.capteurs_url}/api/capteurs/data/latest",
                params={"hours": hours},
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            return data.get('capteurs', [])
        
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Erreur API Capteurs: {e}")
            return []
    
    def get_satellite_data(self, latitude: float, longitude: float, 
                          radius_km: float = 5) -> Dict:
        """
        Récupère indices satellite pour une zone
        
        Args:
            latitude: Latitude centre
            longitude: Longitude centre
            radius_km: Rayon de recherche
            
        Returns:
            Indices satellites (chlorophylle, turbidité, etc.)
        """
        try:
            response = requests.get(
                f"{self.satellite_url}/api/satellite/indices/latest",
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "radius_km": radius_km
                },
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            return data.get('indices', {})
        
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Erreur API Satellite: {e}")
            return {}
    
    def combine_data(self, capteurs_data: List[Dict], 
                     satellite_data: Dict) -> pd.DataFrame:
        """
        Fusionne données capteurs + satellite
        
        Returns:
            DataFrame avec toutes les features
        """
        # Convertir capteurs en DataFrame
        df_capteurs = pd.DataFrame(capteurs_data)
        
        # Ajouter données satellite
        if satellite_data:
            for key, value in satellite_data.items():
                df_capteurs[key] = value
        
        return df_capteurs


# Exemple d'utilisation
if __name__ == "__main__":
    client = BilalAPIClient()
    
    # Récupérer données
    capteurs = client.get_capteurs_data(hours=24)
    print(f"✅ {len(capteurs)} mesures capteurs récupérées")
    
    if capteurs:
        # Récupérer satellite pour première mesure
        first_measure = capteurs[0]
        satellite = client.get_satellite_data(
            latitude=first_measure['latitude'],
            longitude=first_measure['longitude']
        )
        print(f"✅ Indices satellite: {satellite}")
        
        # Combiner
        df = client.combine_data(capteurs, satellite)
        print(f"\n📊 DataFrame combiné :\n{df.head()}")
```

---

### **Étape 2.2 : Adapter le service de prédiction (30 min)**

**Modifier `src/services/prediction_service.py`**

```python
import torch
import numpy as np
from typing import Dict, Optional
from datetime import datetime

from ml.convlstm import SimpleWaterQualityLSTM
from ml.preprocessing import WaterQualityPreprocessor
from data.api_client import BilalAPIClient  # NOUVEAU !

class PredictionService:
    """
    Service de prédiction qui peut utiliser :
    - Phase 1 : Données du dataset
    - Phase 2 : APIs de Bilal
    """
    
    def __init__(self, model_path: str, use_api: bool = False):
        """
        Args:
            model_path: Chemin vers le modèle .pth
            use_api: True = utiliser APIs Bilal, False = dataset local
        """
        self.model = self.load_model(model_path)
        self.preprocessor = WaterQualityPreprocessor(sequence_length=24)
        self.use_api = use_api
        
        if self.use_api:
            self.api_client = BilalAPIClient()
    
    def load_model(self, path: str):
        """Charge le modèle PyTorch"""
        model = SimpleWaterQualityLSTM(input_dim=7, hidden_dim=64, num_layers=2)
        checkpoint = torch.load(path, map_location='cpu')
        model.load_state_dict(checkpoint['model_state_dict'])
        model.eval()
        return model
    
    def get_data_from_api(self) -> Optional[np.ndarray]:
        """
        PHASE 2 : Récupère données depuis APIs Bilal
        """
        if not self.use_api:
            return None
        
        # Récupérer données capteurs (24h)
        capteurs_data = self.api_client.get_capteurs_data(hours=24)
        
        if not capteurs_data or len(capteurs_data) < 24:
            print("⚠️ Pas assez de données capteurs")
            return None
        
        # Récupérer satellite pour première localisation
        first_loc = capteurs_data[0]
        satellite_data = self.api_client.get_satellite_data(
            latitude=first_loc['latitude'],
            longitude=first_loc['longitude']
        )
        
        # Combiner
        df = self.api_client.combine_data(capteurs_data, satellite_data)
        
        # Extraire features
        features = []
        for _, row in df.iterrows():
            features.append([
                row['latitude'],
                row['longitude'],
                row['ph'],
                row['temperature'],
                row['turbidite'],
                row['oxygene_dissous'],
                row.get('chlorophylle', 0)  # Depuis satellite
            ])
        
        return np.array(features)
    
    def predict(self, data: Optional[np.ndarray] = None) -> Dict:
        """
        Fait une prédiction
        
        Args:
            data: Si None, utilise API (Phase 2) ou dataset (Phase 1)
        
        Returns:
            Dictionnaire avec prédiction
        """
        # Récupérer données
        if data is None:
            if self.use_api:
                data = self.get_data_from_api()
            else:
                # Phase 1 : données mock
                print("ℹ️ Mode Phase 1 : utilisation de données fictives")
                data = self.generate_mock_data()
        
        if data is None:
            raise ValueError("Aucune donnée disponible")
        
        # Normaliser
        X_normalized = self.preprocessor.scaler.fit_transform(data)
        
        # Convertir en tensor
        X_tensor = torch.FloatTensor(X_normalized).unsqueeze(0)
        
        # Prédiction
        with torch.no_grad():
            pred_score = self.model(X_tensor).item()
        
        # Catégoriser
        categorie = self.categorize_quality(pred_score)
        
        return {
            'prediction_id': f"PRED_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'qualite_score': round(pred_score, 2),
            'qualite_categorie': categorie,
            'confiance': 0.85,
            'timestamp': datetime.now().isoformat(),
            'source': 'api' if self.use_api else 'dataset'
        }
    
    def categorize_quality(self, score: float) -> str:
        """Catégorise le score de qualité"""
        if score >= 8:
            return "EXCELLENTE"
        elif score >= 6:
            return "BONNE"
        elif score >= 4:
            return "MOYENNE"
        else:
            return "MAUVAISE"
    
    def generate_mock_data(self) -> np.ndarray:
        """Génère données fictives pour Phase 1"""
        # 24 mesures fictives
        return np.random.randn(24, 7)
```

---

### **Étape 2.3 : Configuration avec variable d'environnement (15 min)**

**Modifier `src/config.py`**

```python
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Configuration de l'application"""
    
    # Général
    SERVICE_NAME: str = "STModel"
    VERSION: str = "1.0.0"
    
    # Base de données
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://predictions_user:predictions_pass_2025@db_predictions:5432/predictions_db"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis_queue:6379")
    
    # APIs externes (Phase 2)
    CAPTEURS_API_URL: str = os.getenv("CAPTEURS_API_URL", "http://service_capteurs:8000")
    SATELLITE_API_URL: str = os.getenv("SATELLITE_API_URL", "http://service_satellite:8000")
    
    # Modèle
    USE_API_DATA: bool = os.getenv("USE_API_DATA", "false").lower() == "true"
    MODEL_PATH: str = os.getenv("MODEL_PATH", "../models/best_model.pth")
    
    class Config:
        env_file = ".env"

settings = Settings()
```

**Créer `.env` local**
```bash
# Phase 1 : Dataset local
USE_API_DATA=false

# Phase 2 : APIs Bilal (activer quand prêt)
# USE_API_DATA=true
# CAPTEURS_API_URL=http://service_capteurs:8000
# SATELLITE_API_URL=http://service_satellite:8000
```

---

### **Étape 2.4 : Transition Phase 1 → Phase 2 (Facile !)**

Quand Bilal a terminé ses services :

1. **Vérifier que les APIs de Bilal fonctionnent**
```powershell
curl http://localhost:8001/api/capteurs/data/latest
curl http://localhost:8002/api/satellite/indices/latest
```

2. **Activer mode API dans votre service**
```bash
# Dans .env
USE_API_DATA=true
```

3. **Redémarrer votre service**
```powershell
docker compose restart service_stmodel
```

4. **Tester**
```powershell
curl http://localhost:8003/api/predictions/create
```

5. **Ré-entraîner le modèle avec vraies données** (optionnel)
```python
# Collecter 1 semaine de données depuis APIs
# Puis relancer train.py
python src/ml/train.py --use-api-data
```

**C'EST TOUT ! 🎉**

---

## 🐳 COMMANDES DOCKER UTILES

### **Développement local (Phase 1)**
```powershell
# Juste votre service + base dédiée
docker compose up db_predictions redis_queue -d
docker compose up service_stmodel
```

### **Intégration complète (Phase 2)**
```powershell
# Tous les services
docker compose up
```

### **Rebuild après modifications**
```powershell
# Si modification requirements.txt
docker compose build service_stmodel

# Si modification code seulement
docker compose restart service_stmodel
```

### **Logs**
```powershell
docker compose logs -f service_stmodel
```

---

## 📊 RÉSUMÉ DES PHASES

### **PHASE 1 (MAINTENANT) - 1-2 SEMAINES**

✅ **Avantages** :
- Indépendant de Bilal
- Modèle validé et fonctionnel
- API complète et testée

✅ **Livrables** :
- Modèle ConvLSTM entraîné
- API REST opérationnelle
- Documentation complète

### **PHASE 2 (QUAND BILAL PRÊT) - 2-3 JOURS**

✅ **Transition facile** :
- Changer 1 variable (`USE_API_DATA=true`)
- Tester intégration
- Ré-entraîner si besoin

✅ **Avantages** :
- Données réelles en temps réel
- Intégration complète microservices
- Prédictions précises

---

## 🎯 CHECKLIST DE PROGRESSION

### **Semaine 1**
- [ ] Télécharger/générer dataset
- [ ] Explorer données (notebook)
- [ ] Implémenter preprocessing
- [ ] Tester modèle simple

### **Semaine 2**
- [ ] Entraîner modèle complet
- [ ] Évaluer performance
- [ ] Créer API FastAPI
- [ ] Tester endpoints

### **Semaine 3**
- [ ] Connexion PostgreSQL
- [ ] Stockage prédictions
- [ ] Communication Redis
- [ ] Tests intégration

### **Quand Bilal prêt**
- [ ] Implémenter client API
- [ ] Activer mode API
- [ ] Tests avec vraies données
- [ ] Ré-entraînement optionnel

---

## 💡 CONSEILS FINAUX

1. **Commencez simple** : LSTM basique avant ConvLSTM complet
2. **Testez souvent** : Chaque composant indépendamment
3. **Logs partout** : Pour débugger facilement
4. **Documentation** : Notez vos décisions et résultats
5. **Git régulièrement** : Commit après chaque étape

---

## 🆘 TROUBLESHOOTING

### **Modèle ne converge pas**
- Réduire learning rate
- Normaliser les données
- Simplifier architecture

### **API ne répond pas**
- Vérifier logs Docker
- Tester health endpoint
- Vérifier ports

### **Données manquantes**
- Mode fallback avec données mock
- Logs pour identifier le problème
- Vérifier APIs de Bilal

---

**🚀 Bonne chance ! Vous êtes prêt à développer un modèle AI professionnel ! 🌊**
