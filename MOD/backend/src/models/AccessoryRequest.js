const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AccessoryRequest = sequelize.define('AccessoryRequest', {
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
  serviceRequestId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'service_request_id',
    references: {
      model: 'service_requests',
      key: 'id'
    }
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
  itemName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'item_name'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'admin-approved', 'admin-rejected', 'cpm-approved', 'cpm-rejected', 'cpm-waiting', 'issued', 'cancelled'),
    defaultValue: 'pending'
  },
  // Admin approval
  adminApprovedBy: {
    type: DataTypes.UUID,
    field: 'admin_approved_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  adminApprovedAt: {
    type: DataTypes.DATE,
    field: 'admin_approved_at'
  },
  adminNotes: {
    type: DataTypes.TEXT,
    field: 'admin_notes'
  },
  // CPM approval
  cpmApprovedBy: {
    type: DataTypes.UUID,
    field: 'cpm_approved_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  cpmApprovedAt: {
    type: DataTypes.DATE,
    field: 'cpm_approved_at'
  },
  cpmNotes: {
    type: DataTypes.TEXT,
    field: 'cpm_notes'
  },
  // Issue tracking
  issuedBy: {
    type: DataTypes.UUID,
    field: 'issued_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  issuedAt: {
    type: DataTypes.DATE,
    field: 'issued_at'
  },
  issuedQuantity: {
    type: DataTypes.INTEGER,
    field: 'issued_quantity'
  }
}, {
  tableName: 'accessory_requests',
  underscored: true
});

module.exports = AccessoryRequest;
