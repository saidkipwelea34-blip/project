const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockTransaction = sequelize.define('StockTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'item_id',
    references: {
      model: 'inventory_items',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('in', 'out', 'adjustment', 'return'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  previousQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'previous_quantity'
  },
  newQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'new_quantity'
  },
  referenceType: {
    type: DataTypes.ENUM('repair', 'maintenance', 'purchase', 'disposal', 'transfer', 'other'),
    field: 'reference_type'
  },
  referenceId: {
    type: DataTypes.UUID,
    field: 'reference_id'
  },
  unitCost: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'unit_cost'
  },
  totalCost: {
    type: DataTypes.DECIMAL(15, 2),
    field: 'total_cost'
  },
  notes: {
    type: DataTypes.TEXT
  },
  performedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'performed_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'stock_transactions'
});

module.exports = StockTransaction;
