const express = require('express');
const { Op } = require('sequelize');
const { Repair, Asset, User } = require('../models');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all repair orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, assetId, assignedTo, warranty } = req.query;
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assetId) where.assetId = assetId;
    if (assignedTo) where.assignedTo = assignedTo;
    if (warranty !== undefined) where.warranty = warranty === 'true';

    const repairs = await Repair.findAll({
      where,
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag', 'category', 'location'] },
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['reportedDate', 'DESC']]
    });

    res.json({
      success: true,
      data: repairs,
      count: repairs.length
    });
  } catch (error) {
    console.error('Error fetching repairs:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get repair by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const repair = await Repair.findByPk(req.params.id, {
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag', 'category', 'location', 'department', 'warrantyExpiry'] },
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }
      ]
    });

    if (!repair) {
      return res.status(404).json({ 
        success: false, 
        error: 'Oda ya ukarabati haipatikani' 
      });
    }

    res.json({
      success: true,
      data: repair
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Create repair order
router.post('/', authenticate, async (req, res) => {
  try {
    const repairData = {
      ...req.body,
      reportedBy: req.user.id,
      reportedDate: new Date(),
      statusHistory: [{
        status: 'pending',
        changedBy: req.user.id,
        changedAt: new Date(),
        notes: 'Oda imeundwa'
      }]
    };

    const repair = await Repair.create(repairData);

    // Update asset status
    if (repairData.assetId) {
      await Asset.update(
        { status: 'repair' },
        { where: { id: repairData.assetId } }
      );
    }

    const populated = await Repair.findByPk(repair.id, {
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] },
        { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    console.error('Error creating repair:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya kuunda oda' });
  }
});

// Update repair order
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const repair = await Repair.findByPk(id);

    if (!repair) {
      return res.status(404).json({ 
        success: false, 
        error: 'Oda haipatikani' 
      });
    }

    await repair.update(updates);

    const updated = await Repair.findByPk(id, {
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kusasisha' });
  }
});

// Assign technician
router.put('/:id/assign', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;

    const repair = await Repair.findByPk(id);
    
    if (!repair) {
      return res.status(404).json({ 
        success: false, 
        error: 'Oda haipatikani' 
      });
    }

    const statusHistory = repair.statusHistory || [];
    statusHistory.push({
      status: repair.status,
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: 'Fundi amegawiwa'
    });

    await repair.update({
      assignedTo: technicianId,
      statusHistory
    });

    const populated = await Repair.findByPk(id, {
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    res.json({
      success: true,
      data: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kugawa' });
  }
});

// Update repair status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const repair = await Repair.findByPk(id);
    
    if (!repair) {
      return res.status(404).json({ 
        success: false, 
        error: 'Oda haipatikani' 
      });
    }

    const oldStatus = repair.status;
    const statusHistory = repair.statusHistory || [];
    statusHistory.push({
      status,
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: notes || `Hali imebadilika kutoka ${oldStatus} kwenda ${status}`
    });

    const updateData = { status, statusHistory };

    // Update specific dates based on status
    if (status === 'diagnosed') updateData.diagnosisDate = new Date();
    if (status === 'in-progress') updateData.repairStartDate = new Date();

    await repair.update(updateData);

    res.json({
      success: true,
      data: repair
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kubadilisha hali' });
  }
});

// Complete repair
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, partsUsed, laborHours, laborCost, notes } = req.body;

    const repair = await Repair.findByPk(id);
    
    if (!repair) {
      return res.status(404).json({ 
        success: false, 
        error: 'Oda haipatikani' 
      });
    }

    const statusHistory = repair.statusHistory || [];
    statusHistory.push({
      status: 'completed',
      changedBy: req.user.id,
      changedAt: new Date(),
      notes: 'Ukarabati umekamilika'
    });

    const updateData = {
      status: 'completed',
      repairEndDate: new Date(),
      statusHistory
    };

    if (diagnosis) updateData.diagnosis = diagnosis;
    if (partsUsed) {
      updateData.partsUsed = partsUsed;
      updateData.partsCost = partsUsed.reduce((sum, p) => sum + (p.totalCost || 0), 0);
    }
    if (laborHours) updateData.laborHours = laborHours;
    if (laborCost) updateData.laborCost = laborCost;
    if (notes) updateData.notes = notes;

    await repair.update(updateData);

    // Update asset status back to available
    if (repair.assetId) {
      await Asset.update(
        { status: 'available', condition: 'good' },
        { where: { id: repair.assetId } }
      );
    }

    res.json({
      success: true,
      data: repair
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kukamilisha' });
  }
});

// Delete repair order
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const repair = await Repair.findByPk(req.params.id);

    if (!repair) {
      return res.status(404).json({ 
        success: false, 
        error: 'Oda haipatikani' 
      });
    }

    // Reset asset status
    if (repair.assetId) {
      await Asset.update(
        { status: 'available' },
        { where: { id: repair.assetId } }
      );
    }

    await repair.destroy();

    res.json({
      success: true,
      message: 'Oda imefutwa'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kufuta' });
  }
});

module.exports = router;
