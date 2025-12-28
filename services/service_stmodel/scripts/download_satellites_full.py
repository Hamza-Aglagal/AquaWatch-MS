"""
Téléchargement COMPLET des données satellites Sentinel-2

Ce script télécharge TOUTES les images disponibles pour les 73 stations
qui ont des capteurs, sur toute la période 2015-2022.

Auteur: Hamza
Date: Novembre 2025
"""

import ee
import pandas as pd
import numpy as np
from datetime import datetime
import time
import os
from pathlib import Path

# ============================================================================
# CONFIGURATION
# ============================================================================

CAPTEURS_FILE = 'data/processed/capteurs_cleaned.csv'
SATELLITES_REF_FILE = 'data/processed/satellites_cleaned.csv'  # Pour identifier les 73 stations
OUTPUT_FILE = 'data/raw/satellites/sentinel2_data.csv'
CHECKPOINT_FILE = 'data/raw/satellites/.checkpoint.txt'

# Période de téléchargement (Sentinel-2 lancé en juin 2015)
START_DATE = '2015-06-23'
END_DATE = '2022-12-31'

# Paramètres
CLOUD_COVER_MAX = 50  # % nuages maximum
WINDOW_DAYS = 7       # Fenêtre ±N jours autour dates capteurs
MAX_STATIONS = None   # None = toutes les 73 stations

# ============================================================================
# FONCTIONS
# ============================================================================

def calculate_ndwi(image):
    """NDWI = (GREEN - NIR) / (GREEN + NIR)"""
    green = image.select('B3')
    nir = image.select('B8')
    ndwi = green.subtract(nir).divide(green.add(nir)).rename('NDWI')
    return ndwi

def calculate_chlorophyll(image):
    """Chlorophyll Index = RED / GREEN"""
    red = image.select('B4')
    green = image.select('B3')
    chlor = red.divide(green).rename('chlorophyll_index')
    return chlor

def calculate_turbidity(image):
    """Turbidity basé sur réflectance rouge"""
    red = image.select('B4')
    turbidity = red.multiply(100).rename('turbidity_index')
    return turbidity

def download_station(lat, lon, target_dates, window_days=7):
    """
    Télécharge images satellites UNIQUEMENT autour des dates capteurs
    
    Args:
        lat, lon: Coordonnées GPS
        target_dates: Liste des dates capteurs (format 'YYYY-MM-DD')
        window_days: Fenêtre de recherche ±N jours (défaut: 7)
    
    Returns:
        DataFrame avec images satellites trouvées
    """
    point = ee.Geometry.Point([lon, lat])
    results = []
    
    print(f"    📅 {len(target_dates)} dates capteurs")
    
    for target_date in target_dates:
        try:
            # Fenêtre ±7 jours autour de la date capteur
            target_dt = datetime.strptime(target_date, '%Y-%m-%d')
            from datetime import timedelta
            start_window = (target_dt - timedelta(days=window_days)).strftime('%Y-%m-%d')
            end_window = (target_dt + timedelta(days=window_days)).strftime('%Y-%m-%d')
            
            # Chercher images dans cette fenêtre
            collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
                .filterBounds(point) \
                .filterDate(start_window, end_window) \
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CLOUD_COVER_MAX))
            
            count = collection.size().getInfo()
            
            if count == 0:
                continue
            
            # Prendre l'image la plus proche de la date cible
            images = collection.toList(count)
            
            # Calculer pour chaque image et garder la plus proche
            best_image = None
            best_days_diff = 999
            
            for i in range(count):
                img = ee.Image(images.get(i))
                date_ms = img.get('system:time_start').getInfo()
                img_date = datetime.fromtimestamp(date_ms / 1000)
                days_diff = abs((img_date - target_dt).days)
                
                if days_diff < best_days_diff:
                    best_days_diff = days_diff
                    best_image = img
            
            if best_image and best_days_diff <= window_days:
                # Calculer indices
                ndwi = calculate_ndwi(best_image)
                chlor = calculate_chlorophyll(best_image)
                turb = calculate_turbidity(best_image)
                combined = ndwi.addBands([chlor, turb])
                
                # Extraire valeurs
                values = combined.reduceRegion(
                    reducer=ee.Reducer.mean(),
                    geometry=point,
                    scale=10,
                    maxPixels=1e9
                ).getInfo()
                
                # Date de l'image satellite
                date_ms = best_image.get('system:time_start').getInfo()
                sat_date = datetime.fromtimestamp(date_ms / 1000).strftime('%Y-%m-%d')
                
                results.append({
                    'date_capteur': target_date,
                    'date_satellite': sat_date,
                    'days_diff': best_days_diff,
                    'latitude': lat,
                    'longitude': lon,
                    'NDWI': values.get('NDWI'),
                    'chlorophyll_index': values.get('chlorophyll_index'),
                    'turbidity_index': values.get('turbidity_index'),
                    'temperature_surface': None
                })
            
        except Exception as e:
            continue
    
    return pd.DataFrame(results)

