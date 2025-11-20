const express = require('express');
const router = express.Router();
const alertService = require('../services/alertService');

// Get alert history
router.get('/history', async (req, res) => {
    try {
        // Accept optional filters via query string: type, startDate, endDate, zone_latitude, zone_longitude
        const filters = req.query || {};
        const alerts = await alertService.getAlertHistory(filters);
        res.json({ alerts });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alert history' });
    }
});

// Test alert creation
router.post('/test', async (req, res) => {
    try {
        const testAlert = {
            prediction_id: 'TEST_PRED_001',
            zone_latitude: 34.020882,
            zone_longitude: -6.841650,
            type: 'TEST_ALERT',
            message: 'This is a test alert',
            score_qualite: 3.5
        };

        const alert = await alertService.createAlert(testAlert);
        res.json({ status: 'success', alert });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create test alert' });
    }
});

module.exports = router;