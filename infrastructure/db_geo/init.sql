-- Base de données dédiée GÉOGRAPHIQUE (Yassin)
-- Optimisée pour cartographie et données spatiales

-- Extension PostGIS (déjà incluse dans l'image postgis/postgis)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table des zones géographiques avec qualité de l'eau
CREATE TABLE IF NOT EXISTS zones_map (
    zone_id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'ville' CHECK (type IN ('ville', 'region')),
    geometry GEOMETRY(POLYGON, 4326) NOT NULL,
    centre_lat DECIMAL(10, 8) NOT NULL,
    centre_lon DECIMAL(11, 8) NOT NULL,
    qualite_actuelle VARCHAR(20) DEFAULT 'INCONNU' CHECK (qualite_actuelle IN ('BONNE', 'MOYENNE', 'MAUVAISE', 'INCONNU')),
    derniere_mise_a_jour TIMESTAMP,
    actif BOOLEAN DEFAULT TRUE
);

-- Index spatial pour les zones
CREATE INDEX IF NOT EXISTS idx_zone_geometry ON zones_map USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_zone_qualite ON zones_map (qualite_actuelle);

-- Table des points d'intérêt (capteurs, ports, plages)
CREATE TABLE IF NOT EXISTS poi_map (
    poi_id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'capteur' CHECK (type IN ('capteur', 'port', 'plage', 'autre')),
    position GEOMETRY(POINT, 4326) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    capteur_id VARCHAR(50),
    description TEXT,
    actif BOOLEAN DEFAULT TRUE
);

-- Index spatial pour les points
CREATE INDEX IF NOT EXISTS idx_poi_position ON poi_map USING GIST (position);
CREATE INDEX IF NOT EXISTS idx_poi_type ON poi_map (type);
-- Données initiales: Zones géographiques du Maroc (côte Atlantique)

-- 🌊 AGADIR
INSERT INTO zones_map (nom, type, geometry, centre_lat, centre_lon, qualite_actuelle) VALUES
('Agadir', 'ville', ST_SetSRID(ST_GeomFromText('POLYGON((-9.65 30.35, -9.50 30.35, -9.50 30.50, -9.65 30.50, -9.65 30.35))'), 4326), 30.4278, -9.5981, 'INCONNU');

-- 🌊 ESSAOUIRA
INSERT INTO zones_map (nom, type, geometry, centre_lat, centre_lon, qualite_actuelle) VALUES
('Essaouira', 'ville', ST_SetSRID(ST_GeomFromText('POLYGON((-9.80 31.45, -9.65 31.45, -9.65 31.60, -9.80 31.60, -9.80 31.45))'), 4326), 31.5085, -9.7595, 'INCONNU');

-- 🌊 SAFI
INSERT INTO zones_map (nom, type, geometry, centre_lat, centre_lon, qualite_actuelle) VALUES
('Safi', 'ville', ST_SetSRID(ST_GeomFromText('POLYGON((-9.30 32.20, -9.15 32.20, -9.15 32.35, -9.30 32.35, -9.30 32.20))'), 4326), 32.2994, -9.2372, 'INCONNU');

-- 🌊 EL JADIDA
INSERT INTO zones_map (nom, type, geometry, centre_lat, centre_lon, qualite_actuelle) VALUES
('El Jadida', 'ville', ST_SetSRID(ST_GeomFromText('POLYGON((-8.60 33.15, -8.45 33.15, -8.45 33.30, -8.60 33.30, -8.60 33.15))'), 4326), 33.2316, -8.5007, 'INCONNU');

-- 🌊 CASABLANCA
INSERT INTO zones_map (nom, type, geometry, centre_lat, centre_lon, qualite_actuelle) VALUES
('Casablanca', 'ville', ST_SetSRID(ST_GeomFromText('POLYGON((-7.75 33.45, -7.50 33.45, -7.50 33.65, -7.75 33.65, -7.75 33.45))'), 4326), 33.5731, -7.5898, 'INCONNU');

-- 🌊 MOHAMMEDIA
INSERT INTO zones_map (nom, type, geometry, centre_lat, centre_lon, qualite_actuelle) VALUES
('Mohammedia', 'ville', ST_SetSRID(ST_GeomFromText('POLYGON((-7.50 33.65, -7.30 33.65, -7.30 33.75, -7.50 33.75, -7.50 33.65))'), 4326), 33.6866, -7.3830, 'INCONNU');

-- 🌊 RABAT
INSERT INTO zones_map (nom, type, geometry, centre_lat, centre_lon, qualite_actuelle) VALUES
('Rabat', 'ville', ST_SetSRID(ST_GeomFromText('POLYGON((-6.95 33.95, -6.75 33.95, -6.75 34.10, -6.95 34.10, -6.95 33.95))'), 4326), 34.0209, -6.8416, 'INCONNU');

-- 🌊 KENITRA
INSERT INTO zones_map (nom, type, geometry, centre_lat, centre_lon, qualite_actuelle) VALUES
('Kénitra', 'ville', ST_SetSRID(ST_GeomFromText('POLYGON((-6.70 34.20, -6.50 34.20, -6.50 34.35, -6.70 34.35, -6.70 34.20))'), 4326), 34.2610, -6.5889, 'INCONNU');

-- 🌊 LARACHE
INSERT INTO zones_map (nom, type, geometry, centre_lat, centre_lon, qualite_actuelle) VALUES
('Larache', 'ville', ST_SetSRID(ST_GeomFromText('POLYGON((-6.25 35.10, -6.05 35.10, -6.05 35.25, -6.25 35.25, -6.25 35.10))'), 4326), 35.1932, -6.1560, 'INCONNU');

-- 🌊 TANGER
INSERT INTO zones_map (nom, type, geometry, centre_lat, centre_lon, qualite_actuelle) VALUES
('Tanger', 'ville', ST_SetSRID(ST_GeomFromText('POLYGON((-5.95 35.70, -5.70 35.70, -5.70 35.85, -5.95 35.85, -5.95 35.70))'), 4326), 35.7595, -5.8340, 'INCONNU');

-- 📍 Capteurs d'exemple
INSERT INTO poi_map (nom, type, position, latitude, longitude, capteur_id, description) VALUES
('Capteur Agadir Port', 'capteur', ST_SetSRID(ST_MakePoint(-9.6347, 30.4202), 4326), 30.4202, -9.6347, 'CAP_AGD_001', 'Capteur principal du port d''Agadir'),
('Capteur Casablanca Marina', 'capteur', ST_SetSRID(ST_MakePoint(-7.6184, 33.5928), 4326), 33.5928, -7.6184, 'CAP_CAS_001', 'Capteur marina de Casablanca'),
('Capteur Rabat Plage', 'capteur', ST_SetSRID(ST_MakePoint(-6.8498, 34.0301), 4326), 34.0301, -6.8498, 'CAP_RAB_001', 'Capteur plage de Rabat'),
('Capteur Tanger Port', 'capteur', ST_SetSRID(ST_MakePoint(-5.8092, 35.7681), 4326), 35.7681, -5.8092, 'CAP_TAN_001', 'Capteur du port de Tanger');

-- Message de fin
SELECT 'Base de données GEO initialisée avec succès!' as message;

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