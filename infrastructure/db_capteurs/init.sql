-- Base de données dédiée CAPTEURS TimescaleDB (Bilal)
-- Optimisée pour données IoT temps réel avec hypertables

-- Activer extension TimescaleDB (CONFORMITÉ FICHE)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Table des capteurs physiques
CREATE TABLE IF NOT EXISTS capteurs (
    id SERIAL PRIMARY KEY,
    capteur_id VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(100),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    type_capteur VARCHAR(50), -- 'pH', 'temperature', 'multiparameter'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des mesures (optimisée pour time-series)
CREATE TABLE IF NOT EXISTS mesures (
    id SERIAL PRIMARY KEY,
    capteur_id VARCHAR(50) NOT NULL,
    ph DECIMAL(4,2),
    temperature DECIMAL(5,2),
    turbidite DECIMAL(6,2),
    oxygene DECIMAL(5,2),
    conductivite DECIMAL(8,2),
    timestamp TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (capteur_id) REFERENCES capteurs(capteur_id)
);

-- Convertir en hypertable TimescaleDB (OPTIMISATION SÉRIES TEMPORELLES)
SELECT create_hypertable('mesures', 'timestamp', if_not_exists => TRUE);

-- Index pour performance hypertable
CREATE INDEX IF NOT EXISTS idx_mesures_capteur_timestamp ON mesures(capteur_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_capteurs_location ON capteurs(latitude, longitude);

-- Politique de rétention (optionnel - garder 1 an)
SELECT add_retention_policy('mesures', INTERVAL '1 year', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_capteurs_location ON capteurs(latitude, longitude);

-- Données de test
INSERT INTO capteurs (capteur_id, nom, latitude, longitude, type_capteur) VALUES
('CAP001', 'Capteur Rabat Centre', 34.020882, -6.841650, 'multiparameter'),
('CAP002', 'Capteur Casablanca Port', 33.606892, -7.639133, 'multiparameter'),
('CAP003', 'Capteur Fès Ville', 34.037732, -4.999448, 'multiparameter')
ON CONFLICT (capteur_id) DO NOTHING;

-- Vue pour dernières mesures (pour APIs)
CREATE OR REPLACE VIEW v_dernieres_mesures AS
SELECT DISTINCT ON (capteur_id) 
    capteur_id, ph, temperature, turbidite, oxygene, timestamp
FROM mesures 
ORDER BY capteur_id, timestamp DESC;