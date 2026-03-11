const express = require('express');
const { Op } = require('sequelize');
const { InventoryItem, StockTransaction, User } = require('../models');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all inventory items
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, isActive, lowStock, search } = req.query;
    const where = {};

    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    let items = await InventoryItem.findAll({
      where,
      order: [['name', 'ASC']]
    });

    // Filter low stock items
    if (lowStock === 'true') {
      items = items.filter(item => item.quantity <= item.reorderPoint);
    }

    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get item by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bidhaa haipatikani' 
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Create inventory item
router.post('/', authenticate, async (req, res) => {
  try {
    const itemData = req.body;

    // Generate SKU if not provided
    if (!itemData.sku) {
      const prefix = (itemData.category || 'ITM').substring(0, 3).toUpperCase();
      const count = await InventoryItem.count();
      itemData.sku = `${prefix}-${String(count + 1).padStart(5, '0')}`;
    }

    const item = await InventoryItem.create(itemData);

    // Record initial stock if quantity > 0
    if (item.quantity > 0) {
      await StockTransaction.create({
        itemId: item.id,
        type: 'in',
        quantity: item.quantity,
        previousQuantity: 0,
        newQuantity: item.quantity,
        referenceType: 'purchase',
        notes: 'Hisa ya awali',
        performedBy: req.user.id
      });
    }

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error creating item:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false, 
        error: 'SKU tayari ipo' 
      });
    }
    res.status(500).json({ success: false, error: 'Hitilafu ya kuunda bidhaa' });
  }
});

// Update inventory item
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow direct quantity changes (use stock-in/out)
    delete updates.quantity;

    const item = await InventoryItem.findByPk(id);

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bidhaa haipatikani' 
      });
    }

    await item.update(updates);

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kusasisha' });
  }
});

// Stock in
router.post('/:id/stock-in', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, notes, unitCost } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Kiasi sahihi kinahitajika' 
      });
    }

    const item = await InventoryItem.findByPk(id);
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bidhaa haipatikani' 
      });
    }

    const previousQuantity = item.quantity;
    await item.update({
      quantity: item.quantity + quantity,
      lastRestocked: new Date()
    });

    // Record transaction
    await StockTransaction.create({
      itemId: item.id,
      type: 'in',
      quantity,
      previousQuantity,
      newQuantity: item.quantity,
      referenceType: 'purchase',
      unitCost,
      totalCost: unitCost ? unitCost * quantity : undefined,
      notes,
      performedBy: req.user.id
    });

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kuingiza hisa' });
  }
});

// Stock out
router.post('/:id/stock-out', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, referenceType, referenceId, notes } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Kiasi sahihi kinahitajika' 
      });
    }

    const item = await InventoryItem.findByPk(id);
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bidhaa haipatikani' 
      });
    }

    if (item.quantity < quantity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Hisa haitoshi' 
      });
    }

    const previousQuantity = item.quantity;
    await item.update({ quantity: item.quantity - quantity });

    // Record transaction
    await StockTransaction.create({
      itemId: item.id,
      type: 'out',
      quantity,
      previousQuantity,
      newQuantity: item.quantity,
      referenceType,
      referenceId,
      totalCost: item.unitPrice * quantity,
      notes,
      performedBy: req.user.id
    });

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kutoa hisa' });
  }
});

// Get stock transactions for an item
router.get('/:id/transactions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const transactions = await StockTransaction.findAll({
      where: { itemId: id },
      include: [
        { model: User, as: 'performer', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get all transactions
router.get('/transactions/all', authenticate, async (req, res) => {
  try {
    const { type, startDate, endDate, limit = 100 } = req.query;
    const where = {};

    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const transactions = await StockTransaction.findAll({
      where,
      include: [
        { model: InventoryItem, as: 'item', attributes: ['id', 'name', 'sku'] },
        { model: User, as: 'performer', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Delete inventory item
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const item = await InventoryItem.findByPk(req.params.id);

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bidhaa haipatikani' 
      });
    }

    await item.destroy();

    res.json({
      success: true,
      message: 'Bidhaa imefutwa'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kufuta' });
  }
});

module.exports = router;
