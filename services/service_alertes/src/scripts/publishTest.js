#!/usr/bin/env node
const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://redis_queue:6379';
const redis = new Redis(redisUrl);

function makePayload(suffix = 'SCRIPT') {
  return {
    prediction_id: `SCRIPT_${Date.now()}_${Math.floor(Math.random() * 1000)}_${suffix}`,
    zone: {
      latitude: 34.0 + Math.random() * 2,
      longitude: -6.0 - Math.random() * 2
    },
    predictions: {
      qualite_eau: 'MAUVAISE',
      score_qualite: Number((2.0 + Math.random() * 2.0).toFixed(2))
    },
    confidence: 0.9,
    timestamp: new Date().toISOString()
  };
}

// Accept a JSON string as first arg, otherwise generate a default payload
let payload;
if (process.argv[2]) {
  try {
    payload = JSON.parse(process.argv[2]);
  } catch (err) {
    console.error('Invalid JSON argument:', err.message);
    process.exit(2);
  }
} else {
  payload = makePayload();
}

redis
  .publish('new_prediction', JSON.stringify(payload))
  .then((receivers) => {
    console.log('Published to channel `new_prediction`, receivers:', receivers);
    console.log('Payload:', JSON.stringify(payload));
    redis.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Publish error:', err);
    redis.disconnect();
    process.exit(1);
  });
