const nodemailer = require('nodemailer');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const Alert = require('../models/Alert');
const AlertRecipient = require('../models/AlertRecipient');

class AlertService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            },
            tls: {
                // Disable certificate validation for Docker/Windows environments
                rejectUnauthorized: false
            }
        });
    }

    async createAlert(alertData) {
        try {
            // Generate alert_id if not present
            if (!alertData.alert_id) {
                alertData.alert_id = `ALERT_${Date.now()}_${uuidv4().slice(0,8)}`;
            }
            
            // Ensure required DB columns are present (severity is NOT NULL in DB)
            if (!alertData.severity) {
                alertData.severity = 'medium';
            }
            
            // Store extra data in alert_data JSONB field
            alertData.alert_data = {
                type: alertData.type,
                message: alertData.message,
                score_qualite: alertData.score_qualite
            };

            // Create alert in database (initial status is 'pending')
            const alert = await Alert.create(alertData);
            console.log('Alert created (Sequelize):', alert.toJSON());

            // Find active recipients for this zone
            const recipients = await AlertRecipient.findAll({ where: { is_active: true } });
            console.log(`Found ${recipients.length} active recipients`);

            // If email sending is enabled, attempt deliveries and collect results
            if (process.env.EMAIL_ENABLED === 'true') {
                console.log('EMAIL_ENABLED is true, attempting to send emails...');
                let failCount = 0;
                let successCount = 0;
                
                for (const recipient of recipients) {
                    try {
                        console.log(`Sending email to: ${recipient.email}`);
                        await this.sendEmailNotification(recipient.email, alert);
                        successCount += 1;
                        console.log(`✅ Email sent successfully to: ${recipient.email}`);
                    } catch (err) {
                        failCount += 1;
                        console.error(`❌ Failed to send email to ${recipient.email}:`, err.message);
                    }
                }

                console.log(`Email delivery summary: ${successCount} sent, ${failCount} failed out of ${recipients.length} total`);

                // Set alert status based on delivery results
                if (recipients.length === 0) {
                    console.log('No recipients found, marking alert as failed');
                    await alert.update({ status: 'failed' });
                } else if (failCount > 0 && successCount === 0) {
                    console.log('All emails failed, marking alert as failed');
                    await alert.update({ status: 'failed' });
                } else if (successCount > 0) {
                    console.log('At least one email sent successfully, marking alert as sent');
                    await alert.update({ status: 'sent' });
                }
            } else {
                console.log('EMAIL_ENABLED not set to true - skipping sending emails');
                // Keep status as 'pending' until real deliveries are attempted
            }

            return alert;
        } catch (error) {
            console.error('Error creating alert:', error);
            // If DB alert was created but code failed later, try to mark failed
            try {
                if (error && error.alert && error.alert.update) {
                    await error.alert.update({ status: 'failed' });
                }
            } catch (err) {
                // ignore
            }
            throw error;
        }
    }

    async sendEmailNotification(email, alert) {
        // Format date in French locale
        const dateOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Africa/Casablanca'
        };
        const formattedDate = new Date(alert.created_at).toLocaleDateString('fr-FR', dateOptions);
        
        // Get location name using reverse geocoding approximation
        const lat = parseFloat(alert.zone_latitude);
        const lon = parseFloat(alert.zone_longitude);
        const locationName = this.getLocationName(lat, lon);
        
        // Determine severity level in French
        const severityText = {
            'low': '🟢 Faible',
            'medium': '🟡 Moyenne',
            'high': '🔴 Élevée',
            'critical': '🔴 Critique'
        }[alert.severity] || '🟡 Moyenne';

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: `🚨 Alerte Qualité Eau - ${locationName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                        .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
                        .info-row { margin: 10px 0; padding: 8px; background: white; border-radius: 5px; }
                        .label { font-weight: bold; color: #667eea; }
                        .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; }
                        .map-link { color: #667eea; text-decoration: none; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🌊 AquaWatch - Alerte Qualité Eau</h2>
                        </div>
                        <div class="content">
                            <div class="alert-box">
                                <h3>⚠️ ${alert.type.replace(/_/g, ' ')}</h3>
                                <p>${alert.message}</p>
                            </div>
                            
                            <div class="info-row">
                                <span class="label">📍 Localisation:</span> ${locationName}
                            </div>
                            
                            <div class="info-row">
                                <span class="label">🗺️ Coordonnées:</span> 
                                <a href="https://www.google.com/maps?q=${lat},${lon}" class="map-link" target="_blank">
                                    ${lat.toFixed(6)}°N, ${lon.toFixed(6)}°W
                                </a>
                            </div>
                            
                            <div class="info-row">
                                <span class="label">📊 Score Qualité:</span> ${alert.score_qualite}/10
                            </div>
                            
                            <div class="info-row">
                                <span class="label">⚡ Gravité:</span> ${severityText}
                            </div>
                            
                            <div class="info-row">
                                <span class="label">📅 Date d'alerte:</span> ${formattedDate}
                            </div>
                            
                            <div class="info-row">
                                <span class="label">🆔 Référence:</span> <code>${alert.prediction_id}</code>
                            </div>
                        </div>
                        <div class="footer">
                            <p>AquaWatch - Système de surveillance de la qualité de l'eau</p>
                            <p style="font-size: 12px; margin-top: 10px;">Cet email a été envoyé automatiquement. Ne pas répondre.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        if (process.env.EMAIL_ENABLED !== 'true') {
            console.log(`Skipping email to ${email} (EMAIL_ENABLED!=true)`);
            return;
        }

        try {
            console.log(`Attempting to send email to ${email}...`);
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent successfully! Message ID: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error(`Error sending email to ${email}:`, error.message);
            console.error('Full error:', error);
            throw error;
        }
    }

    getLocationName(lat, lon) {
        // Approximation simple des zones au Maroc avec couverture étendue
        // Dans une vraie application, utiliser une API de reverse geocoding
        const locations = [
            // Région Rabat-Salé-Kénitra
            { name: "Rabat", lat: 34.02, lon: -6.84, radius: 0.15 },
            { name: "Salé", lat: 34.04, lon: -6.82, radius: 0.1 },
            { name: "Témara", lat: 33.93, lon: -6.91, radius: 0.08 },
            { name: "Skhirat", lat: 33.85, lon: -7.03, radius: 0.08 },
            { name: "Bouznika", lat: 33.79, lon: -7.16, radius: 0.08 },
            { name: "Kenitra", lat: 34.26, lon: -6.58, radius: 0.15 },
            { name: "Mehdia", lat: 34.25, lon: -6.67, radius: 0.05 },
            
            // Région Casablanca-Settat
            { name: "Casablanca", lat: 33.57, lon: -7.59, radius: 0.2 },
            { name: "Mohammedia", lat: 33.69, lon: -7.38, radius: 0.1 },
            { name: "Dar Bouazza", lat: 33.53, lon: -7.80, radius: 0.08 },
            { name: "Ain Harrouda", lat: 33.64, lon: -7.45, radius: 0.05 },
            { name: "Azemmour", lat: 33.28, lon: -8.34, radius: 0.08 },
            { name: "El Jadida", lat: 33.23, lon: -8.50, radius: 0.12 },
            
            // Région Marrakech-Safi
            { name: "Safi", lat: 32.30, lon: -9.24, radius: 0.12 },
            { name: "Essaouira", lat: 31.51, lon: -9.77, radius: 0.12 },
            
            // Région Souss-Massa
            { name: "Agadir", lat: 30.42, lon: -9.60, radius: 0.15 },
            { name: "Inezgane", lat: 30.35, lon: -9.55, radius: 0.08 },
            { name: "Tiznit", lat: 29.70, lon: -9.73, radius: 0.1 },
            
            // Région Tanger-Tétouan-Al Hoceima
            { name: "Tanger", lat: 35.77, lon: -5.80, radius: 0.15 },
            { name: "Asilah", lat: 35.46, lon: -6.04, radius: 0.08 },
            { name: "Larache", lat: 35.19, lon: 6.15, radius: 0.1 },
            { name: "Martil", lat: 35.62, lon: -5.27, radius: 0.06 },
            
            // Autres villes côtières
            { name: "Oualidia", lat: 32.73, lon: -9.03, radius: 0.06 },
            { name: "Moulay Bousselham", lat: 34.88, lon: -6.30, radius: 0.05 }
        ];

        for (const loc of locations) {
            const distance = Math.sqrt(
                Math.pow(lat - loc.lat, 2) + Math.pow(lon - loc.lon, 2)
            );
            if (distance < loc.radius) {
                return `${loc.name} (Maroc)`;
            }
        }

        // Zones régionales élargies (longitude: valeurs négatives, donc -8 < -7 < -6)
        if (lat >= 35.0 && lat <= 36.0 && lon >= -6.8 && lon <= -5.5) {
            return "Région de Tanger (Maroc)";
        } else if (lat >= 34.5 && lat <= 35.4 && lon >= -7.2 && lon <= -6.2) {
            return "Région de Kénitra-Nord (Maroc)";
        } else if (lat >= 33.8 && lat <= 34.5 && lon >= -8.0 && lon <= -6.5) {
            return "Région de Rabat-Salé-Kénitra (Maroc)";
        } else if (lat >= 33.4 && lat <= 33.9 && lon >= -8.2 && lon <= -7.2) {
            return "Région du Grand Casablanca (Maroc)";
        } else if (lat >= 33.0 && lat <= 33.5 && lon >= -8.8 && lon <= -8.1) {
            return "Région d'El Jadida (Maroc)";
        } else if (lat >= 32.0 && lat <= 32.6 && lon >= -9.6 && lon <= -9.0) {
            return "Région de Safi (Maroc)";
        } else if (lat >= 31.3 && lat <= 31.8 && lon >= -10.2 && lon <= -9.5) {
            return "Région d'Essaouira (Maroc)";
        } else if (lat >= 30.0 && lat <= 30.7 && lon >= -10.1 && lon <= -9.4) {
            return "Région d'Agadir (Maroc)";
        } else {
            return `Côte Atlantique Marocaine (${lat.toFixed(4)}°N, ${Math.abs(lon).toFixed(4)}°W)`;
        }
    }

    async getAlertHistory(filters = {}) {
        const where = {};

        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.startDate) {
            where.created_at = where.created_at || {};
            where.created_at[Op.gte] = new Date(filters.startDate);
        }
        if (filters.endDate) {
            where.created_at = where.created_at || {};
            where.created_at[Op.lte] = new Date(filters.endDate);
        }
        if (filters.zone_latitude && filters.zone_longitude) {
            // simple exact match — for production consider spatial queries or ranges
            where.zone_latitude = parseFloat(filters.zone_latitude);
            where.zone_longitude = parseFloat(filters.zone_longitude);
        }

        return Alert.findAll({
            where,
            order: [['created_at', 'DESC']],
            limit: 200,
            raw: true
        });
    }
}

module.exports = new AlertService();