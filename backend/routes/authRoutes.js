/**
 * CareerSetu — Authentication Routes
 * Mounts: /api/auth
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  forgotPassword,
  verifyResetToken,
  resetPassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);

// Protected endpoints
router.get('/me', authenticateToken, getMe);

module.exports = router;
