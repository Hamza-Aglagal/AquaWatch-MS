#!/usr/bin/env node
const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://redis_queue:6379';
const redis = new Redis(redisUrl);

// Payload avec BONNE qualité - ne devrait PAS créer d'alerte
const payload = {
  prediction_id: `TEST_GOOD_${Date.now()}`,
  zone: {
    latitude: 34.0 + Math.random(),
    longitude: -6.0 - Math.random()
  },
  predictions: {
    qualite_eau: 'BONNE',
    score_qualite: Number((7.0 + Math.random() * 2.0).toFixed(2))  // Score >= 7.0 (> 4.0)
  },
  confidence: 0.95,
  timestamp: new Date().toISOString()
};

redis.publish('new_prediction', JSON.stringify(payload))
  .then(receivers => {
    console.log('Published to channel `new_prediction`, receivers:', receivers);
    console.log('Payload:', JSON.stringify(payload));
    redis.quit();
  })
  .catch(err => {
    console.error('Error publishing:', err);
    redis.quit();
    process.exit(1);
  });
