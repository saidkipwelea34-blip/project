const express = require('express');
const { Op } = require('sequelize');
const { Asset, Maintenance, Repair, InventoryItem, User } = require('../models');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Get dashboard summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    // Assets
    const totalAssets = await Asset.count();
    const assets = await Asset.findAll();
    
    const assetsByStatus = {};
    const assetsByCategory = {};
    let totalAssetValue = 0;
    
    assets.forEach(asset => {
      // By status
      if (!assetsByStatus[asset.status]) {
        assetsByStatus[asset.status] = 0;
      }
      assetsByStatus[asset.status]++;
      
      // By category
      if (!assetsByCategory[asset.category]) {
        assetsByCategory[asset.category] = 0;
      }
      assetsByCategory[asset.category]++;
      
      totalAssetValue += asset.currentValue || 0;
    });

    // Maintenance
    const totalMaintenance = await Maintenance.count();
    const pendingMaintenance = await Maintenance.count({ 
      where: { status: { [Op.in]: ['scheduled', 'overdue'] } }
    });
    const overdueMaintenance = await Maintenance.count({ 
      where: { status: 'overdue' } 
    });
    
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingMaintenance = await Maintenance.findAll({
      where: {
        scheduledDate: { [Op.between]: [new Date(), sevenDaysFromNow] },
        status: 'scheduled'
      },
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] }
      ],
      limit: 5,
      order: [['scheduledDate', 'ASC']]
    });

    // Repairs
    const totalRepairs = await Repair.count();
    const pendingRepairs = await Repair.count({ 
      where: { status: { [Op.in]: ['pending', 'in-progress'] } }
    });
    
    const repairs = await Repair.findAll();
    const repairsByStatus = {};
    repairs.forEach(repair => {
      if (!repairsByStatus[repair.status]) {
        repairsByStatus[repair.status] = 0;
      }
      repairsByStatus[repair.status]++;
    });

    const recentRepairs = await Repair.findAll({
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] }
      ],
      limit: 5,
      order: [['reportedDate', 'DESC']]
    });

    // Inventory
    const totalInventoryItems = await InventoryItem.count();
    const allInventory = await InventoryItem.findAll({ where: { isActive: true } });
    const lowStockItems = allInventory.filter(item => item.quantity <= item.reorderPoint).slice(0, 5);
    
    let inventoryValue = 0;
    allInventory.forEach(item => {
      inventoryValue += item.quantity * item.unitPrice;
    });

    // Users
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });

    res.json({
      success: true,
      data: {
        assets: {
          total: totalAssets,
          byStatus: Object.entries(assetsByStatus).map(([status, count]) => ({ _id: status, count })),
          byCategory: Object.entries(assetsByCategory).map(([cat, count]) => ({ _id: cat, count })),
          totalValue: totalAssetValue
        },
        maintenance: {
          total: totalMaintenance,
          pending: pendingMaintenance,
          overdue: overdueMaintenance,
          upcoming: upcomingMaintenance
        },
        repairs: {
          total: totalRepairs,
          pending: pendingRepairs,
          byStatus: Object.entries(repairsByStatus).map(([status, count]) => ({ _id: status, count })),
          recent: recentRepairs
        },
        inventory: {
          totalItems: totalInventoryItems,
          lowStockCount: lowStockItems.length,
          lowStockItems,
          totalValue: inventoryValue
        },
        users: {
          total: totalUsers,
          active: activeUsers
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get recent activities
router.get('/activities', authenticate, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent from each collection
    const recentAssets = await Asset.findAll({
      attributes: ['id', 'name', 'assetTag', 'status', 'createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    const recentMaintenance = await Maintenance.findAll({
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] }
      ],
      attributes: ['id', 'type', 'status', 'scheduledDate', 'completedDate', 'createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    const recentRepairs = await Repair.findAll({
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] }
      ],
      attributes: ['id', 'description', 'status', 'reportedDate', 'createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    // Combine and sort activities
    const activities = [
      ...recentAssets.map(a => ({
        type: 'asset',
        title: `Mali: ${a.name}`,
        subtitle: a.assetTag,
        status: a.status,
        date: a.updatedAt
      })),
      ...recentMaintenance.map(m => ({
        type: 'maintenance',
        title: `Matengenezo: ${m.asset?.name || 'N/A'}`,
        subtitle: m.type,
        status: m.status,
        date: m.updatedAt || m.createdAt
      })),
      ...recentRepairs.map(r => ({
        type: 'repair',
        title: `Ukarabati: ${r.asset?.name || 'N/A'}`,
        subtitle: r.description?.substring(0, 50),
        status: r.status,
        date: r.updatedAt || r.createdAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, parseInt(limit));

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get statistics by department
router.get('/stats/department', authenticate, async (req, res) => {
  try {
    const assets = await Asset.findAll({
      where: { 
        department: { [Op.ne]: null }
      }
    });

    const assetsByDept = {};
    assets.forEach(asset => {
      if (!assetsByDept[asset.department]) {
        assetsByDept[asset.department] = { assetCount: 0, totalValue: 0 };
      }
      assetsByDept[asset.department].assetCount++;
      assetsByDept[asset.department].totalValue += asset.currentValue || 0;
    });

    const result = Object.entries(assetsByDept)
      .map(([dept, data]) => ({ _id: dept, ...data }))
      .sort((a, b) => b.assetCount - a.assetCount);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

module.exports = router;
