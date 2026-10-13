/**
 * CareerSetu — JWT Authentication Middleware
 * Validates Bearer tokens and attaches the authenticated student to req.student.
 */

'use strict';

const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in.'
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
      console.error('[AuthMiddleware] ❌ JWT_SECRET is not defined in environment variables.');
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
          message: 'Your session has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authentication token.'
      });
    }

    const student = await Student.findById(decoded.id);
    if (!student) {
      return res.status(401).json({
        status: 'error',
        message: 'User account not found or was removed.'
      });
    }

    req.student = student;
    next();
  } catch (error) {
    console.error('[AuthMiddleware] Unexpected error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to authenticate user.'
    });
  }
}

module.exports = { authenticateToken };
