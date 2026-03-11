const express = require('express');
const router = express.Router();
const { Department, Permission, Role } = require('../models');

// ==================== DEPARTMENTS ====================

// Get all departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.findAll({
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: departments, count: departments.length });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch departments' });
  }
});

// Get single department
router.get('/departments/:id', async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    res.json({ success: true, data: department });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch department' });
  }
});

// Create department
router.post('/departments', async (req, res) => {
  try {
    const { name, code, description, status } = req.body;
    const department = await Department.create({ name, code, description, status });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ success: false, error: 'Failed to create department' });
  }
});

// Update department
router.put('/departments/:id', async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    const { name, code, description, status } = req.body;
    await department.update({ name, code, description, status });
    res.json({ success: true, data: department });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ success: false, error: 'Failed to update department' });
  }
});

// Delete department
router.delete('/departments/:id', async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    await department.destroy();
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ success: false, error: 'Failed to delete department' });
  }
});

// ==================== PERMISSIONS ====================

// Get all permissions
router.get('/permissions', async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [['module', 'ASC'], ['name', 'ASC']]
    });
    res.json({ success: true, data: permissions, count: permissions.length });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch permissions' });
  }
});

// Get single permission
router.get('/permissions/:id', async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) {
      return res.status(404).json({ success: false, error: 'Permission not found' });
    }
    res.json({ success: true, data: permission });
  } catch (error) {
    console.error('Error fetching permission:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch permission' });
  }
});

// Create permission
router.post('/permissions', async (req, res) => {
  try {
    const { name, code, description, module, status } = req.body;
    const permission = await Permission.create({ name, code, description, module, status });
    res.status(201).json({ success: true, data: permission });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ success: false, error: 'Failed to create permission' });
  }
});

// Update permission
router.put('/permissions/:id', async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) {
      return res.status(404).json({ success: false, error: 'Permission not found' });
    }
    const { name, code, description, module, status } = req.body;
    await permission.update({ name, code, description, module, status });
    res.json({ success: true, data: permission });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({ success: false, error: 'Failed to update permission' });
  }
});

// Delete permission
router.delete('/permissions/:id', async (req, res) => {
  try {
    const permission = await Permission.findByPk(req.params.id);
    if (!permission) {
      return res.status(404).json({ success: false, error: 'Permission not found' });
    }
    await permission.destroy();
    res.json({ success: true, message: 'Permission deleted successfully' });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({ success: false, error: 'Failed to delete permission' });
  }
});

// ==================== ROLES ====================

// Get all roles
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.findAll({
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: roles, count: roles.length });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch roles' });
  }
});

// Get single role
router.get('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }
    res.json({ success: true, data: role });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch role' });
  }
});

// Create role
router.post('/roles', async (req, res) => {
  try {
    const { name, code, description, permissions, status } = req.body;
    const role = await Role.create({ name, code, description, permissions: permissions || [], status });
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ success: false, error: 'Failed to create role' });
  }
});

// Update role
router.put('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }
    const { name, code, description, permissions, status } = req.body;
    await role.update({ name, code, description, permissions, status });
    res.json({ success: true, data: role });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ success: false, error: 'Failed to update role' });
  }
});

// Delete role
router.delete('/roles/:id', async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, error: 'Role not found' });
    }
    await role.destroy();
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ success: false, error: 'Failed to delete role' });
  }
});

module.exports = router;
