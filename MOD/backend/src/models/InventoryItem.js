const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryItem = sequelize.define('InventoryItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.ENUM('spare-parts', 'consumables', 'tools', 'materials', 'accessories', 'other'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  unit: {
    type: DataTypes.ENUM('piece', 'kg', 'liter', 'meter', 'box', 'set', 'pack', 'roll'),
    defaultValue: 'piece'
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  minQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    field: 'min_quantity'
  },
  maxQuantity: {
    type: DataTypes.INTEGER,
    field: 'max_quantity'
  },
  unitPrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'unit_price'
  },
  supplier: {
    type: DataTypes.STRING
  },
  supplierContact: {
    type: DataTypes.STRING,
    field: 'supplier_contact'
  },
  location: {
    type: DataTypes.STRING
  },
  reorderPoint: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    field: 'reorder_point'
  },
  lastRestocked: {
    type: DataTypes.DATE,
    field: 'last_restocked'
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    field: 'expiry_date'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  image: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'inventory_items',
  hooks: {
    beforeCreate: async (item) => {
      if (!item.sku) {
        const prefix = (item.category || 'ITM').substring(0, 3).toUpperCase();
        const count = await InventoryItem.count();
        item.sku = `${prefix}-${String(count + 1).padStart(5, '0')}`;
      }
    }
  }
});

module.exports = InventoryItem;
