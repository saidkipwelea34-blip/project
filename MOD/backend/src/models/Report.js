const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('assets', 'maintenance', 'repair', 'inventory', 'financial', 'summary', 'custom'),
    allowNull: false
  },
  parameters: {
    type: DataTypes.JSONB
  },
  generatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'generated_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  generatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'generated_at'
  },
  format: {
    type: DataTypes.ENUM('pdf', 'excel', 'csv', 'json'),
    defaultValue: 'json'
  },
  filePath: {
    type: DataTypes.STRING,
    field: 'file_path'
  },
  status: {
    type: DataTypes.ENUM('pending', 'generating', 'completed', 'failed'),
    defaultValue: 'completed'
  },
  data: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'reports'
});

module.exports = Report;
