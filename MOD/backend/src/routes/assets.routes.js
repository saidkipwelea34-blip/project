const express = require('express');
const { Op } = require('sequelize');
const { Asset, User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all assets with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, department, status, condition, search, assignedTo } = req.query;
    const where = {};

    if (category) where.category = category;
    if (department) where.department = department;
    if (status) where.status = status;
    if (condition) where.condition = condition;
    if (assignedTo) where.assignedTo = assignedTo;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { assetTag: { [Op.iLike]: `%${search}%` } },
        { serialNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const assets = await Asset.findAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: assets,
      count: assets.length
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get asset statistics
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const assets = await Asset.findAll();
    
    const byStatus = {};
    const byCategory = {};
    let totalValue = 0;

    assets.forEach(asset => {
      // By status
      if (!byStatus[asset.status]) {
        byStatus[asset.status] = { count: 0, totalValue: 0 };
      }
      byStatus[asset.status].count++;
      byStatus[asset.status].totalValue += asset.currentValue || 0;
      
      // By category
      if (!byCategory[asset.category]) {
        byCategory[asset.category] = { count: 0 };
      }
      byCategory[asset.category].count++;
      
      totalValue += asset.currentValue || 0;
    });

    res.json({
      success: true,
      data: {
        total: assets.length,
        totalValue,
        byStatus: Object.entries(byStatus).map(([status, data]) => ({ _id: status, ...data })),
        byCategory: Object.entries(byCategory).map(([cat, data]) => ({ _id: cat, ...data }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya takwimu' });
  }
});

// Get asset by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const asset = await Asset.findByPk(req.params.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'department'] }
      ]
    });

    if (!asset) {
      return res.status(404).json({ 
        success: false, 
        error: 'Mali haipatikani' 
      });
    }

    res.json({
      success: true,
      data: asset
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Create new asset
router.post('/', authenticate, async (req, res) => {
  try {
    const assetData = req.body;

    // Generate asset tag if not provided
    if (!assetData.assetTag) {
      const prefix = (assetData.category || 'AST').substring(0, 3).toUpperCase();
      const count = await Asset.count();
      assetData.assetTag = `${prefix}-${String(count + 1).padStart(6, '0')}`;
    }

    const asset = await Asset.create(assetData);

    res.status(201).json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Asset tag tayari ipo' 
      });
    }
    res.status(500).json({ success: false, error: 'Hitilafu ya kuunda mali' });
  }
});

// Update asset
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const asset = await Asset.findByPk(id);

    if (!asset) {
      return res.status(404).json({ 
        success: false, 
        error: 'Mali haipatikani' 
      });
    }

    await asset.update(updates);
    
    const updatedAsset = await Asset.findByPk(id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    res.json({
      success: true,
      data: updatedAsset
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kusasisha' });
  }
});

// Delete asset
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const asset = await Asset.findByPk(req.params.id);

    if (!asset) {
      return res.status(404).json({ 
        success: false, 
        error: 'Mali haipatikani' 
      });
    }

    await asset.destroy();

    res.json({
      success: true,
      message: 'Mali imefutwa'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kufuta' });
  }
});

// Assign asset to user
router.put('/:id/assign', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const asset = await Asset.findByPk(id);

    if (!asset) {
      return res.status(404).json({ 
        success: false, 
        error: 'Mali haipatikani' 
      });
    }

    await asset.update({
      assignedTo: userId || null,
      status: userId ? 'in-use' : 'available'
    });

    const updatedAsset = await Asset.findByPk(id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    res.json({
      success: true,
      data: updatedAsset
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kugawa' });
  }
});

module.exports = router;
