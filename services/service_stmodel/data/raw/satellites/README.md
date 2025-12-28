# 🛰️ Téléchargement Données Satellites

## 📋 ÉTAPES À SUIVRE

### 1️⃣ Tester la connexion Earth Engine

```powershell
cd services/service_stmodel
python scripts/test_earthengine.py
```

**Résultat attendu** :
```
✅ Earth Engine initialisé avec succès !
✅ Requête réussie !
🎉 TOUT FONCTIONNE !
```

**Si erreur** : Lance `earthengine authenticate` et suis les instructions

---

### 2️⃣ Télécharger les données satellites

```powershell
python scripts/download_sentinel2.py
```

**Ce que fait le script** :
1. ✅ Charge ton dataset capteurs nettoyé
2. ✅ Extrait les coordonnées GPS de chaque station
3. ✅ Pour chaque station, télécharge images Sentinel-2
4. ✅ Calcule indices : NDWI, Chlorophylle, Turbidité
5. ✅ Sauvegarde dans `data/raw/satellites/sentinel2_data.csv`

---

## ⚙️ CONFIGURATION

**Mode test** (par défaut) : 20 stations
- Rapide : 5-10 min
- Pour vérifier que ça marche

**Mode complet** : Toutes les stations
- Ouvre `scripts/download_sentinel2.py`
- Change ligne 32 : `MAX_STATIONS = None`
- Durée : 30 min - 2h

---

## 📊 INDICES TÉLÉCHARGÉS

### NDWI (Normalized Difference Water Index)
- **Formule** : (GREEN - NIR) / (GREEN + NIR)
- **Valeurs** : 
  - \> 0.3 = Eau
  - 0 à 0.3 = Humide
  - < 0 = Sec

### Chlorophyll Index
- **Formule** : RED / GREEN
- **Utilité** : Détection algues/phytoplancton
- **Plus haut** = Plus de chlorophylle

### Turbidity Index
- **Formule** : RED × 100
- **Utilité** : Mesure turbidité optique
- **Plus haut** = Eau plus trouble

### Temperature Surface
- **Note** : Sentinel-2 n'a pas de bande thermique
- **Valeur** : None (sera complété par autre source si besoin)

---

## 📁 RÉSULTAT

**Fichier créé** : `data/raw/satellites/sentinel2_data.csv`

**Structure** :
```csv
station_id, date, latitude, longitude, NDWI, chlorophyll_index, turbidity_index, temperature_surface
1, 2020-01-05, 112.5, 32.1, 0.45, 0.8, 12.5, None
1, 2020-01-10, 112.5, 32.1, 0.43, 0.85, 13.1, None
```

**Colonnes** :
- `station_id` : ID station (correspond au dataset capteurs)
- `date` : Date image satellite
- `latitude`, `longitude` : GPS
- `NDWI` : Indice eau (0-1)
- `chlorophyll_index` : Indice chlorophylle
- `turbidity_index` : Indice turbidité optique
- `temperature_surface` : Température (None pour Sentinel-2)

---

## 🔧 DÉPANNAGE

### Erreur "Earth Engine not initialized"
```powershell
earthengine authenticate
```
→ Ouvre navigateur → Autorise → Copie code → Colle dans terminal

### Erreur "File not found: capteurs_cleaned.csv"
→ Lance d'abord le notebook `01_nettoyage_capteurs.ipynb`

### "Aucune image disponible"
- Période peut ne pas avoir d'images Sentinel-2
- Trop de couverture nuageuse (>30%)
- Station hors zone couverte par Sentinel-2

### Téléchargement très lent
- Normal : Earth Engine traite image par image
- 20 stations = ~5-10 min
- Toutes stations = 30 min - 2h

---

## 📋 PROCHAINE ÉTAPE

Une fois téléchargement terminé :
1. ✅ Vérifier fichier créé : `data/raw/satellites/sentinel2_data.csv`
2. ✅ Passer à la fusion : capteurs + satellites
3. ✅ Notebook : `02_fusion_normalisation.ipynb`

---

**Bon téléchargement ! 🛰️**
