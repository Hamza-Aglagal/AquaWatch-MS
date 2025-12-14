const Redis = require('ioredis');
const sequelize = require('../config/database');
const Zone = require('../models/Zone');

class PredictionListener {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL || 'redis://redis_queue:6379');
        this.isSubscribed = false;
    }

    /**
     * Démarre l'écoute du canal Redis "new_prediction"
     */
    start() {
        const subscriber = new Redis(process.env.REDIS_URL || 'redis://redis_queue:6379');

        subscriber.subscribe('new_prediction', (err) => {
            if (err) {
                console.error('❌ Failed to subscribe to new_prediction:', err);
                return;
            }
            this.isSubscribed = true;
            console.log('✅ Subscribed to Redis channel: new_prediction');
        });

        subscriber.on('message', async (channel, message) => {
            if (channel === 'new_prediction') {
                try {
                    await this.handlePrediction(message);
                } catch (error) {
                    console.error('❌ Error processing prediction:', error);
                }
            }
        });

        subscriber.on('error', (err) => {
            console.error('❌ Redis subscriber error:', err);
            this.isSubscribed = false;
        });

        subscriber.on('reconnecting', () => {
            console.log('🔄 Redis reconnecting...');
        });
    }

    /**
     * Convert numeric score to quality category
     */
    scoreToQuality(score) {
        if (score >= 7.0) return 'BONNE';
        if (score >= 4.0) return 'MOYENNE';
        return 'MAUVAISE';
    }

    /**
     * Traite une nouvelle prédiction et met à jour la zone correspondante
     * @param {string} message - Message JSON de la prédiction
     */
    async handlePrediction(message) {
        try {
            // Parser le message JSON
            let raw = message instanceof Buffer ? message.toString('utf8') : String(message);
            raw = raw.trim();

            // Nettoyer les guillemets entourants
            if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
                raw = raw.slice(1, -1);
            }

            console.log('📡 Received prediction:', raw.substring(0, 100) + '...');

            let prediction;
            try {
                prediction = JSON.parse(raw);
            } catch (parseErr) {
                console.error('❌ JSON parse failed:', parseErr.message);
                return;
            }

            // Support both nested format (new) and flat format (legacy)
            const latitude = prediction.zone?.latitude || prediction.latitude;
            const longitude = prediction.zone?.longitude || prediction.longitude;
            const qualite_eau = prediction.predictions?.qualite_eau || this.scoreToQuality(prediction.quality_score_real || prediction.quality_score * 10);
            const score_qualite = prediction.predictions?.score_qualite || prediction.quality_score_real || (prediction.quality_score * 10);

            // Validate we have coordinates
            if (!latitude || !longitude) {
                console.warn('⚠️  Invalid prediction structure - missing coordinates');
                return;
            }

            console.log(`📍 Prediction for zone [${latitude}, ${longitude}]: ${qualite_eau} (score: ${score_qualite})`);

            // Trouver la zone la plus proche
            const zone = await this.findNearestZone(latitude, longitude);

            if (!zone) {
                console.log('⚠️  No zone found near this prediction');
                return;
            }

            // Mettre à jour la qualité de la zone
            await this.updateZoneQuality(zone.zone_id, qualite_eau, score_qualite);

            console.log(`✅ Updated zone ${zone.nom} with quality: ${qualite_eau}`);

        } catch (error) {
            console.error('❌ Error in handlePrediction:', error);
        }
    }

    /**
     * Trouve la zone la plus proche d'un point GPS
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object|null>} Zone trouvée ou null
     */
    async findNearestZone(lat, lon) {
        try {
            const result = await sequelize.query(`
                SELECT 
                    zone_id,
                    nom,
                    type,
                    ST_Distance(
                        geometry::geography,
                        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
                    ) as distance_meters
                FROM zones_map
                WHERE actif = true
                ORDER BY distance_meters ASC
                LIMIT 1
            `, {
                replacements: { lat, lon },
                type: sequelize.QueryTypes.SELECT
            });

            if (result && result.length > 0) {
                const zone = result[0];
                console.log(`🎯 Found nearest zone: ${zone.nom} (${Math.round(zone.distance_meters)}m away)`);
                return zone;
            }

            return null;
        } catch (error) {
            console.error('❌ Error finding nearest zone:', error);
            return null;
        }
    }

    /**
     * Met à jour la qualité d'une zone
     * @param {number} zoneId - ID de la zone
     * @param {string} qualite - Qualité (BONNE, MOYENNE, MAUVAISE)
     * @param {number} score - Score de qualité (0-10)
     */
    async updateZoneQuality(zoneId, qualite, score) {
        try {
            await Zone.update(
                {
                    qualite_actuelle: qualite,
                    derniere_mise_a_jour: new Date()
                },
                {
                    where: { zone_id: zoneId }
                }
            );

            console.log(`✅ Zone ${zoneId} updated: ${qualite} (score: ${score})`);
        } catch (error) {
            console.error(`❌ Error updating zone ${zoneId}:`, error);
        }
    }

    /**
     * Vérifie si le listener est actif
     * @returns {boolean}
     */
    isActive() {
        return this.isSubscribed;
    }
}

module.exports = new PredictionListener();
