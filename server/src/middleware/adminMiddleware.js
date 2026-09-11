/* global require, module */

const authenticateToken = require('./authMiddleware');

function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    next();
  });
}

module.exports = requireAdmin;