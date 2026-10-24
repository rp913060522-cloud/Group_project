/**
 * CareerSetu — Admin Authorization Middleware
 * Enforces admin authentication and role verification.
 * Students and guests are strictly denied access with HTTP 403.
 */

'use strict';

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Verifies JWT token and ensures requester has administrative privileges.
 */
async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Admin login needed.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authorization header format.'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[AdminMiddleware] ❌ JWT_SECRET is not defined in environment variables.');
      return res.status(500).json({
        status: 'error',
        message: 'Authentication service is misconfigured on the server.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Admin session has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authentication token.'
      });
    }

    // Role check: Only admin or superadmin allowed
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'superadmin')) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied: Admin privileges required. Student or guest accounts cannot access administrative resources.'
      });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Admin account not found or has been deactivated.'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('[AdminMiddleware] Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error validating admin credentials.'
    });
  }
}

module.exports = {
  authenticateAdmin
};
