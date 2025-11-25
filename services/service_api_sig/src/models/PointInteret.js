const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PointInteret = sequelize.define('PointInteret', {
    poi_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Nom du point d\'intérêt (ex: Capteur-1, Port, Plage)'
    },
    type: {
        type: DataTypes.ENUM('capteur', 'port', 'plage', 'autre'),
        defaultValue: 'capteur',
        comment: 'Type de point d\'intérêt'
    },
    position: {
        type: DataTypes.GEOMETRY('POINT', 4326),
        allowNull: false,
        comment: 'Position GPS du point (WGS84)'
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false
    },
    capteur_id: {
        type: DataTypes.STRING(50),
        unique: true,
        comment: 'ID du capteur (si type=capteur)'
    },
    description: {
        type: DataTypes.TEXT,
        comment: 'Description du point'
    },
    type_capteur: {
        type: DataTypes.STRING(50),
        comment: 'Type de capteur (QUALITE_EAU, TEMPERATURE, etc.)'
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'ACTIF',
        comment: 'Statut du capteur (ACTIF, INACTIF, MAINTENANCE)'
    },
    actif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'poi_map',
    timestamps: false,
    indexes: [
        {
            name: 'idx_poi_position',
            type: 'SPATIAL',
            fields: ['position']
        },
        {
            name: 'idx_poi_type',
            fields: ['type']
        }
    ]
});

module.exports = PointInteret;
