const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');

// Authenticate token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Hakuna token ya uthibitisho' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Mtumiaji hapatikani' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false, 
        error: 'Akaunti imezimwa' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token batili' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token imeisha muda' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      error: 'Hitilafu ya uthibitisho' 
    });
  }
};

// Check role permissions
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Huna ruhusa ya kufanya hili' 
      });
    }
    next();
  };
};

// Check specific permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (!req.user.permissions || !req.user.permissions[permission]) {
      return res.status(403).json({ 
        success: false, 
        error: 'Huna ruhusa ya kufanya hili' 
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize, checkPermission };
