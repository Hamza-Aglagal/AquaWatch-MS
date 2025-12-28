-- Base de données dédiée PREDICTIONS (Hamza)
-- Optimisée pour Machine Learning et prédictions

-- Table des modèles ML
CREATE TABLE IF NOT EXISTS ml_models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    model_type VARCHAR(50), -- 'regression', 'classification', 'neural_network'
    accuracy DECIMAL(5,4),
    parameters JSONB, -- Hyperparamètres du modèle
    training_data_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT FALSE,
    UNIQUE(model_name, model_version)
);

-- Table des prédictions
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    prediction_id VARCHAR(50) UNIQUE NOT NULL,
    model_id INTEGER REFERENCES ml_models(id),
    zone_latitude DECIMAL(10,8) NOT NULL,
    zone_longitude DECIMAL(11,8) NOT NULL,
    input_data JSONB, -- Données capteurs/satellite utilisées
    prediction_results JSONB, -- Résultats de prédiction
    confidence_score DECIMAL(5,4),
    prediction_horizon INTEGER, -- Heures dans le futur (24h, 48h, 72h)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table historique des entraînements
CREATE TABLE IF NOT EXISTS training_logs (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES ml_models(id),
    training_start TIMESTAMP,
    training_end TIMESTAMP,
    data_points_used INTEGER,
    final_accuracy DECIMAL(5,4),
    training_parameters JSONB,
    status VARCHAR(20) DEFAULT 'completed' -- 'running', 'completed', 'failed'
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_predictions_zone ON predictions(zone_latitude, zone_longitude);
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_id ON predictions(prediction_id);

-- Données de test - Modèle par défaut
INSERT INTO ml_models (model_name, model_version, model_type, accuracy, is_active) VALUES
('water_quality_v1', '1.0.0', 'regression', 0.8500, TRUE),
('pollution_risk_v1', '1.0.0', 'classification', 0.7800, TRUE)
ON CONFLICT (model_name, model_version) DO NOTHING;

-- Vue pour prédictions récentes
CREATE OR REPLACE VIEW v_latest_predictions AS
SELECT 
    prediction_id,
    zone_latitude,
    zone_longitude,
    prediction_results,
    confidence_score,
    created_at
FROM predictions 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;