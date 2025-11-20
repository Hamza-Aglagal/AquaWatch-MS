const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Zone = sequelize.define('Zone', {
    zone_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Nom de la zone (ex: Agadir, Casablanca, etc.)'
    },
    type: {
        type: DataTypes.ENUM('ville', 'region'),
        defaultValue: 'ville',
        comment: 'Type de zone: ville spécifique ou région plus large'
    },
    geometry: {
        type: DataTypes.GEOMETRY('POLYGON', 4326),
        allowNull: false,
        comment: 'Polygone géographique de la zone (WGS84)'
    },
    centre_lat: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false,
        comment: 'Latitude du centre de la zone'
    },
    centre_lon: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false,
        comment: 'Longitude du centre de la zone'
    },
    qualite_actuelle: {
        type: DataTypes.ENUM('BONNE', 'MOYENNE', 'MAUVAISE', 'INCONNU'),
        defaultValue: 'INCONNU',
        comment: 'Qualité de l\'eau actuelle dans la zone'
    },
    derniere_mise_a_jour: {
        type: DataTypes.DATE,
        comment: 'Dernière mise à jour de la qualité'
    },
    actif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Zone active pour l\'affichage'
    }
}, {
    tableName: 'zones_map',
    timestamps: false,
    indexes: [
        {
            name: 'idx_zone_geometry',
            type: 'SPATIAL',
            fields: ['geometry']
        },
        {
            name: 'idx_zone_qualite',
            fields: ['qualite_actuelle']
        }
    ]
});

module.exports = Zone;
