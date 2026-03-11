const express = require('express');
const { Op } = require('sequelize');
const { Report, Asset, Maintenance, Repair, InventoryItem, User } = require('../models');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Helper function to calculate average repair time
function calculateAvgRepairTime(repairs) {
  const completedRepairs = repairs.filter(r => r.repairEndDate && r.reportedDate);
  if (completedRepairs.length === 0) return 0;
  
  const totalTime = completedRepairs.reduce((sum, r) => {
    const diff = new Date(r.repairEndDate) - new Date(r.reportedDate);
    return sum + diff;
  }, 0);
  
  return Math.round(totalTime / completedRepairs.length / (1000 * 60 * 60 * 24)); // days
}

// Get all reports
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, status, limit = 50 } = req.query;
    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;

    const reports = await Report.findAll({
      where,
      include: [
        { model: User, as: 'generator', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['generatedAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get report by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      include: [
        { model: User, as: 'generator', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ripoti haipatikani' 
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Generate report
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { type, startDate, endDate, department, category, format = 'json' } = req.body;

    if (!type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Aina ya ripoti inahitajika' 
      });
    }

    let reportData;
    let reportName;
    const dateWhere = {};
    
    if (startDate) dateWhere[Op.gte] = new Date(startDate);
    if (endDate) dateWhere[Op.lte] = new Date(endDate);

    switch (type) {
      case 'assets':
        reportName = 'Ripoti ya Mali';
        const assetWhere = {};
        if (department) assetWhere.department = department;
        if (category) assetWhere.category = category;
        
        const assets = await Asset.findAll({
          where: assetWhere,
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'department'] }
          ]
        });
        
        // Calculate stats
        const assetStats = {};
        const categoryStats = {};
        
        assets.forEach(asset => {
          if (!assetStats[asset.status]) {
            assetStats[asset.status] = { count: 0, totalValue: 0 };
          }
          assetStats[asset.status].count++;
          assetStats[asset.status].totalValue += asset.currentValue || 0;
          
          if (!categoryStats[asset.category]) {
            categoryStats[asset.category] = { count: 0, totalValue: 0 };
          }
          categoryStats[asset.category].count++;
          categoryStats[asset.category].totalValue += asset.currentValue || 0;
        });

        reportData = {
          summary: {
            totalAssets: assets.length,
            totalValue: assets.reduce((sum, a) => sum + (a.currentValue || 0), 0),
            byStatus: Object.entries(assetStats).map(([status, data]) => ({ _id: status, ...data })),
            byCategory: Object.entries(categoryStats).map(([cat, data]) => ({ _id: cat, ...data }))
          },
          items: assets
        };
        break;

      case 'maintenance':
        reportName = 'Ripoti ya Matengenezo';
        const maintenanceWhere = {};
        if (Object.keys(dateWhere).length) maintenanceWhere.scheduledDate = dateWhere;
        
        const maintenance = await Maintenance.findAll({
          where: maintenanceWhere,
          include: [
            { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] },
            { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] }
          ]
        });

        const maintenanceStats = {};
        maintenance.forEach(m => {
          if (!maintenanceStats[m.status]) {
            maintenanceStats[m.status] = { count: 0, totalCost: 0 };
          }
          maintenanceStats[m.status].count++;
          maintenanceStats[m.status].totalCost += m.cost || 0;
        });

        reportData = {
          summary: {
            totalSchedules: maintenance.length,
            totalCost: maintenance.reduce((sum, m) => sum + (m.cost || 0), 0),
            byStatus: Object.entries(maintenanceStats).map(([status, data]) => ({ _id: status, ...data })),
            completed: maintenance.filter(m => m.status === 'completed').length,
            pending: maintenance.filter(m => ['scheduled', 'overdue'].includes(m.status)).length
          },
          items: maintenance
        };
        break;

      case 'repair':
        reportName = 'Ripoti ya Ukarabati';
        const repairWhere = {};
        if (Object.keys(dateWhere).length) repairWhere.reportedDate = dateWhere;
        
        const repairs = await Repair.findAll({
          where: repairWhere,
          include: [
            { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] },
            { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
            { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName'] }
          ]
        });

        const repairStats = {};
        repairs.forEach(r => {
          if (!repairStats[r.status]) {
            repairStats[r.status] = { count: 0, totalCost: 0 };
          }
          repairStats[r.status].count++;
          repairStats[r.status].totalCost += r.totalCost || 0;
        });

        reportData = {
          summary: {
            totalRepairs: repairs.length,
            totalCost: repairs.reduce((sum, r) => sum + (r.totalCost || 0), 0),
            byStatus: Object.entries(repairStats).map(([status, data]) => ({ _id: status, ...data })),
            avgRepairTime: calculateAvgRepairTime(repairs)
          },
          items: repairs
        };
        break;

      case 'inventory':
        reportName = 'Ripoti ya Hisa';
        const inventoryWhere = {};
        if (category) inventoryWhere.category = category;
        
        const inventory = await InventoryItem.findAll({ where: inventoryWhere });

        const inventoryStats = {};
        inventory.forEach(item => {
          if (!inventoryStats[item.category]) {
            inventoryStats[item.category] = { count: 0, totalQuantity: 0, totalValue: 0 };
          }
          inventoryStats[item.category].count++;
          inventoryStats[item.category].totalQuantity += item.quantity;
          inventoryStats[item.category].totalValue += item.quantity * item.unitPrice;
        });

        const lowStock = inventory.filter(i => i.quantity <= i.reorderPoint);

        reportData = {
          summary: {
            totalItems: inventory.length,
            totalQuantity: inventory.reduce((sum, i) => sum + i.quantity, 0),
            totalValue: inventory.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0),
            byCategory: Object.entries(inventoryStats).map(([cat, data]) => ({ _id: cat, ...data })),
            lowStockCount: lowStock.length
          },
          items: inventory,
          lowStockItems: lowStock
        };
        break;

      case 'summary':
        reportName = 'Ripoti ya Jumla';
        const totalAssets = await Asset.count();
        const totalMaintenance = await Maintenance.count();
        const totalRepairs = await Repair.count();
        const totalInventory = await InventoryItem.count();

        const pendingMaintenance = await Maintenance.count({ 
          where: { status: { [Op.in]: ['scheduled', 'overdue'] } }
        });
        const pendingRepairs = await Repair.count({ 
          where: { status: { [Op.in]: ['pending', 'in-progress'] } }
        });

        reportData = {
          overview: {
            totalAssets,
            totalMaintenance,
            totalRepairs,
            totalInventoryItems: totalInventory,
            pendingMaintenance,
            pendingRepairs
          }
        };
        break;

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Aina ya ripoti haijulikani' 
        });
    }

    // Save report
    const report = await Report.create({
      name: reportName,
      type,
      parameters: { startDate, endDate, department, category },
      generatedBy: req.user.id,
      generatedAt: new Date(),
      format,
      status: 'completed',
      data: reportData
    });

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya kutengeneza ripoti' });
  }
});

// Download report
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ripoti haipatikani' 
      });
    }

    // For now, return JSON data
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${report.name}-${report.id}.json"`);
    res.json(report.data);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kupakua' });
  }
});

// Delete report
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);

    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ripoti haipatikani' 
      });
    }

    await report.destroy();

    res.json({
      success: true,
      message: 'Ripoti imefutwa'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kufuta' });
  }
});

module.exports = router;
