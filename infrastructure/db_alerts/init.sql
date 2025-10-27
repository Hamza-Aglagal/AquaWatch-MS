-- Base de données dédiée ALERTES (Yassin)
-- Optimisée pour notifications et historique

-- Table des types d'alertes
CREATE TABLE IF NOT EXISTS alert_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    description TEXT,
    email_template TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table des alertes
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(50) UNIQUE NOT NULL,
    alert_type_id INTEGER REFERENCES alert_types(id),
    prediction_id VARCHAR(50), -- Référence à la prédiction qui a déclenché
    zone_latitude DECIMAL(10,8) NOT NULL,
    zone_longitude DECIMAL(11,8) NOT NULL,
    alert_data JSONB, -- Données contextuelles de l'alerte
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'acknowledged'
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    acknowledged_at TIMESTAMP
);

-- Table des destinataires
CREATE TABLE IF NOT EXISTS alert_recipients (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    phone VARCHAR(20),
    name VARCHAR(100),
    zone_latitude DECIMAL(10,8),
    zone_longitude DECIMAL(11,8),
    alert_radius_km INTEGER DEFAULT 5, -- Rayon d'alerte en km
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des envois (historique détaillé)
CREATE TABLE IF NOT EXISTS alert_deliveries (
    id SERIAL PRIMARY KEY,
    alert_id VARCHAR(50) REFERENCES alerts(alert_id),
    recipient_id INTEGER REFERENCES alert_recipients(id),
    delivery_method VARCHAR(20), -- 'email', 'sms', 'push'
    delivery_status VARCHAR(20), -- 'sent', 'delivered', 'failed'
    delivery_response TEXT,
    attempted_at TIMESTAMP DEFAULT NOW(),
    delivered_at TIMESTAMP
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_alerts_zone ON alerts(zone_latitude, zone_longitude);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);

-- Types d'alertes par défaut
INSERT INTO alert_types (type_code, type_name, severity, description) VALUES
('WATER_QUALITY_BAD', 'Qualité eau dégradée', 'high', 'La qualité de l''eau est en dessous des seuils acceptables'),
('PH_CRITICAL', 'pH critique', 'critical', 'Le pH de l''eau est dangereux (< 6 ou > 9)'),
('POLLUTION_RISK', 'Risque de pollution', 'medium', 'Risque de pollution détecté par le modèle prédictif'),
('SENSOR_OFFLINE', 'Capteur hors ligne', 'low', 'Un capteur n''envoie plus de données')
ON CONFLICT (type_code) DO NOTHING;

-- Destinataires par défaut (équipe projet)
INSERT INTO alert_recipients (email, name, zone_latitude, zone_longitude, alert_radius_km) VALUES
('hamza.aglagal@example.com', 'Hamza Aglagal', 34.020882, -6.841650, 50),
('bilal.dev@example.com', 'Bilal Developer', 33.606892, -7.639133, 50),
('yassin.dev@example.com', 'Yassin Developer', 34.037732, -4.999448, 50)
ON CONFLICT DO NOTHING;

-- Vue pour alertes actives
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT 
    a.alert_id,
    at.type_name,
    a.severity,
    a.zone_latitude,
    a.zone_longitude,
    a.status,
    a.created_at
FROM alerts a
JOIN alert_types at ON a.alert_type_id = at.id
WHERE a.status IN ('pending', 'sent')
ORDER BY a.created_at DESC;