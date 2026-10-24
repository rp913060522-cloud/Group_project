/**
 * CareerSetu — Admin Routes
 * Mounts: /api/admin
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  login,
  getMe,
  getStats,
  getStudents,
  getStudentById,
  exportCSV
} = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/adminMiddleware');

// Public route: Admin authentication
router.post('/login', login);

// Protected routes: Require valid admin JWT
router.use(authenticateAdmin);

router.get('/me', getMe);
router.get('/stats', getStats);
router.get('/students', getStudents);
router.get('/students/:id', getStudentById);
router.get('/export/csv', exportCSV);

module.exports = router;
