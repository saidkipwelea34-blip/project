const express = require('express');
const router = express.Router();
const { ServiceRequest, ServiceRequestAssignment, User, Asset } = require('../models');
const { Op } = require('sequelize');

// Get all service requests (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, type, requestedBy, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (requestedBy) where.requestedBy = requestedBy;

    const { rows: data, count } = await ServiceRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'department'] },
        { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName'] },
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] },
        { 
          model: ServiceRequestAssignment, 
          as: 'assignments',
          include: [{ model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'phone'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data, count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    console.error('Error fetching service requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get my requests (for end users)
router.get('/my-requests', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const where = { requestedBy: userId };
    if (status) where.status = status;

    const { rows: data, count } = await ServiceRequest.findAndCountAll({
      where,
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] },
        { 
          model: ServiceRequestAssignment, 
          as: 'assignments',
          include: [{ model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'phone'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data, count, page: parseInt(page), totalPages: Math.ceil(count / limit) });
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get assigned requests (for technicians)
router.get('/assigned-to-me', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const assignments = await ServiceRequestAssignment.findAll({
      where: { technicianId: userId },
      attributes: ['serviceRequestId']
    });

    const requestIds = assignments.map(a => a.serviceRequestId);
    
    const where = { id: { [Op.in]: requestIds } };
    if (status) where.status = status;

    const { rows: data, count } = await ServiceRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'department'] },
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] },
        { 
          model: ServiceRequestAssignment, 
          as: 'assignments',
          include: [{ model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'phone'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data, count });
  } catch (error) {
    console.error('Error fetching assigned requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single service request
router.get('/:id', async (req, res) => {
  try {
    const request = await ServiceRequest.findByPk(req.params.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'department', 'phone'] },
        { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName'] },
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag', 'location'] },
        { 
          model: ServiceRequestAssignment, 
          as: 'assignments',
          include: [{ model: User, as: 'technician', attributes: ['id', 'firstName', 'lastName', 'phone', 'email'] }]
        }
      ]
    });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate request number
async function generateRequestNumber() {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `SR${year}${month}`;
  
  // Get the last request number for this month
  const lastRequest = await ServiceRequest.findOne({
    where: {
      requestNumber: {
        [require('sequelize').Op.like]: `${prefix}%`
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

// Create service request (end user)
router.post('/', async (req, res) => {
  try {
    const { assetId, type, title, description, priority, location, department } = req.body;
    
    // Generate unique request number
    const requestNumber = await generateRequestNumber();
    
    const request = await ServiceRequest.create({
      requestNumber,
      requestedBy: req.user.id,
      assetId,
      type,
      title,
      description,
      priority: priority || 'medium',
      location,
      department: department || req.user.department,
      status: 'pending'
    });

    const fullRequest = await ServiceRequest.findByPk(request.id, {
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Asset, as: 'asset', attributes: ['id', 'name', 'assetTag'] }
      ]
    });

    res.status(201).json({ success: true, data: fullRequest });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve service request (admin)
router.put('/:id/approve', async (req, res) => {
  try {
    const { estimatedCompletionDate } = req.body;
    
    const request = await ServiceRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending requests can be approved' });
    }

    await request.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      estimatedCompletionDate,
      progressNotes: [
        ...request.progressNotes,
        { date: new Date(), note: 'Request approved', by: `${req.user.firstName} ${req.user.lastName}` }
      ]
    });

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Error approving service request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject service request (admin)
router.put('/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    const request = await ServiceRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    await request.update({
      status: 'rejected',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      rejectionReason,
      progressNotes: [
        ...request.progressNotes,
        { date: new Date(), note: `Request rejected: ${rejectionReason}`, by: `${req.user.firstName} ${req.user.lastName}` }
      ]
    });

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Error rejecting service request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assign technicians (admin)
router.post('/:id/assign', async (req, res) => {
  try {
    const { technicianIds, notes } = req.body;
    const requestId = req.params.id;
    
    const request = await ServiceRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    if (!['approved', 'in-progress'].includes(request.status)) {
      return res.status(400).json({ success: false, error: 'Request must be approved before assigning technicians' });
    }

    // Create assignments for each technician
    const assignments = [];
    for (let i = 0; i < technicianIds.length; i++) {
      const assignment = await ServiceRequestAssignment.create({
        serviceRequestId: requestId,
        technicianId: technicianIds[i],
        assignedBy: req.user.id,
        isLead: i === 0,
        notes
      });
      assignments.push(assignment);
    }

    // Get technician names
    const technicians = await User.findAll({
      where: { id: technicianIds },
      attributes: ['firstName', 'lastName']
    });
    const techNames = technicians.map(t => `${t.firstName} ${t.lastName}`).join(', ');

    // Update request status to in-progress
    await request.update({
      status: 'in-progress',
      startedAt: request.startedAt || new Date(),
      progressNotes: [
        ...request.progressNotes,
        { date: new Date(), note: `Technicians assigned: ${techNames}`, by: `${req.user.firstName} ${req.user.lastName}` }
      ]
    });

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error assigning technicians:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update progress (technician)
router.put('/:id/progress', async (req, res) => {
  try {
    const { progress, note } = req.body;
    
    const request = await ServiceRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    const updates = {
      progress,
      progressNotes: [
        ...request.progressNotes,
        { date: new Date(), note, by: `${req.user.firstName} ${req.user.lastName}`, progress }
      ]
    };

    if (progress === 100) {
      updates.status = 'completed';
      updates.completedAt = new Date();
    }

    await request.update(updates);

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel request (end user or admin)
router.put('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const request = await ServiceRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    // Only pending or approved requests can be cancelled
    if (!['pending', 'approved'].includes(request.status)) {
      return res.status(400).json({ success: false, error: 'Cannot cancel request at this stage' });
    }

    await request.update({
      status: 'cancelled',
      progressNotes: [
        ...request.progressNotes,
        { date: new Date(), note: `Request cancelled: ${reason || 'No reason provided'}`, by: `${req.user.firstName} ${req.user.lastName}` }
      ]
    });

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit feedback (end user)
router.put('/:id/feedback', async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    
    const request = await ServiceRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({ success: false, error: 'Can only provide feedback for completed requests' });
    }

    await request.update({ feedback, rating });

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let where = {};
    
    if (userRole === 'user') {
      // End users see only their own requests
      where.requestedBy = userId;
    } else if (userRole === 'technician') {
      // Technicians see only their assigned tasks
      const assignments = await ServiceRequestAssignment.findAll({
        where: { technicianId: userId },
        attributes: ['serviceRequestId']
      });
      const requestIds = assignments.map(a => a.serviceRequestId);
      where.id = { [Op.in]: requestIds };
    }
    // Admin/Manager see all

    const [pending, approved, inProgress, completed, total] = await Promise.all([
      ServiceRequest.count({ where: { ...where, status: 'pending' } }),
      ServiceRequest.count({ where: { ...where, status: 'approved' } }),
      ServiceRequest.count({ where: { ...where, status: 'in-progress' } }),
      ServiceRequest.count({ where: { ...where, status: 'completed' } }),
      ServiceRequest.count({ where })
    ]);

    res.json({
      success: true,
      data: { pending, approved, inProgress, completed, total }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
