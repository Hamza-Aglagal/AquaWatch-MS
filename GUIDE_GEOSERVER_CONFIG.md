# 🗺️ Configuration GeoServer - AquaWatch

## Accès GeoServer

**URL**: http://localhost:8080/geoserver  
**Login**: `admin`  
**Password**: `aquawatch123`

---

## 📋 Étapes de Configuration

### 1. Créer le Workspace

1. Cliquez sur **Workspaces** dans le menu de gauche
2. Cliquez sur **Add new workspace**
3. Remplissez:
   - **Name**: `aquawatch`
   - **Namespace URI**: `http://aquawatch.ma`
   - ☑️ **Default Workspace**: Coché
4. Cliquez sur **Submit**

### 2. Créer le DataStore PostGIS

1. Cliquez sur **Stores** dans le menu de gauche
2. Cliquez sur **Add new Store**
3. Sélectionnez **PostGIS** sous "Vector Data Sources"
4. Remplissez:
   - **Workspace**: `aquawatch`
   - **Data Source Name**: `aquawatch_geo_db`
   - **Description**: `Base de données PostGIS pour AquaWatch`
   - **Enabled**: ☑️ Coché

5. **Connection Parameters**:
   ```
   dbtype: postgis
   host: db_geo
   port: 5432
   database: aquawatch_geo
   schema: public
   user: aquawatch_user
   passwd: AquaWatch2024!
   ```

6. Paramètres avancés (optionnel):
   - **max connections**: 10
   - **min connections**: 1
   - **validate connections**: ☑️ Coché

7. Cliquez sur **Save**

### 3. Publier la couche "Zones Côtières"

1. Cliquez sur **Layers** dans le menu de gauche
2. Cliquez sur **Add a new layer**
3. Sélectionnez **aquawatch:aquawatch_geo_db**
4. Trouvez **zones_map** et cliquez sur **Publish**

5. **Onglet Data**:
   - **Name**: `zones_cotieres`
   - **Title**: `Zones Côtières Marocaines`
   - **Abstract**: `10 zones côtières du Maroc avec qualité d'eau`
   - **Native SRS**: `EPSG:4326`
   - **Declared SRS**: `EPSG:4326`
   - **SRS Handling**: `Force declared`

6. **Compute from data** pour:
   - Native Bounding Box
   - Lat/Lon Bounding Box

7. **Onglet Publishing**:
   - **Default Style**: `polygon`

8. **Onglet Tile Caching**:
   - ☑️ Enable tile caching for this layer

9. Cliquez sur **Save**

### 4. Publier la couche "Points d'Intérêt (Capteurs)"

1. Retournez à **Layers** > **Add a new layer**
2. Sélectionnez **aquawatch:aquawatch_geo_db**
3. Trouvez **poi_map** et cliquez sur **Publish**

4. **Onglet Data**:
   - **Name**: `capteurs`
   - **Title**: `Capteurs de Qualité d'Eau`
   - **Abstract**: `Points de mesure des capteurs AquaWatch`
   - **Native SRS**: `EPSG:4326`
   - **Declared SRS**: `EPSG:4326`
   - **SRS Handling**: `Force declared`

5. **Compute from data** pour les bounding boxes

6. **Onglet Publishing**:
   - **Default Style**: `point`

7. Cliquez sur **Save**

---

## 🎨 Créer des Styles Personnalisés (Optionnel)

### Style pour Zones (qualité d'eau)

1. Allez dans **Styles** > **Add a new style**
2. **Name**: `qualite_eau_zones`
3. **Workspace**: `aquawatch`
4. **Format**: `SLD`

5. Collez ce SLD:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld">
  <NamedLayer>
    <Name>Zones Qualité Eau</Name>
    <UserStyle>
      <Title>Style Qualité Eau</Title>
      <FeatureTypeStyle>
        <!-- Qualité BONNE - Vert -->
        <Rule>
          <Name>Bonne</Name>
          <Title>Qualité Bonne</Title>
          <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>qualite_actuelle</ogc:PropertyName>
              <ogc:Literal>BONNE</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#4ade80</CssParameter>
              <CssParameter name="fill-opacity">0.5</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#22c55e</CssParameter>
              <CssParameter name="stroke-width">2</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
        
        <!-- Qualité MOYENNE - Jaune -->
        <Rule>
          <Name>Moyenne</Name>
          <Title>Qualité Moyenne</Title>
          <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>qualite_actuelle</ogc:PropertyName>
              <ogc:Literal>MOYENNE</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#facc15</CssParameter>
              <CssParameter name="fill-opacity">0.5</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#eab308</CssParameter>
              <CssParameter name="stroke-width">2</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
        
        <!-- Qualité MAUVAISE - Rouge -->
        <Rule>
          <Name>Mauvaise</Name>
          <Title>Qualité Mauvaise</Title>
          <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>qualite_actuelle</ogc:PropertyName>
              <ogc:Literal>MAUVAISE</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#f87171</CssParameter>
              <CssParameter name="fill-opacity">0.5</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#ef4444</CssParameter>
              <CssParameter name="stroke-width">2</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
        
        <!-- Qualité INCONNUE - Gris -->
        <Rule>
          <Name>Inconnue</Name>
          <Title>Qualité Inconnue</Title>
          <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>qualite_actuelle</ogc:PropertyName>
              <ogc:Literal>INCONNUE</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#9ca3af</CssParameter>
              <CssParameter name="fill-opacity">0.5</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#6b7280</CssParameter>
              <CssParameter name="stroke-width">2</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
