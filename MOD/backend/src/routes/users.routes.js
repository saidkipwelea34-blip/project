const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const config = require('../config');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email na password vinahitajika' 
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email au password si sahihi' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        error: 'Akaunti imezimwa' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      token,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya kuingia' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, department, phone, position, employeeId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Taarifa muhimu zinahitajika' 
      });
    }

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email hii tayari imesajiliwa' 
      });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: role || 'user',
      department,
      phone,
      position,
      employeeId
    });

    res.status(201).json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Hitilafu ya kusajili' });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get all users
router.get('/', authenticate, async (req, res) => {
  try {
    const { role, department, isActive, search } = req.query;
    const where = {};

    if (role) where.role = role;
    if (department) where.department = department;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAll({ 
      where, 
      order: [['createdAt', 'DESC']] 
    });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Mtumiaji hapatikani' 
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya seva' });
  }
});

// Update user
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove password from updates (use separate endpoint)
    delete updates.password;

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Mtumiaji hapatikani' 
      });
    }

    await user.update(updates);

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kusasisha' });
  }
});

// Change password
router.put('/:id/password', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Mtumiaji hapatikani' 
      });
    }

    // Check if current user is owner or admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Huna ruhusa' 
      });
    }

    // Verify current password (skip for admin)
    if (req.user.role !== 'admin') {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ 
          success: false, 
          error: 'Password ya sasa si sahihi' 
        });
      }
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password imebadilishwa'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kubadilisha password' });
  }
});

// Delete user
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Mtumiaji hapatikani' 
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Mtumiaji amefutwa'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Hitilafu ya kufuta' });
  }
});

module.exports = router;
