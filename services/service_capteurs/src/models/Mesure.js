const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Capteur = require('./Capteur');

// Modèle Mesure - représente une mesure de qualité d'eau
const Mesure = sequelize.define('Mesure', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  capteur_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'capteurs',
      key: 'capteur_id'
    }
  },
  ph: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 14
    }
  },
  temperature: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: -10,
      max: 50
    }
  },
  turbidite: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  oxygene: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 20
    }
  },
  conductivite: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'mesures',
  timestamps: false
});

// Relation: Un capteur a plusieurs mesures
Capteur.hasMany(Mesure, { foreignKey: 'capteur_id', sourceKey: 'capteur_id' });
Mesure.belongsTo(Capteur, { foreignKey: 'capteur_id', targetKey: 'capteur_id' });

module.exports = Mesure;
