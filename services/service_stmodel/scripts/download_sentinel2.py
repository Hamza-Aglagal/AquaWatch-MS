"""
Téléchargement des données satellites Sentinel-2 via Google Earth Engine

Ce script :
1. Charge le dataset capteurs nettoyé
2. Extrait les coordonnées GPS uniques
3. Pour chaque station, télécharge indices satellites (NDWI, chlorophylle, turbidité)
4. Sauvegarde dans data/raw/satellites/sentinel2_data.csv

Auteur: Hamza
Date: 2 novembre 2025
"""

import ee
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
import os

# ============================================================================
# CONFIGURATION
# ============================================================================

# Fichier capteurs nettoyé (source des coordonnées GPS)
CAPTEURS_FILE = 'data/processed/capteurs_cleaned.csv'

# Fichier de sortie
OUTPUT_FILE = 'data/raw/satellites/sentinel2_data.csv'

# Fichier checkpoint (pour reprendre en cas d'interruption)
CHECKPOINT_FILE = 'data/raw/satellites/.checkpoint_stations.txt'

# Période de téléchargement
# On va utiliser les dates du dataset capteurs
START_DATE = None  # Sera défini automatiquement
END_DATE = None    # Sera défini automatiquement

# Nombre de stations à traiter (pour test, mettre 10-20)
# Mettre None pour traiter toutes les stations
MAX_STATIONS = None  # ✅ TOUTES LES STATIONS

# Fenêtre de recherche autour de la date capteur (jours)
# MODE COMPLET : Télécharger TOUTES les images disponibles
DATE_WINDOW = None  # None = toute la période 2015-2022

# Seuil de couverture nuageuse (%)
CLOUD_COVER_MAX = 50  # Augmenté à 50% pour avoir plus d'images


# ============================================================================
# FONCTIONS UTILITAIRES
# ============================================================================

def calculate_ndwi(image):
    """
    Calcule NDWI (Normalized Difference Water Index)
    NDWI = (GREEN - NIR) / (GREEN + NIR)
    
    Valeurs :
    - > 0.3 : Eau
    - 0 à 0.3 : Humide
    - < 0 : Sec
    """
    green = image.select('B3')  # Bande verte
    nir = image.select('B8')    # Proche infrarouge
    
    ndwi = green.subtract(nir).divide(green.add(nir)).rename('NDWI')
    return ndwi


def calculate_chlorophyll(image):
    """
    Calcule indice de chlorophylle (proxy)
    Utilise ratio de bandes sensibles à la chlorophylle
    
    Chlorophyll Index = B4 / B3 (Rouge / Vert)
    """
    red = image.select('B4')
    green = image.select('B3')
    
    chlor = red.divide(green).rename('chlorophyll_index')
    return chlor


def calculate_turbidity(image):
    """
    Calcule indice de turbidité optique
    Basé sur réflectance dans le rouge
    
    Plus la valeur est haute, plus l'eau est trouble
    """
    red = image.select('B4')
    turbidity = red.multiply(100).rename('turbidity_index')
    return turbidity


def calculate_temperature(image):
    """
    Extrait température de surface (bande thermique)
    Note: Sentinel-2 n'a pas de bande thermique
    On utilise une approximation ou on retourne None
    """
    # Sentinel-2 n'a pas de vraie bande thermique
    # On retourne None pour cette version
    return None


def load_checkpoint():
    """
    Charge la liste des stations déjà téléchargées
    """
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, 'r') as f:
            return set(line.strip() for line in f)
    return set()


def save_checkpoint(station_id):
    """
    Sauvegarde une station comme terminée
    """
    with open(CHECKPOINT_FILE, 'a') as f:
        f.write(f"{station_id}\n")


def save_partial_results(df_station, is_first=False):
    """
    Sauvegarde progressive des résultats
    Ajoute les nouvelles données au fichier existant
    """
    if is_first and os.path.exists(OUTPUT_FILE):
        # Si fichier existe déjà, on continue (mode append)
        df_station.to_csv(OUTPUT_FILE, mode='a', header=False, index=False)
    elif is_first:
        # Premier enregistrement, créer fichier avec header
        df_station.to_csv(OUTPUT_FILE, mode='w', header=True, index=False)
    else:
        # Ajouter sans header
        df_station.to_csv(OUTPUT_FILE, mode='a', header=False, index=False)


