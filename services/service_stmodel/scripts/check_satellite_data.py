"""
Script rapide pour vérifier l'état du fichier satellite avant fusion
"""
import pandas as pd

# Charger données satellites
df = pd.read_csv('data/raw/satellites/sentinel2_data.csv')

print("=" * 80)
print("🛰️ ANALYSE FICHIER SATELLITE")
print("=" * 80)

print(f"\n📊 Total lignes: {len(df):,}")
print(f"📋 Colonnes: {list(df.columns)}")

print("\n❓ Valeurs manquantes:")
missing = df.isnull().sum()
missing_pct = (missing / len(df)) * 100
for col in df.columns:
    if missing[col] > 0:
        print(f"   • {col:25s} : {missing[col]:6,} ({missing_pct[col]:5.1f}%)")

if missing.sum() == 0:
    print("   ✅ Aucune valeur manquante !")

print("\n📍 Station IDs:")
print(f"   • Non-null         : {df['station_id'].notna().sum():,}")
print(f"   • Null (manquants) : {df['station_id'].isna().sum():,}")
print(f"   • Stations uniques : {df['station_id'].nunique()}")

print("\n📅 Dates:")
df['date'] = pd.to_datetime(df['date'], errors='coerce')
print(f"   • Dates valides : {df['date'].notna().sum():,}")
print(f"   • Dates null    : {df['date'].isna().sum():,}")
print(f"   • Première date : {df['date'].min()}")
print(f"   • Dernière date : {df['date'].max()}")

print("\n🔢 Indices satellites:")
for col in ['NDWI', 'chlorophyll_index', 'turbidity_index', 'temperature_surface']:
    non_null = df[col].notna().sum()
    pct = (non_null / len(df)) * 100
    print(f"   • {col:25s} : {non_null:6,} / {len(df):,} ({pct:5.1f}%)")

print("\n" + "=" * 80)
print("🎯 CONCLUSION")
print("=" * 80)

issues = []
if df['station_id'].isna().sum() > len(df) * 0.3:  # Plus de 30% manquants
    issues.append("⚠️  Trop de station_id manquants (> 30%)")
    
if df['date'].isna().sum() > 0:
    issues.append("⚠️  Dates invalides détectées")

if df['NDWI'].isna().sum() > len(df) * 0.5:
    issues.append("⚠️  NDWI manquant sur plus de 50% des lignes")

if len(issues) > 0:
    print("\n❌ PROBLÈMES DÉTECTÉS :")
    for issue in issues:
        print(f"   {issue}")
    print("\n💡 RECOMMANDATION : Nettoyer le fichier satellite avant fusion")
else:
    print("\n✅ FICHIER PROPRE : Prêt pour la fusion")
    print("   Pas besoin de nettoyage supplémentaire")
