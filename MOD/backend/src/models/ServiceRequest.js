const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceRequest = sequelize.define('ServiceRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requestNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'request_number'
  },
  requestedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'requested_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assetId: {
    type: DataTypes.UUID,
    field: 'asset_id',
    references: {
      model: 'assets',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('maintenance', 'repair'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
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
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'in-progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  location: {
    type: DataTypes.STRING
  },
  department: {
    type: DataTypes.STRING
  },
  // Approval fields
  approvedBy: {
    type: DataTypes.UUID,
    field: 'approved_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    field: 'approved_at'
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    field: 'rejection_reason'
  },
  // Progress tracking
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  progressNotes: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'progress_notes'
  },
  // Dates
  requestedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'requested_at'
  },
  startedAt: {
    type: DataTypes.DATE,
    field: 'started_at'
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  },
  estimatedCompletionDate: {
    type: DataTypes.DATEONLY,
    field: 'estimated_completion_date'
  },
  // Additional info
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  feedback: {
    type: DataTypes.TEXT
  },
  rating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  }
}, {
  tableName: 'service_requests',
  hooks: {
    beforeCreate: async (request) => {
      // Generate request number
      const count = await ServiceRequest.count();
      const year = new Date().getFullYear();
      request.requestNumber = `SR-${year}-${String(count + 1).padStart(5, '0')}`;
    }
  }
});

module.exports = ServiceRequest;
