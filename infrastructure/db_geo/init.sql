-- Base de données dédiée GÉOGRAPHIQUE (Yassin)
-- Optimisée pour cartographie et données spatiales

-- Extension PostGIS (déjà incluse dans l'image postgis/postgis)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table des zones géographiques
CREATE TABLE IF NOT EXISTS zones_map (
    id SERIAL PRIMARY KEY,
    zone_id VARCHAR(50) UNIQUE NOT NULL,
    zone_name VARCHAR(100),
    zone_geom GEOMETRY(POLYGON, 4326), -- Polygone de la zone
    center_point GEOMETRY(POINT, 4326), -- Point central
    zone_type VARCHAR(50), -- 'water_body', 'monitoring_area', 'administrative'
    administrative_level VARCHAR(50), -- 'region', 'province', 'commune'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des points d'intérêt (capteurs, points de prélèvement)
CREATE TABLE IF NOT EXISTS poi_map (
    id SERIAL PRIMARY KEY,
    poi_id VARCHAR(50) UNIQUE NOT NULL,
    poi_name VARCHAR(100),
    poi_type VARCHAR(50), -- 'sensor', 'sampling_point', 'alert_zone'
    location GEOMETRY(POINT, 4326),
    zone_id VARCHAR(50) REFERENCES zones_map(zone_id),
    metadata JSONB, -- Informations additionnelles
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table de l'état des zones (couleurs, status)
CREATE TABLE IF NOT EXISTS zone_status (
    id SERIAL PRIMARY KEY,
    zone_id VARCHAR(50) REFERENCES zones_map(zone_id),
    status_color VARCHAR(20), -- 'green', 'yellow', 'orange', 'red'
    quality_score DECIMAL(5,2), -- Score 0-100
    prediction_id VARCHAR(50), -- Référence prédiction qui a défini le status
    last_updated TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP, -- Validité du status
    status_data JSONB -- Données détaillées du status
);

-- Index spatiaux (performance géographique)
CREATE INDEX IF NOT EXISTS idx_zones_geom ON zones_map USING GIST(zone_geom);
CREATE INDEX IF NOT EXISTS idx_zones_center ON zones_map USING GIST(center_point);
CREATE INDEX IF NOT EXISTS idx_poi_location ON poi_map USING GIST(location);

-- Index classiques
CREATE INDEX IF NOT EXISTS idx_zone_status_updated ON zone_status(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_poi_type ON poi_map(poi_type);

-- Zones géographiques du Maroc (principales régions)
INSERT INTO zones_map (zone_id, zone_name, center_point, zone_type, administrative_level) VALUES
('ZONE_RABAT', 'Région Rabat-Salé-Kénitra', ST_SetSRID(ST_MakePoint(-6.841650, 34.020882), 4326), 'administrative', 'region'),
('ZONE_CASA', 'Région Casablanca-Settat', ST_SetSRID(ST_MakePoint(-7.639133, 33.606892), 4326), 'administrative', 'region'),
('ZONE_FES', 'Région Fès-Meknès', ST_SetSRID(ST_MakePoint(-4.999448, 34.037732), 4326), 'administrative', 'region')
ON CONFLICT (zone_id) DO NOTHING;

-- Points d'intérêt (capteurs)
INSERT INTO poi_map (poi_id, poi_name, poi_type, location, zone_id, metadata) VALUES
('POI_CAP001', 'Capteur Rabat Centre', 'sensor', ST_SetSRID(ST_MakePoint(-6.841650, 34.020882), 4326), 'ZONE_RABAT', '{"capteur_id": "CAP001", "type": "multiparameter"}'),
('POI_CAP002', 'Capteur Casablanca Port', 'sensor', ST_SetSRID(ST_MakePoint(-7.639133, 33.606892), 4326), 'ZONE_CASA', '{"capteur_id": "CAP002", "type": "multiparameter"}'),
('POI_CAP003', 'Capteur Fès Ville', 'sensor', ST_SetSRID(ST_MakePoint(-4.999448, 34.037732), 4326), 'ZONE_FES', '{"capteur_id": "CAP003", "type": "multiparameter"}')
ON CONFLICT (poi_id) DO NOTHING;

-- Status initial des zones (vert par défaut)
INSERT INTO zone_status (zone_id, status_color, quality_score, valid_until) VALUES
('ZONE_RABAT', 'green', 85.0, NOW() + INTERVAL '24 hours'),
('ZONE_CASA', 'green', 78.0, NOW() + INTERVAL '24 hours'),
('ZONE_FES', 'green', 82.0, NOW() + INTERVAL '24 hours')
ON CONFLICT DO NOTHING;

-- Vues utiles pour l'API cartographique
CREATE OR REPLACE VIEW v_map_zones_current AS
SELECT 
    z.zone_id,
    z.zone_name,
    ST_AsGeoJSON(z.center_point) as center_coordinates,
    zs.status_color,
    zs.quality_score,
    zs.last_updated
FROM zones_map z
LEFT JOIN zone_status zs ON z.zone_id = zs.zone_id
WHERE zs.valid_until > NOW() OR zs.valid_until IS NULL;

CREATE OR REPLACE VIEW v_map_sensors AS
SELECT 
    poi_id,
    poi_name,
    ST_AsGeoJSON(location) as coordinates,
    metadata->>'capteur_id' as capteur_id,
    is_active
FROM poi_map 
WHERE poi_type = 'sensor';

-- Fonction pour trouver zones dans un rayon
CREATE OR REPLACE FUNCTION zones_within_radius(center_lat DECIMAL, center_lng DECIMAL, radius_km INTEGER)
RETURNS TABLE(zone_id VARCHAR, zone_name VARCHAR, distance_km DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        z.zone_id,
        z.zone_name,
        ROUND(ST_Distance(ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography, z.center_point::geography) / 1000, 2) as distance_km
    FROM zones_map z
    WHERE ST_DWithin(
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
        z.center_point::geography,
        radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;