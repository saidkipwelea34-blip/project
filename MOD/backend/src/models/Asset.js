const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  assetTag: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'asset_tag'
  },
  serialNumber: {
    type: DataTypes.STRING,
    field: 'serial_number'
  },
  category: {
    type: DataTypes.ENUM('computer', 'furniture', 'vehicle', 'equipment', 'electronics', 'machinery', 'other'),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  manufacturer: {
    type: DataTypes.STRING
  },
  model: {
    type: DataTypes.STRING
  },
  department: {
    type: DataTypes.STRING
  },
  location: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('available', 'in-use', 'maintenance', 'repair', 'disposed', 'lost'),
    defaultValue: 'available'
  },
  condition: {
    type: DataTypes.ENUM('new', 'good', 'fair', 'poor', 'damaged'),
    defaultValue: 'good'
  },
  acquisitionDate: {
    type: DataTypes.DATEONLY,
    field: 'acquisition_date'
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'purchase_price'
  },
  currentValue: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'current_value'
  },
  warrantyExpiry: {
    type: DataTypes.DATEONLY,
    field: 'warranty_expiry'
  },
  specifications: {
    type: DataTypes.JSONB
  },
  assignedTo: {
    type: DataTypes.UUID,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  lastMaintenanceDate: {
    type: DataTypes.DATEONLY,
    field: 'last_maintenance_date'
  },
  nextMaintenanceDate: {
    type: DataTypes.DATEONLY,
    field: 'next_maintenance_date'
  },
  image: {
    type: DataTypes.STRING
  },
  documents: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT
  },
  vendorName: {
    type: DataTypes.STRING,
    field: 'vendor_name'
  },
  vendorPhone: {
    type: DataTypes.STRING,
    field: 'vendor_phone'
  }
}, {
  tableName: 'assets',
  hooks: {
    beforeCreate: async (asset) => {
      if (!asset.assetTag) {
        const prefix = (asset.category || 'AST').substring(0, 3).toUpperCase();
        const count = await Asset.count();
        asset.assetTag = `${prefix}-${String(count + 1).padStart(6, '0')}`;
      }
    }
  }
});

module.exports = Asset;
