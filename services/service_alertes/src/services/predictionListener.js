const Redis = require('ioredis');
const nodemailer = require('nodemailer');
const { createAlert } = require('./alertService');

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
            console.error('JSON.parse failed for payload:', raw);
            throw parseErr;
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
        score_qualite: prediction.predictions.score_qualite
      };

      const alert = await createAlert(alertData);

      // ---- EMAIL (guarded & lazy-import) ----
      const emailEnabled = process.env.EMAIL_ENABLED === 'true';
      if (
        emailEnabled &&
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD
      ) {
        // Lazy import models ONLY if email is enabled
        const { AlertRecipient, AlertDelivery } = require('../models'); // <-- only loads now

        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: false,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          });

          const recipients = await AlertRecipient.findAll({
            where: { active: true },
            attributes: ['email']
          });
          const to = recipients.map(r => r.email).filter(Boolean).join(',');

          if (to) {
            await transporter.sendMail({
              from: process.env.SMTP_USER,
              to,
              subject: 'AquaWatch - Alerte qualité eau',
              text: alertData.message
            });

            await AlertDelivery.create({
              alert_id: alert.alert_id,
              channel: 'email',
              status: 'sent',
              detail: `to=${to}`
            });

            console.log('📧 Email sent to:', to);
          } else {
            console.log('✉️ No active recipients; skipping email');
          }
        } catch (err) {
          console.error('Error sending email:', err);
        }
      } else {
        console.log('✉️ Email skipped (EMAIL_ENABLED not true or SMTP config missing)');
      }
      // ---------------------------------------
    }
  }
}

module.exports = new PredictionListener();
