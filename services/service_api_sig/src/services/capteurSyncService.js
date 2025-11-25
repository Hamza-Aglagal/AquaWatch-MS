const axios = require('axios');
const PointInteret = require('../models/PointInteret');

class CapteurSyncService {
    constructor() {
        // URL du service capteurs de Bilal
        this.capteurApiUrl = process.env.CAPTEUR_API_URL || 'http://service_capteurs:8000';
    }

    /**
     * Synchronise les positions des capteurs depuis l'API de Bilal
     * @returns {Promise<Object>} Résultat de la synchronisation
     */
    async syncCapteurs() {
        try {
            console.log(`Fetching capteurs from ${this.capteurApiUrl}/api/capteurs/positions`);
            
            // Appeler l'API de Bilal pour obtenir les positions
            const response = await axios.get(`${this.capteurApiUrl}/api/capteurs/positions`, {
                timeout: 5000
            });

            if (!response.data || !Array.isArray(response.data)) {
                throw new Error('Invalid response format from capteur API');
            }

            const capteurs = response.data;
            console.log(`Received ${capteurs.length} capteurs from API`);

            let created = 0;
            let updated = 0;
            let errors = 0;

            // Synchroniser chaque capteur
            for (const capteurData of capteurs) {
                try {
                    // Valider les données requises
                    if (!capteurData.capteur_id || !capteurData.latitude || !capteurData.longitude) {
                        console.warn('Skipping capteur with missing data:', capteurData);
                        errors++;
                        continue;
                    }

                    // Chercher si le capteur existe déjà
                    const [capteur, isNew] = await PointInteret.upsert({
                        capteur_id: capteurData.capteur_id,
                        nom: capteurData.nom || `Capteur ${capteurData.capteur_id}`,
                        position: {
                            type: 'Point',
                            coordinates: [capteurData.longitude, capteurData.latitude]
                        },
                        description: capteurData.description || null,
                        type_capteur: capteurData.type || 'QUALITE_EAU',
                        status: capteurData.status || 'ACTIF'
                    });

                    if (isNew) {
                        created++;
                        console.log(`✅ Created capteur: ${capteurData.capteur_id}`);
                    } else {
                        updated++;
                        console.log(`🔄 Updated capteur: ${capteurData.capteur_id}`);
                    }

                } catch (err) {
                    errors++;
                    console.error(`Error syncing capteur ${capteurData.capteur_id}:`, err.message);
                }
            }

            const result = {
                success: true,
                total: capteurs.length,
                created,
                updated,
                errors,
                timestamp: new Date().toISOString()
            };

            console.log('Sync completed:', result);
            return result;

        } catch (error) {
            console.error('Error syncing capteurs:', error.message);
            
            // Si l'API n'est pas disponible, retourner une erreur mais ne pas crasher
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                return {
                    success: false,
                    error: 'Capteur API not available',
                    message: 'Le service capteurs de Bilal n\'est pas accessible',
                    timestamp: new Date().toISOString()
                };
            }

            throw error;
        }
    }

    /**
     * Obtient le statut de connexion avec l'API capteurs
     * @returns {Promise<Object>} Statut de la connexion
     */
    async checkCapteurApiStatus() {
        try {
            const response = await axios.get(`${this.capteurApiUrl}/health`, {
                timeout: 3000
            });

            return {
                available: true,
                status: response.data,
                url: this.capteurApiUrl
            };
        } catch (error) {
            return {
                available: false,
                error: error.message,
                url: this.capteurApiUrl
            };
        }
    }
}

module.exports = new CapteurSyncService();
