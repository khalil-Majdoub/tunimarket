const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to verify if the authenticated user has seller privileges.
 * Can be used after authMiddleware or as a standalone route protector.
 */
const sellerMiddleware = async (req, res, next) => {
  try {
    // 1. Check if req.user is already populated by prior auth middleware
    let userId = req.user?.id || req.user?._id;

    // 2. If token wasn't decoded prior, extract and verify it from headers
    if (!userId) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Authorization token missing or malformed.'
        });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret');
      userId = decoded.id || decoded._id;
    }

    // 3. Retrieve user record from database to verify current role & active status
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // 4. Verify seller status (allows both 'seller' and 'admin' roles)
    const isSeller = user.role === 'seller' || user.role === 'admin' || user.isSeller === true;

    if (!isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Seller privileges required.'
      });
    }

    // 5. Attach full user object to request for route handler convenience
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.'
      });
    }

    console.error('Seller middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authorization check.'
    });
  }
};

module.exports = sellerMiddleware;