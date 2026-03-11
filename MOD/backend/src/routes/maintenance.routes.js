const express = require('express');
const { Op } = require('sequelize');
const { Maintenance, Asset, User } = require('../models');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all maintenance schedules
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, type, assetId, assignedTo } = req.query;
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (assetId) where.assetId = assetId;
    if (assignedTo) where.assignedTo = assignedTo;

    // Auto-mark overdue
    await Maintenance.update(
      { status: 'overdue' },
      { 
        where: { 
          status: 'scheduled', 
          scheduledDate: { [Op.lt]: new Date() } 
        } 
      }
    );

    const schedules = await Maintenance.findAll({
      where,
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag', 'category'] },
        { model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'position', 'department'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['scheduledDate', 'ASC']]
    });

    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error) {
    console.error('Error fetching maintenance:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get upcoming maintenance
router.get('/upcoming/:days', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 7;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const schedules = await Maintenance.findAll({
      where: {
        scheduledDate: { [Op.between]: [new Date(), endDate] },
        status: { [Op.in]: ['scheduled', 'overdue'] }
      },
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag', 'category', 'location'] },
        { model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'phone', 'position', 'department'] }
      ],
      order: [['scheduledDate', 'ASC']]
    });

    res.json({
      success: true,
      data: schedules,
      count: schedules.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get maintenance by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const schedule = await Maintenance.findByPk(req.params.id, {
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag', 'category', 'location', 'department'] },
        { model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'position', 'department'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!schedule) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ratiba haipatikani' 
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Create maintenance schedule
router.post('/', authenticate, async (req, res) => {
  try {
    const scheduleData = {
      ...req.body,
      createdBy: req.user.id
    };

    const schedule = await Maintenance.create(scheduleData);

    // Update asset's next maintenance date
    if (scheduleData.assetId) {
      await Asset.update(
        { nextMaintenanceDate: scheduleData.scheduledDate },
        { where: { id: scheduleData.assetId } }
      );
    }

    const populated = await Maintenance.findByPk(schedule.id, {
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] },
        { model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'phone', 'position', 'department'] }
      ]
    });

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    console.error('Error creating maintenance:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya kuunda ratiba' });
  }
});

// Update maintenance
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const schedule = await Maintenance.findByPk(id);

    if (!schedule) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ratiba haipatikani' 
      });
    }

    await schedule.update(updates);

    const updated = await Maintenance.findByPk(id, {
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] },
        { model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'phone', 'position', 'department'] }
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

// Complete maintenance
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, actualDuration, cost, partsUsed } = req.body;

    const schedule = await Maintenance.findByPk(id);
    
    if (!schedule) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ratiba haipatikani' 
      });
    }

    const updateData = {
      status: 'completed',
      completedDate: new Date()
    };

    if (notes) updateData.notes = notes;
    if (actualDuration) updateData.actualDuration = actualDuration;
    if (cost) updateData.cost = cost;
    if (partsUsed) updateData.partsUsed = partsUsed;

    // Calculate next scheduled date based on frequency
    if (schedule.frequency && schedule.frequency !== 'one-time') {
      const nextDate = new Date(schedule.scheduledDate);
      switch (schedule.frequency) {
        case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 3); break;
        case 'semi-annual': nextDate.setMonth(nextDate.getMonth() + 6); break;
        case 'annual': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }
      updateData.nextScheduledDate = nextDate;
    }

    await schedule.update(updateData);

    // Update asset maintenance dates
    if (schedule.assetId) {
      await Asset.update(
        {
          lastMaintenanceDate: updateData.completedDate,
          nextMaintenanceDate: updateData.nextScheduledDate
        },
        { where: { id: schedule.assetId } }
      );
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kukamilisha' });
  }
});

// Delete maintenance
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const schedule = await Maintenance.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ratiba haipatikani' 
      });
    }

    await schedule.destroy();

    res.json({
      success: true,
      message: 'Ratiba imefutwa'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kufuta' });
  }
});

// Bulk create maintenance schedules
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const { schedules } = req.body;
    
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Hakuna ratiba za kuunda'
      });
    }

    const createdSchedules = [];
    
    for (const scheduleData of schedules) {
      const schedule = await Maintenance.create({
        ...scheduleData,
        createdBy: req.user.id
      });
      
      // Update asset's next maintenance date
      if (scheduleData.assetId) {
        await Asset.update(
          { nextMaintenanceDate: scheduleData.scheduledDate },
          { where: { id: scheduleData.assetId } }
        );
      }
      
      const populated = await Maintenance.findByPk(schedule.id, {
        include: [
          { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag', 'department'] },
          { model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'phone', 'position', 'department'] }
        ]
      });
      
      createdSchedules.push(populated);
    }

    res.status(201).json({
      success: true,
      data: createdSchedules,
      count: createdSchedules.length
    });
  } catch (error) {
    console.error('Error bulk creating maintenance:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya kuunda ratiba nyingi' });
  }
});

module.exports = router;