def extract_indices_for_station(lat, lon, start_date, end_date):
    """
    Extrait TOUTES les indices satellites disponibles pour une station
    
    Args:
        lat: Latitude
        lon: Longitude
        start_date: Date début (string 'YYYY-MM-DD')
        end_date: Date fin (string 'YYYY-MM-DD')
    
    Returns:
        DataFrame avec indices par date
    """
    # Créer un point
    point = ee.Geometry.Point([lon, lat])
    
    # Charger collection Sentinel-2 (Surface Reflectance - Version harmonisée)
    collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
        .filterBounds(point) \
        .filterDate(start_date, end_date) \
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CLOUD_COVER_MAX))
    
    # Vérifier si des images disponibles
    count = collection.size().getInfo()
    if count == 0:
        return pd.DataFrame()
    
    print(f"    📸 {count} images disponibles")
    
    # Récupérer liste des images
    images = collection.toList(count)
    
    results = []
    
    for i in range(count):
        try:
            # Récupérer image
            img = ee.Image(images.get(i))
            
            # Calculer indices
            ndwi = calculate_ndwi(img)
            chlor = calculate_chlorophyll(img)
            turb = calculate_turbidity(img)
            
            # Combiner tous les indices
            combined = ndwi.addBands([chlor, turb])
            
            # Extraire valeurs au point
            values = combined.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=point,
                scale=10,  # Résolution 10m
                maxPixels=1e9
            ).getInfo()
            
            # Récupérer date de l'image
            date_ms = img.get('system:time_start').getInfo()
            date = datetime.fromtimestamp(date_ms / 1000).strftime('%Y-%m-%d')
            
            # Ajouter au résultat
            results.append({
                'date': date,
                'latitude': lat,
                'longitude': lon,
                'NDWI': values.get('NDWI'),
                'chlorophyll_index': values.get('chlorophyll_index'),
                'turbidity_index': values.get('turbidity_index'),
                'temperature_surface': None  # Sentinel-2 n'a pas de thermique
            })
            
            # Afficher progression tous les 50 images
            if (i+1) % 50 == 0:
                print(f"      ⏳ {i+1}/{count} images traitées...")
            
        except Exception as e:
            print(f"      ⚠️  Erreur sur image {i+1}: {str(e)[:50]}")
            continue
    
    return pd.DataFrame(results)


# ============================================================================
# SCRIPT PRINCIPAL
# ============================================================================

