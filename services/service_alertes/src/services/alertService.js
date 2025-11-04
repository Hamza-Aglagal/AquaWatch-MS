const nodemailer = require('nodemailer');
const Alert = require('../models/Alert');
const AlertRecipient = require('../models/AlertRecipient');

class AlertService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }

    async createAlert(alertData) {
        try {
            // Create alert in database
            const alert = await Alert.create(alertData);
            
            // Find recipients for this zone
            const recipients = await AlertRecipient.findAll({
                where: {
                    active: true
                }
            });

            // Send notifications
            if (process.env.DISABLE_EMAILS === 'true') {
                console.log('DISABLE_EMAILS is set - skipping sending emails');
            } else {
                for (const recipient of recipients) {
                    try {
                        await this.sendEmailNotification(recipient.email, alert);
                    } catch (err) {
                        console.error('Notify error for', recipient.email, err);
                    }
                }
            }

            // Update alert status
            await alert.update({ status: 'sent' });
            
            return alert;
        } catch (error) {
            console.error('Error creating alert:', error);
            throw error;
        }
    }

    async sendEmailNotification(email, alert) {
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: `Alerte Qualité Eau - ${alert.type}`,
            html: `
                <h2>Alerte AquaWatch</h2>
                <p>${alert.message}</p>
                <p>Score qualité: ${alert.score_qualite}</p>
                <p>Localisation: [${alert.zone_latitude}, ${alert.zone_longitude}]</p>
                <p>Date: ${alert.createdAt}</p>
            `
        };

        if (process.env.DISABLE_EMAILS === 'true') {
            console.log(`Skipping email to ${email} (DISABLE_EMAILS=true)`);
            return;
        }

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    async getAlertHistory(filters = {}) {
        return Alert.findAll({
            where: filters,
            order: [['createdAt', 'DESC']],
            limit: 100
        });
    }
}

module.exports = new AlertService();