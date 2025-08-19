const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Verify JWT token - simplified approach
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔐 Authenticating request to:', req.path);
    console.log('📋 Token present:', !!token);

    if (!token) {
      console.log('❌ No access token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
    }

    try {
      // Verify the access token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token valid for user:', decoded.username);
      
      // Get fresh user data from database
      const [users] = await pool.execute(
        'SELECT id, username, email, role, area_id, status FROM users WHERE id = ? AND status = ?',
        [decoded.userId, 'active']
      );

      if (users.length === 0) {
        console.log('❌ User not found or inactive');
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
          code: 'USER_NOT_FOUND'
        });
      }

      req.user = users[0];
      next();
    } catch (tokenError) {
      console.log('❌ Token verification failed:', tokenError.message);
      
      if (tokenError.name === 'TokenExpiredError') {
        console.log('⏰ Access token expired - frontend should refresh');
        return res.status(401).json({
          success: false,
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED',
          requiresRefresh: true
        });
      } else if (tokenError.name === 'JsonWebTokenError') {
        console.log('🚫 Invalid token format');
        return res.status(401).json({
          success: false,
          message: 'Invalid token format',
          code: 'INVALID_TOKEN'
        });
      } else {
        console.log('🚫 Unknown token error');
        return res.status(403).json({
          success: false,
          message: 'Token validation failed',
          code: 'TOKEN_ERROR'
        });
      }
    }
  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Check user role authorization
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  validateInput
};
