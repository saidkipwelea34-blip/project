const sequelize = require('../config/database');
const User = require('./User');
const Asset = require('./Asset');
const Maintenance = require('./Maintenance');
const Repair = require('./Repair');
const InventoryItem = require('./InventoryItem');
const StockTransaction = require('./StockTransaction');
const Report = require('./Report');
const Department = require('./Department');
const Permission = require('./Permission');
const Role = require('./Role');
const ServiceRequest = require('./ServiceRequest');
const ServiceRequestAssignment = require('./ServiceRequestAssignment');
const AccessoryRequest = require('./AccessoryRequest');

// User - Asset associations
User.hasMany(Asset, { foreignKey: 'assignedTo', as: 'assignedAssets' });
Asset.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

// Asset - Maintenance associations
Asset.hasMany(Maintenance, { foreignKey: 'assetId', as: 'maintenanceRecords' });
Maintenance.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

// User - Maintenance associations
User.hasMany(Maintenance, { foreignKey: 'assignedTo', as: 'assignedMaintenance' });
Maintenance.belongsTo(User, { foreignKey: 'assignedTo', as: 'technician' });
User.hasMany(Maintenance, { foreignKey: 'createdBy', as: 'createdMaintenance' });
Maintenance.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Asset - Repair associations
Asset.hasMany(Repair, { foreignKey: 'assetId', as: 'repairRecords' });
Repair.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

// User - Repair associations
User.hasMany(Repair, { foreignKey: 'reportedBy', as: 'reportedRepairs' });
Repair.belongsTo(User, { foreignKey: 'reportedBy', as: 'reporter' });
User.hasMany(Repair, { foreignKey: 'assignedTo', as: 'assignedRepairs' });
Repair.belongsTo(User, { foreignKey: 'assignedTo', as: 'technician' });

// InventoryItem - StockTransaction associations
InventoryItem.hasMany(StockTransaction, { foreignKey: 'itemId', as: 'transactions' });
StockTransaction.belongsTo(InventoryItem, { foreignKey: 'itemId', as: 'item' });

// User - StockTransaction associations
User.hasMany(StockTransaction, { foreignKey: 'performedBy', as: 'stockTransactions' });
StockTransaction.belongsTo(User, { foreignKey: 'performedBy', as: 'performer' });

// User - Report associations
User.hasMany(Report, { foreignKey: 'generatedBy', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'generatedBy', as: 'generator' });

// ServiceRequest associations
User.hasMany(ServiceRequest, { foreignKey: 'requestedBy', as: 'serviceRequests' });
ServiceRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });

User.hasMany(ServiceRequest, { foreignKey: 'approvedBy', as: 'approvedRequests' });
ServiceRequest.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

Asset.hasMany(ServiceRequest, { foreignKey: 'assetId', as: 'serviceRequests' });
ServiceRequest.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

// ServiceRequestAssignment associations
ServiceRequest.hasMany(ServiceRequestAssignment, { foreignKey: 'serviceRequestId', as: 'assignments' });
ServiceRequestAssignment.belongsTo(ServiceRequest, { foreignKey: 'serviceRequestId', as: 'serviceRequest' });

User.hasMany(ServiceRequestAssignment, { foreignKey: 'technicianId', as: 'technicianAssignments' });
ServiceRequestAssignment.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });

User.hasMany(ServiceRequestAssignment, { foreignKey: 'assignedBy', as: 'madeAssignments' });
ServiceRequestAssignment.belongsTo(User, { foreignKey: 'assignedBy', as: 'assigner' });

// AccessoryRequest associations
ServiceRequest.hasMany(AccessoryRequest, { foreignKey: 'serviceRequestId', as: 'accessoryRequests' });
AccessoryRequest.belongsTo(ServiceRequest, { foreignKey: 'serviceRequestId', as: 'serviceRequest' });

User.hasMany(AccessoryRequest, { foreignKey: 'requestedBy', as: 'accessoryRequestsMade' });
AccessoryRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });

User.hasMany(AccessoryRequest, { foreignKey: 'adminApprovedBy', as: 'adminApprovedAccessoryRequests' });
AccessoryRequest.belongsTo(User, { foreignKey: 'adminApprovedBy', as: 'adminApprover' });

User.hasMany(AccessoryRequest, { foreignKey: 'cpmApprovedBy', as: 'cpmApprovedAccessoryRequests' });
AccessoryRequest.belongsTo(User, { foreignKey: 'cpmApprovedBy', as: 'cpmApprover' });

User.hasMany(AccessoryRequest, { foreignKey: 'issuedBy', as: 'issuedAccessoryRequests' });
AccessoryRequest.belongsTo(User, { foreignKey: 'issuedBy', as: 'issuer' });

module.exports = {
  sequelize,
  User,
  Asset,
  Maintenance,
  Repair,
  InventoryItem,
  StockTransaction,
  Report,
  Department,
  Permission,
  Role,
  ServiceRequest,
  ServiceRequestAssignment,
  AccessoryRequest
};
