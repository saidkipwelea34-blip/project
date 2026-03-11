const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Repair = sequelize.define('Repair', {
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
  reportedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'reported_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reportedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'reported_date'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('pending', 'diagnosed', 'approved', 'in-progress', 'completed', 'cancelled', 'on-hold'),
    defaultValue: 'pending'
  },
  assignedTo: {
    type: DataTypes.UUID,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  diagnosisDate: {
    type: DataTypes.DATE,
    field: 'diagnosis_date'
  },
  diagnosis: {
    type: DataTypes.TEXT
  },
  repairStartDate: {
    type: DataTypes.DATE,
    field: 'repair_start_date'
  },
  repairEndDate: {
    type: DataTypes.DATE,
    field: 'repair_end_date'
  },
  partsUsed: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'parts_used'
  },
  laborHours: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'labor_hours'
  },
  laborCost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'labor_cost'
  },
  partsCost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'parts_cost'
  },
  totalCost: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'total_cost'
  },
  warranty: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  warrantyProvider: {
    type: DataTypes.STRING,
    field: 'warranty_provider'
  },
  notes: {
    type: DataTypes.TEXT
  },
  statusHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'status_history'
  }
}, {
  tableName: 'repairs',
  hooks: {
    beforeSave: (repair) => {
      repair.totalCost = parseFloat(repair.laborCost || 0) + parseFloat(repair.partsCost || 0);
    }
  }
});

module.exports = Repair;
