const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Modèle Capteur - représente un capteur physique
const Capteur = sequelize.define('Capteur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  capteur_id: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180
    }
  },
  type_capteur: {
    type: DataTypes.STRING(50),
    defaultValue: 'multiparameter'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'maintenance']]
    }
  }
}, {
  tableName: 'capteurs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Capteur;
