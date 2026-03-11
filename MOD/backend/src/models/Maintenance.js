const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Maintenance = sequelize.define('Maintenance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  assetId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'asset_id',
    references: {
      model: 'assets',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('preventive', 'corrective', 'predictive', 'routine', 'emergency'),
    allowNull: false
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'semi-annual', 'annual', 'one-time'),
    defaultValue: 'monthly'
  },
  description: {
    type: DataTypes.TEXT
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'scheduled_date'
  },
  completedDate: {
    type: DataTypes.DATE,
    field: 'completed_date'
  },
  nextScheduledDate: {
    type: DataTypes.DATEONLY,
    field: 'next_scheduled_date'
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'in-progress', 'completed', 'cancelled', 'overdue'),
    defaultValue: 'scheduled'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  assignedTo: {
    type: DataTypes.UUID,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  estimatedDuration: {
    type: DataTypes.INTEGER,
    field: 'estimated_duration'
  },
  actualDuration: {
    type: DataTypes.INTEGER,
    field: 'actual_duration'
  },
  checklist: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT
  },
  cost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  partsUsed: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'parts_used'
  },
  assetCondition: {
    type: DataTypes.STRING,
    field: 'asset_condition'
  },
  recommendations: {
    type: DataTypes.TEXT
  },
  technicianNotes: {
    type: DataTypes.TEXT,
    field: 'technician_notes'
  },
  createdBy: {
    type: DataTypes.UUID,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'maintenance'
});

module.exports = Maintenance;
