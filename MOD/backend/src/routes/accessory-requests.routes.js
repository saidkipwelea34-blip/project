const express = require('express');
const router = express.Router();
const { AccessoryRequest, ServiceRequest, User } = require('../models');
const { Op } = require('sequelize');

// Generate accessory request number
async function generateAccessoryRequestNumber() {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `AR${year}${month}`;
  
  const lastRequest = await AccessoryRequest.findOne({
    where: {
      requestNumber: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['requestNumber', 'DESC']]
  });
  
  let sequence = 1;
  if (lastRequest && lastRequest.requestNumber) {
    const lastSeq = parseInt(lastRequest.requestNumber.slice(-4));
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }
  
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}

// Get all accessory requests (admin/manager)
router.get('/', async (req, res) => {
  try {
    const { status, serviceRequestId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) where.status = status;
    if (serviceRequestId) where.serviceRequestId = serviceRequestId;

    const { rows: data, count } = await AccessoryRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'department'] },
        { model: User, as: 'adminApprover', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'cpmApprover', attributes: ['id', 'firstName', 'lastName'] },
        { 
          model: ServiceRequest, 
          as: 'serviceRequest', 
          attributes: ['id', 'requestNumber', 'title', 'status'],
          include: [
            { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'department'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data, count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    console.error('Error fetching accessory requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pending requests for admin
router.get('/pending-admin', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { rows: data, count } = await AccessoryRequest.findAndCountAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'department'] },
        { 
          model: ServiceRequest, 
          as: 'serviceRequest', 
          attributes: ['id', 'requestNumber', 'title', 'status'],
          include: [
            { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'department'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data, count });
  } catch (error) {
    console.error('Error fetching pending admin requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pending requests for CPM (admin-approved and cpm-waiting)
router.get('/pending-cpm', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { rows: data, count } = await AccessoryRequest.findAndCountAll({
      where: { status: { [Op.in]: ['admin-approved', 'cpm-waiting'] } },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'department'] },
        { model: User, as: 'adminApprover', attributes: ['id', 'firstName', 'lastName'] },
        { 
          model: ServiceRequest, 
          as: 'serviceRequest', 
          attributes: ['id', 'requestNumber', 'title', 'status'],
          include: [
            { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'department'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data, count });
  } catch (error) {
    console.error('Error fetching pending CPM requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get my accessory requests (technician)
router.get('/my-requests', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const where = { requestedBy: userId };
    if (status) where.status = status;

    const { rows: data, count } = await AccessoryRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'adminApprover', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'cpmApprover', attributes: ['id', 'firstName', 'lastName'] },
        { model: ServiceRequest, as: 'serviceRequest', attributes: ['id', 'requestNumber', 'title'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data, count });
  } catch (error) {
    console.error('Error fetching my accessory requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get accessory requests for a specific service request
router.get('/by-service-request/:serviceRequestId', async (req, res) => {
  try {
    const data = await AccessoryRequest.findAll({
      where: { serviceRequestId: req.params.serviceRequestId },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'adminApprover', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'cpmApprover', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching accessory requests for service request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create accessory request (technician)
router.post('/', async (req, res) => {
  try {
    const { serviceRequestId, itemName, quantity, reason } = req.body;
    
    // Verify service request exists and technician is assigned
    const serviceRequest = await ServiceRequest.findByPk(serviceRequestId);
    if (!serviceRequest) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    if (serviceRequest.status !== 'in-progress') {
      return res.status(400).json({ success: false, error: 'Service request must be in-progress to request accessories' });
    }

    if (!itemName || !itemName.trim()) {
      return res.status(400).json({ success: false, error: 'Item name is required' });
    }

    // Generate unique request number
    const requestNumber = await generateAccessoryRequestNumber();
    
    const accessoryRequest = await AccessoryRequest.create({
      requestNumber,
      serviceRequestId,
      requestedBy: req.user.id,
      itemName: itemName.trim(),
      quantity: quantity || 1,
      reason,
      status: 'pending'
    });

    const fullRequest = await AccessoryRequest.findByPk(accessoryRequest.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName'] },
        { model: ServiceRequest, as: 'serviceRequest', attributes: ['id', 'requestNumber', 'title'] }
      ]
    });

    res.status(201).json({ success: true, data: fullRequest });
  } catch (error) {
    console.error('Error creating accessory request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin approve
router.put('/:id/admin-approve', async (req, res) => {
  try {
    const { notes } = req.body;
    
    const accessoryRequest = await AccessoryRequest.findByPk(req.params.id);
    if (!accessoryRequest) {
      return res.status(404).json({ success: false, error: 'Accessory request not found' });
    }

    if (accessoryRequest.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending requests can be approved by admin' });
    }

    await accessoryRequest.update({
      status: 'admin-approved',
      adminApprovedBy: req.user.id,
      adminApprovedAt: new Date(),
      adminNotes: notes
    });

    const fullRequest = await AccessoryRequest.findByPk(accessoryRequest.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'adminApprover', attributes: ['id', 'firstName', 'lastName'] },
        { model: ServiceRequest, as: 'serviceRequest', attributes: ['id', 'requestNumber', 'title'] }
      ]
    });

    res.json({ success: true, data: fullRequest, message: 'Request approved by admin. Forwarded to CPM for final approval.' });
  } catch (error) {
    console.error('Error admin approving accessory request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin reject
router.put('/:id/admin-reject', async (req, res) => {
  try {
    const { notes } = req.body;
    
    const accessoryRequest = await AccessoryRequest.findByPk(req.params.id);
    if (!accessoryRequest) {
      return res.status(404).json({ success: false, error: 'Accessory request not found' });
    }

    if (accessoryRequest.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending requests can be rejected' });
    }

    await accessoryRequest.update({
      status: 'admin-rejected',
      adminApprovedBy: req.user.id,
      adminApprovedAt: new Date(),
      adminNotes: notes
    });

    res.json({ success: true, data: accessoryRequest });
  } catch (error) {
    console.error('Error admin rejecting accessory request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CPM approve
router.put('/:id/cpm-approve', async (req, res) => {
  try {
    const { notes } = req.body;
    
    const accessoryRequest = await AccessoryRequest.findByPk(req.params.id);
    if (!accessoryRequest) {
      return res.status(404).json({ success: false, error: 'Accessory request not found' });
    }

    if (!['admin-approved', 'cpm-waiting'].includes(accessoryRequest.status)) {
      return res.status(400).json({ success: false, error: 'Only admin-approved or waiting requests can be approved by CPM' });
    }

    await accessoryRequest.update({
      status: 'cpm-approved',
      cpmApprovedBy: req.user.id,
      cpmApprovedAt: new Date(),
      cpmNotes: notes
    });

    const fullRequest = await AccessoryRequest.findByPk(accessoryRequest.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'adminApprover', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'cpmApprover', attributes: ['id', 'firstName', 'lastName'] },
        { model: ServiceRequest, as: 'serviceRequest', attributes: ['id', 'requestNumber', 'title'] }
      ]
    });

    res.json({ success: true, data: fullRequest, message: 'Request approved by CPM. Ready for issuance.' });
  } catch (error) {
    console.error('Error CPM approving accessory request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CPM reject
router.put('/:id/cpm-reject', async (req, res) => {
  try {
    const { notes } = req.body;
    
    const accessoryRequest = await AccessoryRequest.findByPk(req.params.id);
    if (!accessoryRequest) {
      return res.status(404).json({ success: false, error: 'Accessory request not found' });
    }

    if (!['admin-approved', 'cpm-waiting'].includes(accessoryRequest.status)) {
      return res.status(400).json({ success: false, error: 'Only admin-approved or waiting requests can be rejected by CPM' });
    }

    await accessoryRequest.update({
      status: 'cpm-rejected',
      cpmApprovedBy: req.user.id,
      cpmApprovedAt: new Date(),
      cpmNotes: notes
    });

    res.json({ success: true, data: accessoryRequest });
  } catch (error) {
    console.error('Error CPM rejecting accessory request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CPM wait (put on hold)
router.put('/:id/cpm-wait', async (req, res) => {
  try {
    const { notes } = req.body;
    
    const accessoryRequest = await AccessoryRequest.findByPk(req.params.id);
    if (!accessoryRequest) {
      return res.status(404).json({ success: false, error: 'Accessory request not found' });
    }

    if (!['admin-approved'].includes(accessoryRequest.status)) {
      return res.status(400).json({ success: false, error: 'Only admin-approved requests can be put on hold by CPM' });
    }

    await accessoryRequest.update({
      status: 'cpm-waiting',
      cpmApprovedBy: req.user.id,
      cpmApprovedAt: new Date(),
      cpmNotes: notes
    });

    const fullRequest = await AccessoryRequest.findByPk(accessoryRequest.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'adminApprover', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'cpmApprover', attributes: ['id', 'firstName', 'lastName'] },
        { model: ServiceRequest, as: 'serviceRequest', attributes: ['id', 'requestNumber', 'title'] }
      ]
    });

    res.json({ success: true, data: fullRequest, message: 'Request put on hold by CPM.' });
  } catch (error) {
    console.error('Error CPM putting request on hold:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Issue accessory (store keeper / admin)
router.put('/:id/issue', async (req, res) => {
  try {
    const { issuedQuantity } = req.body;
    
    const accessoryRequest = await AccessoryRequest.findByPk(req.params.id);

    if (!accessoryRequest) {
      return res.status(404).json({ success: false, error: 'Accessory request not found' });
    }

    if (accessoryRequest.status !== 'cpm-approved') {
      return res.status(400).json({ success: false, error: 'Only CPM-approved requests can be issued' });
    }

    const qty = issuedQuantity || accessoryRequest.quantity;

    // Update accessory request
    await accessoryRequest.update({
      status: 'issued',
      issuedBy: req.user.id,
      issuedAt: new Date(),
      issuedQuantity: qty
    });

    res.json({ success: true, data: accessoryRequest, message: 'Accessory issued successfully' });
  } catch (error) {
    console.error('Error issuing accessory:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel accessory request (technician - only pending)
router.put('/:id/cancel', async (req, res) => {
  try {
    const accessoryRequest = await AccessoryRequest.findByPk(req.params.id);
    if (!accessoryRequest) {
      return res.status(404).json({ success: false, error: 'Accessory request not found' });
    }

    if (accessoryRequest.requestedBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to cancel this request' });
    }

    if (!['pending', 'admin-approved'].includes(accessoryRequest.status)) {
      return res.status(400).json({ success: false, error: 'Cannot cancel request at this stage' });
    }

    await accessoryRequest.update({ status: 'cancelled' });

    res.json({ success: true, data: accessoryRequest });
  } catch (error) {
    console.error('Error cancelling accessory request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const pending = await AccessoryRequest.count({ where: { status: 'pending' } });
    const adminApproved = await AccessoryRequest.count({ where: { status: { [Op.in]: ['admin-approved', 'cpm-waiting'] } } });
    const cpmApproved = await AccessoryRequest.count({ where: { status: 'cpm-approved' } });
    const issued = await AccessoryRequest.count({ where: { status: 'issued' } });
    const cpmWaiting = await AccessoryRequest.count({ where: { status: 'cpm-waiting' } });
    const rejected = await AccessoryRequest.count({ 
      where: { 
        status: { [Op.in]: ['admin-rejected', 'cpm-rejected'] } 
      } 
    });

    res.json({
      success: true,
      data: {
        pending,
        adminApproved,
        cpmApproved,
        cpmWaiting,
        issued,
        rejected,
        total: pending + adminApproved + cpmApproved + issued + rejected
      }
    });
  } catch (error) {
    console.error('Error fetching accessory request stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
