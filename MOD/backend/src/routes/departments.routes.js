const express = require('express');
const { Department } = require('../models');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all departments/sections
router.get('/', authenticate, async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'code', 'description']
    });

    res.json({
      success: true,
      data: departments,
      count: departments.length
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get department by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department/Section haipatikani' });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Create department
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Name na code vinahitajika' });
    }

    const department = await Department.create({
      name,
      code,
      description,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error creating department:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, error: 'Department code tayari ipo' });
    }
    res.status(500).json({ success: false, error: 'Hitilafu ya kuunda department' });
  }
});

// Update department
router.put('/:id', authenticate, async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department/Section haipatikani' });
    }

    await department.update(req.body);

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kusasisha' });
  }
});

// Delete department
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department/Section haipatikani' });
    }

    await department.update({ status: 'inactive' });

    res.json({
      success: true,
      message: 'Department imefutwa'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kufuta' });
  }
});

module.exports = router;
