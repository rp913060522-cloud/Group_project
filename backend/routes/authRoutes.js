/**
 * CareerSetu — Authentication Routes
 * Mounts: /api/auth
 */

'use strict';

const express = require('express');
const router = express.Router();

const { register, login, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', register);
router.post('/login', login);

// Protected endpoints
router.get('/me', authenticateToken, getMe);

module.exports = router;