def load_checkpoint():
    """Charge les stations déjà téléchargées"""
    if os.path.exists(CHECKPOINT_FILE):
        with open(CHECKPOINT_FILE, 'r') as f:
            return set(line.strip() for line in f)
    return set()

def save_checkpoint(station_id):
    """Sauvegarde une station terminée"""
    with open(CHECKPOINT_FILE, 'a') as f:
        f.write(f"{station_id}\n")

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("🛰️ TÉLÉCHARGEMENT SATELLITES SENTINEL-2")
    print("="*70)
    
    # Initialiser Earth Engine
    print("\n🔧 Initialisation Earth Engine...")
    try:
        ee.Initialize(project='aquawatch-stmodel')
        print("✅ Earth Engine initialisé")
    except Exception as e:
        print(f"❌ ERREUR : {str(e)}")
        print("\n🔧 Lance : earthengine authenticate --project aquawatch-stmodel")
        return
    
    # Charger capteurs
    print(f"\n📂 Chargement capteurs...")
    if not os.path.exists(CAPTEURS_FILE):
        print(f"❌ Fichier introuvable : {CAPTEURS_FILE}")
        return
    
    df_capteurs = pd.read_csv(CAPTEURS_FILE)
    print(f"✅ {len(df_capteurs):,} observations chargées")
    
    # Identifier les 73 stations qui ont des satellites
    print(f"\n📡 Identification stations avec satellites...")
    if not os.path.exists(SATELLITES_REF_FILE):
        print(f"❌ Fichier introuvable : {SATELLITES_REF_FILE}")
        print("⚠️ Utilisation de toutes les stations (peut prendre beaucoup de temps!)")
        stations_with_satellites = None
    else:
        df_sat_ref = pd.read_csv(SATELLITES_REF_FILE)
        stations_with_satellites = set(df_sat_ref['station_id'].unique())
        print(f"✅ {len(stations_with_satellites)} stations identifiées avec satellites")
        
        # FILTRER les capteurs pour garder SEULEMENT ces 73 stations
        df_capteurs = df_capteurs[df_capteurs['station_id'].isin(stations_with_satellites)]
        print(f"📊 Capteurs filtrés : {len(df_capteurs):,} observations pour ces {len(stations_with_satellites)} stations")
    
    # Convertir dates
    df_capteurs['date'] = pd.to_datetime(df_capteurs['date'])
    
    # ⚠️ ESSENTIEL : Filtrer dates capteurs pour période Sentinel-2 UNIQUEMENT
    print(f"\n📅 Filtrage dates Sentinel-2 ({START_DATE} → {END_DATE})...")
    print(f"   Avant : {len(df_capteurs):,} observations")
    df_capteurs = df_capteurs[
        (df_capteurs['date'] >= START_DATE) & 
        (df_capteurs['date'] <= END_DATE)
    ]
    print(f"   Après : {len(df_capteurs):,} observations dans période Sentinel-2")
    
    if len(df_capteurs) == 0:
        print("❌ ERREUR : Aucune donnée capteur dans période Sentinel-2 !")
        return
    
    df_capteurs['date'] = df_capteurs['date'].dt.strftime('%Y-%m-%d')
    
    # Extraire stations avec leurs dates capteurs
    stations = df_capteurs.groupby('station_id').agg({
        'latitude': 'first',
        'longitude': 'first',
        'date': lambda x: sorted(list(x.unique()))
    }).reset_index()
    
    if MAX_STATIONS:
        stations = stations.head(MAX_STATIONS)
    
    # Compter total dates
    total_dates = sum(len(dates) for dates in stations['date'])
    
    print(f"\n📍 {len(stations)} stations à traiter")
    print(f"📅 {total_dates:,} dates capteurs au total")
    print(f"📊 Moyenne : {total_dates/len(stations):.1f} dates/station")
    print(f"☁️ Nuages max : {CLOUD_COVER_MAX}%")
    print(f"⏱️ Fenêtre : ±{WINDOW_DAYS} jours autour de chaque date capteur")
    print(f"\n⚠️ IMPORTANT : Script optimisé pour télécharger UNIQUEMENT les dates nécessaires")
    print(f"   Évite le problème de 'trop peu de données' après fusion !")
    
    # Checkpoint
    completed = load_checkpoint()
    if completed:
        print(f"🔄 {len(completed)} stations déjà faites")
        print(f"📊 Restant : {len(stations) - len(completed)}")
    
    # Créer dossiers
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    os.makedirs(os.path.dirname(CHECKPOINT_FILE), exist_ok=True)
    
    # Télécharger
    print("\n🚀 Début téléchargement...")
    print("="*70)
    
    success = 0
    error = 0
    skipped = 0
    total_images = 0
    first_save = not os.path.exists(OUTPUT_FILE)
    
    for idx, row in stations.iterrows():
        station_id = int(row['station_id'])
        
        if str(station_id) in completed:
            skipped += 1
            if skipped % 10 == 0:
                print(f"⏭️ [{idx+1}/{len(stations)}] {skipped} stations skippées...")
            continue
        
        lat = row['latitude']
        lon = row['longitude']
        target_dates = row['date']
        
        print(f"\n[{idx+1}/{len(stations)}] Station {station_id} (lat={lat:.2f}, lon={lon:.2f})")
        
        try:
            # Télécharger UNIQUEMENT pour les dates capteurs
            df_station = download_station(lat, lon, target_dates, window_days=WINDOW_DAYS)
            
            if len(df_station) > 0:
                df_station['station_id'] = station_id
                
                # Réorganiser
                df_station = df_station[['date_capteur', 'date_satellite', 'days_diff',
                                        'latitude', 'longitude', 'NDWI', 
                                        'chlorophyll_index', 'turbidity_index', 
                                        'temperature_surface', 'station_id']]
                
                # Sauvegarder progressivement
                if first_save:
                    df_station.to_csv(OUTPUT_FILE, mode='w', header=True, index=False)
                    first_save = False
                else:
                    df_station.to_csv(OUTPUT_FILE, mode='a', header=False, index=False)
                
                save_checkpoint(station_id)
                
                total_images += len(df_station)
                print(f"  ✅ {len(df_station)}/{len(target_dates)} images satellites trouvées ({len(df_station)/len(target_dates)*100:.1f}%)")
                success += 1
            else:
                print(f"  ⚠️ Aucune image disponible")
                save_checkpoint(station_id)
                error += 1
            
            time.sleep(0.3)
            
        except Exception as e:
            print(f"  ❌ Erreur : {str(e)[:100]}")
            error += 1
            continue
    
    print("\n" + "="*70)
    print("✅ TERMINÉ !")
    print(f"\n📊 RÉSULTATS :")
    print(f"  • Réussies : {success}/{len(stations)}")
    print(f"  • Échouées : {error}/{len(stations)}")
    if skipped > 0:
        print(f"  • Skippées : {skipped}/{len(stations)}")
    
    if os.path.exists(OUTPUT_FILE):
        df_final = pd.read_csv(OUTPUT_FILE)
        print(f"\n💾 Dataset final :")
        print(f"  • Fichier : {OUTPUT_FILE}")
        print(f"  • Lignes : {len(df_final):,}")
        print(f"  • Stations : {df_final['station_id'].nunique()}")
        print(f"  • Période capteurs : {df_final['date_capteur'].min()} → {df_final['date_capteur'].max()}")
        print(f"  • Période satellites : {df_final['date_satellite'].min()} → {df_final['date_satellite'].max()}")
        print(f"  • Écart moyen : {df_final['days_diff'].mean():.1f} jours")
        
        # VALIDATION : Vérifier qu'on a assez de données pour fusion
        taux_match = (len(df_final) / total_dates) * 100
        print(f"\n✅ VALIDATION FUSION :")
        print(f"  • Taux de match : {taux_match:.1f}% ({len(df_final):,}/{total_dates:,})")
        
        if taux_match < 30:
            print(f"  ⚠️ ATTENTION : Taux faible (<30%), peut être insuffisant pour modèle")
            print(f"     Solution : Augmenter WINDOW_DAYS ou CLOUD_COVER_MAX")
        elif taux_match < 50:
            print(f"  ⚠️ Taux modéré (30-50%), acceptable mais peut limiter performance")
        else:
            print(f"  ✅ Excellent taux (>{taux_match:.0f}%), données suffisantes pour fusion !")
        
        print(f"\n📋 Aperçu :")
        print(df_final.head(10))
        
        # Nettoyer checkpoint si terminé
        if success + error + skipped >= len(stations):
            if os.path.exists(CHECKPOINT_FILE):
                os.remove(CHECKPOINT_FILE)
                print("\n🧹 Checkpoint nettoyé")
    
    print("\n🎉 Prochaine étape : Nettoyer et fusionner directement (pas besoin de recherche temporelle) !")

if __name__ == '__main__':
    main()
