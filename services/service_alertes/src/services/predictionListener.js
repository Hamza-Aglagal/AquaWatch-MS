const Redis = require('ioredis');
const alertService = require('./alertService');

class PredictionListener {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.subscribe();
  }

  subscribe() {
    const subscriber = new Redis(process.env.REDIS_URL);

    subscriber.subscribe('new_prediction', (err) => {
      if (err) {
        console.error('Failed to subscribe:', err);
        return;
      }
      console.log('Subscribed to new_prediction channel');
    });

    subscriber.on('message', async (channel, message) => {
      if (channel === 'new_prediction') {
        try {
          // message may arrive wrapped in extra quotes depending on how it was published from PowerShell
          let raw = message instanceof Buffer ? message.toString('utf8') : String(message);
          raw = raw.trim();

          // strip matching surrounding single or double quotes
          if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
            raw = raw.slice(1, -1);
          }

          // log raw for debugging (will help diagnose PowerShell quoting issues)
          console.log('Received raw prediction payload:', raw);
          // Also log escaped form so hidden characters (CR/LF, backslashes) are visible
          console.log('Received raw prediction payload (escaped):', JSON.stringify(raw));

          let prediction;
          try {
            prediction = JSON.parse(raw);
          } catch (parseErr) {
            // Attempt tolerant cleanup for messages produced by PowerShell or JS-like objects
            try {
              let cleaned = raw;
              // Replace single quotes with double quotes
              cleaned = cleaned.replace(/'/g, '"');
              // Quote unquoted object keys: { key: -> { "key":
              cleaned = cleaned.replace(/([\{,\s])([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
              // Quote bare uppercase words used as enum values (e.g. MAUVAISE)
              cleaned = cleaned.replace(/:\s*([A-Z_]+)([,\}])/g, ':"$1"$2');
              // Remove stray backslashes inserted by shells
              cleaned = cleaned.replace(/\\+/g, '\\');
              // Trim leftover wrapping quotes
              if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
                cleaned = cleaned.slice(1, -1);
              }

              console.log('Attempting tolerant JSON parse, cleaned payload:', cleaned);
              prediction = JSON.parse(cleaned);
            } catch (cleanErr) {
              console.error('JSON.parse failed for payload:', raw);
              // preserve original parse error for higher-level logging
              throw parseErr;
            }
          }
          await this.handlePrediction(prediction);
        } catch (error) {
          console.error('Error processing prediction:', error);
        }
      }
    });
  }

  async handlePrediction(prediction) {
    if (
      prediction.predictions.qualite_eau === 'MAUVAISE' ||
      prediction.predictions.score_qualite < 4.0
    ) {
      const alertData = {
        prediction_id: prediction.prediction_id,
        zone_latitude: prediction.zone.latitude,
        zone_longitude: prediction.zone.longitude,
        type: 'QUALITE_EAU_MAUVAISE',
        message: `Alerte : Qualité eau dégradée dans la zone [${prediction.zone.latitude}, ${prediction.zone.longitude}]`,
        score_qualite: prediction.predictions.score_qualite,
        severity: 'medium'
      };

      await alertService.createAlert(alertData);
    }
  }
}

module.exports = new PredictionListener();
