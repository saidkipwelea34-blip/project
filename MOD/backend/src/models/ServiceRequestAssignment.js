const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceRequestAssignment = sequelize.define('ServiceRequestAssignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  serviceRequestId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'service_request_id',
    references: {
      model: 'service_requests',
      key: 'id'
    }
  },
  technicianId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'technician_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'assigned_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'assigned_at'
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'technician'
  },
  notes: {
    type: DataTypes.TEXT
  },
  isLead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_lead'
  }
}, {
  tableName: 'service_request_assignments'
});

module.exports = ServiceRequestAssignment;