def main():
    print("🛰️  TÉLÉCHARGEMENT DONNÉES SATELLITES SENTINEL-2")
    print("=" * 70)
    print()
    
    # Initialiser Earth Engine
    print("🔧 Initialisation Google Earth Engine...")
    try:
        ee.Initialize(project='aquawatch-stmodel')
        print("✅ Earth Engine initialisé")
        print(f"📦 Projet : aquawatch-stmodel")
    except Exception as e:
        print("❌ ERREUR : Impossible d'initialiser Earth Engine")
        print(f"Message : {str(e)}")
        print()
        print("🔧 Solution : Lance cette commande dans le terminal :")
        print("   earthengine authenticate --project aquawatch-stmodel")
        return
    print()
    
    # Charger dataset capteurs
    print("📂 Chargement dataset capteurs...")
    if not os.path.exists(CAPTEURS_FILE):
        print(f"❌ ERREUR : Fichier introuvable : {CAPTEURS_FILE}")
        print("🔧 Solution : Lance d'abord le notebook 01_nettoyage_capteurs.ipynb")
        return
    
    df_capteurs = pd.read_csv(CAPTEURS_FILE)
    print(f"✅ Dataset chargé : {len(df_capteurs):,} lignes")
    print()
    
    # Extraire stations uniques avec GPS + leurs dates
    print("📍 Extraction des stations et dates...")
    
    # Convertir dates
    df_capteurs['date'] = pd.to_datetime(df_capteurs['date'])
    
    # Grouper par station avec toutes leurs dates
    stations_with_dates = df_capteurs.groupby('station_id').agg({
        'latitude': 'first',
        'longitude': 'first',
        'date': lambda x: list(x.dt.strftime('%Y-%m-%d').unique())
    }).reset_index()
    
    stations_with_dates.columns = ['station_id', 'latitude', 'longitude', 'dates']
    
    if MAX_STATIONS:
        stations_with_dates = stations_with_dates.head(MAX_STATIONS)
        print(f"🔧 Mode test : {len(stations_with_dates)} stations")
    else:
        print(f"✅ {len(stations_with_dates)} stations à traiter")
    
    # Compter total de dates
    total_dates = sum(len(dates) for dates in stations_with_dates['dates'])
    print(f"📅 Total dates capteurs : {total_dates:,}")
    print(f"� Moyenne : {total_dates/len(stations_with_dates):.1f} dates/station")
    print()
    
    # Charger checkpoint (stations déjà traitées)
    completed_stations = load_checkpoint()
    if completed_stations:
        print(f"🔄 REPRISE DÉTECTÉE : {len(completed_stations)} stations déjà téléchargées")
        print(f"📊 Restant : {len(stations_with_dates) - len(completed_stations)} stations")
        print()
    
    # Créer dossier de sortie
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    os.makedirs(os.path.dirname(CHECKPOINT_FILE), exist_ok=True)
    
    # Télécharger pour chaque station
    print("🚀 Début du téléchargement...")
    print("=" * 70)
    
    success_count = 0
    error_count = 0
    skipped_count = 0
    total_images_count = 0
    is_first_save = not os.path.exists(OUTPUT_FILE)
    
    for idx, row in stations_with_dates.iterrows():
        station_id = row['station_id']
        
        # Skip si déjà téléchargée
        if str(station_id) in completed_stations:
            skipped_count += 1
            if skipped_count % 10 == 0:  # Afficher tous les 10 skips
                print(f"⏭️  [{idx+1}/{len(stations_with_dates)}] {skipped_count} stations déjà faites...")
            continue
        
        lat = row['latitude']
        lon = row['longitude']
        target_dates = row['dates']
        
        print(f"\n[{idx+1}/{len(stations_with_dates)}] Station {station_id} (lat={lat:.2f}, lon={lon:.2f})")
        print(f"  📅 {len(target_dates)} dates capteurs à traiter")
        
        try:
            # Télécharger satellites pour les dates capteurs uniquement
            df_station = extract_indices_for_dates(lat, lon, target_dates)
            
            if len(df_station) > 0:
                # Ajouter station_id
                df_station['station_id'] = station_id
                
                # Réorganiser colonnes
                df_station = df_station[['station_id', 'target_date', 'date', 'latitude', 'longitude',
                                        'NDWI', 'chlorophyll_index', 'turbidity_index', 
                                        'temperature_surface']].copy()
                df_station.rename(columns={'target_date': 'date_capteur', 'date': 'date_satellite'}, inplace=True)
                
                # Sauvegarder immédiatement (progressive save)
                save_partial_results(df_station, is_first=is_first_save)
                is_first_save = False
                
                # Marquer comme terminée
                save_checkpoint(station_id)
                
                total_images_count += len(df_station)
                print(f"  ✅ {len(df_station)}/{len(target_dates)} images satellites trouvées et sauvegardées")
                success_count += 1
            else:
                print(f"  ⚠️  Aucune image satellite disponible (nuages ou hors zone)")
                save_checkpoint(station_id)  # Marquer quand même pour skip
                error_count += 1
            
            # Pause pour éviter rate limiting
            time.sleep(0.3)
            
        except Exception as e:
            print(f"  ❌ Erreur : {str(e)[:100]}")
            error_count += 1
            continue
    
    print()
    print("=" * 70)
    print("✅ TÉLÉCHARGEMENT TERMINÉ !")
    print()
    
    # Charger le fichier final pour stats
    if os.path.exists(OUTPUT_FILE):
        df_final = pd.read_csv(OUTPUT_FILE)
        
        print(f"📊 STATISTIQUES :")
        print(f"  • Stations réussies : {success_count}/{len(stations_with_dates)}")
        print(f"  • Stations échouées : {error_count}/{len(stations_with_dates)}")
        if skipped_count > 0:
            print(f"  • Stations skippées (déjà faites) : {skipped_count}/{len(stations_with_dates)}")
        print(f"  • Total paires capteur-satellite : {len(df_final):,}")
        print(f"  • Période capteurs : {df_final['date_capteur'].min()} → {df_final['date_capteur'].max()}")
        print(f"  • Période satellites : {df_final['date_satellite'].min()} → {df_final['date_satellite'].max()}")
        print()
        print(f"💾 Fichier sauvegardé : {OUTPUT_FILE}")
        print(f"📁 Taille : {len(df_final):,} lignes × {len(df_final.columns)} colonnes")
        print()
        
        # Aperçu
        print("📋 APERÇU DES DONNÉES :")
        print(df_final.head())
        print()
        
        # Nettoyer checkpoint si tout est fait
        if success_count + error_count + skipped_count >= len(stations_with_dates):
            if os.path.exists(CHECKPOINT_FILE):
                os.remove(CHECKPOINT_FILE)
                print("🧹 Checkpoint nettoyé (téléchargement complet)")
                print()
        
        print("🎉 Prochaine étape : Fusionner avec capteurs !")
        
    else:
        print("❌ Aucune donnée récupérée")
        print("🔧 Vérifiez :")
        print("  - Connexion Earth Engine")
        print("  - Coordonnées GPS valides")
        print("  - Période avec images disponibles")


if __name__ == '__main__':
    main()
