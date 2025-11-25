const express = require('express');
const router = express.Router();
const Zone = require('../models/Zone');
const PointInteret = require('../models/PointInteret');
const sequelize = require('../config/database');
const capteurSyncService = require('../services/capteurSyncService');
const predictionListener = require('../services/predictionListener');

// 🗺️ GET /api/map/zones - Récupérer toutes les zones avec leur géométrie en GeoJSON
router.get('/zones', async (req, res) => {
    try {
        const zones = await sequelize.query(`
            SELECT 
                zone_id,
                nom,
                type,
                ST_AsGeoJSON(geometry)::json as geometry,
                centre_lat,
                centre_lon,
                qualite_actuelle,
                derniere_mise_a_jour,
                actif
            FROM zones_map
            WHERE actif = true
            ORDER BY type, nom
        `, {
            type: sequelize.QueryTypes.SELECT
        });

        // Format GeoJSON
        const geojson = {
            type: 'FeatureCollection',
            features: zones.map(zone => ({
                type: 'Feature',
                id: zone.zone_id,
                properties: {
                    nom: zone.nom,
                    type: zone.type,
                    qualite: zone.qualite_actuelle,
                    derniere_maj: zone.derniere_mise_a_jour,
                    centre: [zone.centre_lon, zone.centre_lat]
                },
                geometry: zone.geometry
            }))
        };

        res.json(geojson);
    } catch (error) {
        console.error('❌ Erreur récupération zones:', error);
        res.status(500).json({ error: error.message });
    }
});

// 📍 GET /api/map/points - Récupérer tous les points d'intérêt (capteurs, ports, plages)
router.get('/points', async (req, res) => {
    try {
        const { type } = req.query;

        let whereClause = 'WHERE actif = true';
        if (type) {
            whereClause += ` AND type = '${type}'`;
        }

        const points = await sequelize.query(`
            SELECT 
                poi_id,
                nom,
                type,
                ST_AsGeoJSON(position)::json as position,
                latitude,
                longitude,
                capteur_id,
                description,
                actif
            FROM poi_map
            ${whereClause}
            ORDER BY type, nom
        `, {
            type: sequelize.QueryTypes.SELECT
        });

        // Format GeoJSON
        const geojson = {
            type: 'FeatureCollection',
            features: points.map(point => ({
                type: 'Feature',
                id: point.poi_id,
                properties: {
                    nom: point.nom,
                    type: point.type,
                    capteur_id: point.capteur_id,
                    description: point.description
                },
                geometry: point.position
            }))
        };

        res.json(geojson);
    } catch (error) {
        console.error('❌ Erreur récupération points:', error);
        res.status(500).json({ error: error.message });
    }
});

// 🔄 POST /api/map/update-zone - Mettre à jour la qualité d'une zone
router.post('/update-zone', async (req, res) => {
    try {
        const { latitude, longitude, qualite } = req.body;

        if (!latitude || !longitude || !qualite) {
            return res.status(400).json({ error: 'latitude, longitude et qualite requis' });
        }

        // Trouver la zone contenant ce point
        const result = await sequelize.query(`
            UPDATE zones_map
            SET 
                qualite_actuelle = :qualite,
                derniere_mise_a_jour = NOW()
            WHERE ST_Contains(
                geometry,
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
            )
            AND actif = true
            RETURNING zone_id, nom, qualite_actuelle
        `, {
            replacements: { latitude, longitude, qualite },
            type: sequelize.QueryTypes.UPDATE
        });

        if (result && result[0] && result[0].length > 0) {
            const updatedZone = result[0][0];
            res.json({
                success: true,
                zone: updatedZone,
                message: `Zone ${updatedZone.nom} mise à jour: ${updatedZone.qualite_actuelle}`
            });
        } else {
            res.json({
                success: false,
                message: 'Aucune zone trouvée pour ces coordonnées'
            });
        }
    } catch (error) {
        console.error('❌ Erreur mise à jour zone:', error);
        res.status(500).json({ error: error.message });
    }
});

// 🎯 GET /api/map/zone-at - Trouver la zone à des coordonnées données
router.get('/zone-at', async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: 'lat et lon requis' });
        }

        const zones = await sequelize.query(`
            SELECT 
                zone_id,
                nom,
                type,
                qualite_actuelle,
                derniere_mise_a_jour
            FROM zones_map
            WHERE ST_Contains(
                geometry,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
            )
            AND actif = true
            ORDER BY type
        `, {
            replacements: { lat: parseFloat(lat), lon: parseFloat(lon) },
            type: sequelize.QueryTypes.SELECT
        });

        if (zones.length > 0) {
            res.json(zones[0]);
        } else {
            res.json({ message: 'Aucune zone trouvée' });
        }
    } catch (error) {
        console.error('❌ Erreur recherche zone:', error);
        res.status(500).json({ error: error.message });
    }
});

// 📊 GET /api/map/stats - Statistiques des zones
router.get('/stats', async (req, res) => {
    try {
        const stats = await sequelize.query(`
            SELECT 
                COUNT(*) as total_zones,
                COUNT(CASE WHEN qualite_actuelle = 'BONNE' THEN 1 END) as zones_bonnes,
                COUNT(CASE WHEN qualite_actuelle = 'MOYENNE' THEN 1 END) as zones_moyennes,
                COUNT(CASE WHEN qualite_actuelle = 'MAUVAISE' THEN 1 END) as zones_mauvaises,
                COUNT(CASE WHEN qualite_actuelle = 'INCONNU' THEN 1 END) as zones_inconnues,
                (SELECT COUNT(*) FROM poi_map WHERE actif = true) as total_points
            FROM zones_map
            WHERE actif = true
        `, {
            type: sequelize.QueryTypes.SELECT
        });

        res.json(stats[0]);
    } catch (error) {
        console.error('❌ Erreur stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// 🔄 POST /api/map/sync-capteurs - Synchroniser les capteurs depuis l'API de Bilal
router.post('/sync-capteurs', async (req, res) => {
    try {
        console.log('📡 Starting capteur synchronization...');
        const result = await capteurSyncService.syncCapteurs();
        
        if (result.success) {
            res.json({
                message: 'Synchronisation réussie',
                ...result
            });
        } else {
            res.status(503).json({
                message: 'Service capteurs non disponible',
                ...result
            });
        }
    } catch (error) {
        console.error('❌ Erreur sync capteurs:', error);
        res.status(500).json({ 
            error: error.message,
            message: 'Erreur lors de la synchronisation des capteurs'
        });
    }
});

// 🔍 GET /api/map/capteur-api-status - Vérifier le statut de l'API capteurs
router.get('/capteur-api-status', async (req, res) => {
    try {
        const status = await capteurSyncService.checkCapteurApiStatus();
        res.json(status);
    } catch (error) {
        console.error('❌ Erreur vérification API capteurs:', error);
        res.status(500).json({ error: error.message });
    }
});

// 📡 GET /api/map/redis-listener-status - Vérifier le statut du listener Redis
router.get('/redis-listener-status', (req, res) => {
    try {
        const isActive = predictionListener.isActive();
        res.json({
            active: isActive,
            channel: 'new_prediction',
            status: isActive ? 'listening' : 'not_subscribed'
        });
    } catch (error) {
        console.error('❌ Erreur vérification listener Redis:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