```

6. Cliquez sur **Validate** puis **Submit**

7. Retournez dans **Layers** > `zones_cotieres` > Onglet **Publishing**
8. Changez **Default Style** en `qualite_eau_zones`
9. **Save**

---

## 🧪 Tester les Couches WMS

### 1. Via Layer Preview

1. Allez dans **Layer Preview**
2. Trouvez `aquawatch:zones_cotieres`
3. Cliquez sur **OpenLayers** pour voir la carte interactive

### 2. Via URL WMS

**GetCapabilities**:
```
http://localhost:8080/geoserver/aquawatch/wms?service=WMS&version=1.1.0&request=GetCapabilities
```

**GetMap (Zones)**:
```
http://localhost:8080/geoserver/aquawatch/wms?
  service=WMS
  &version=1.1.0
  &request=GetMap
  &layers=aquawatch:zones_cotieres
  &styles=
  &bbox=-10.5,29.0,-4.5,36.5
  &width=768
  &height=768
  &srs=EPSG:4326
  &format=image/png
```

**GetMap (Capteurs)**:
```
http://localhost:8080/geoserver/aquawatch/wms?
  service=WMS
  &version=1.1.0
  &request=GetMap
  &layers=aquawatch:capteurs
  &styles=
  &bbox=-10.5,29.0,-4.5,36.5
  &width=768
  &height=768
  &srs=EPSG:4326
  &format=image/png
```

### 3. Via PowerShell

```powershell
# Tester GetCapabilities
Invoke-WebRequest -Uri "http://localhost:8080/geoserver/aquawatch/wms?service=WMS&version=1.1.0&request=GetCapabilities" -OutFile capabilities.xml

# Télécharger une image de carte
Invoke-WebRequest -Uri "http://localhost:8080/geoserver/aquawatch/wms?service=WMS&version=1.1.0&request=GetMap&layers=aquawatch:zones_cotieres&bbox=-10.5,29.0,-4.5,36.5&width=800&height=600&srs=EPSG:4326&format=image/png" -OutFile carte_zones.png

# Ouvrir l'image
Start-Process carte_zones.png
```

---

## 📡 Intégrer WMS dans Leaflet

Ajoutez cette couche WMS dans votre interface Leaflet:

```javascript
// Ajouter la couche WMS GeoServer
const wmsZones = L.tileLayer.wms('http://localhost:8080/geoserver/aquawatch/wms', {
    layers: 'aquawatch:zones_cotieres',
    format: 'image/png',
    transparent: true,
    attribution: 'AquaWatch GeoServer'
});

const wmsCapteurs = L.tileLayer.wms('http://localhost:8080/geoserver/aquawatch/wms', {
    layers: 'aquawatch:capteurs',
    format: 'image/png',
    transparent: true,
    attribution: 'AquaWatch GeoServer'
});

// Ajouter au contrôle des couches
const overlayMaps = {
    "Zones (WMS)": wmsZones,
    "Capteurs (WMS)": wmsCapteurs
};

L.control.layers(baseMaps, overlayMaps).addTo(map);
```

---

## ✅ Vérification

Une fois configuré, vous devriez pouvoir:

- ✅ Voir les couches dans Layer Preview
- ✅ Accéder aux URLs WMS GetCapabilities
- ✅ Obtenir des images PNG via GetMap
- ✅ Interroger les données via GetFeatureInfo
- ✅ Intégrer dans Leaflet.js

---

## 🔧 Troubleshooting

### Erreur "Could not connect to PostgreSQL"
```bash
# Vérifier que db_geo est accessible
docker exec -it aquawatch-ms-geoserver-1 ping db_geo

# Vérifier les credentials
docker exec -i aquawatch-ms-db_geo-1 psql -U aquawatch_user -d aquawatch_geo -c "SELECT version();"
```

### Couche vide / Pas de données
```sql
-- Vérifier que les tables ont des données
SELECT COUNT(*) FROM zones_map;
SELECT COUNT(*) FROM poi_map;

-- Vérifier les géométries
SELECT zone_id, ST_AsText(geometry) FROM zones_map LIMIT 1;
```

### Style ne s'applique pas
- Vérifiez que le champ `qualite_actuelle` existe
- Vérifiez les valeurs: `BONNE`, `MOYENNE`, `MAUVAISE`, `INCONNUE`
- Utilisez **Validate** dans l'éditeur de style

---

**Configuration complétée!** 🎉
