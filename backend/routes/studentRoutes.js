/**
 * CareerSetu — Student Data Routes (Phase 3)
 * Mounts: /api/student
 * All endpoints require JWT authentication.
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  getProfile,
  updatePersonalInfo,
  updateEducation,
  updateCareerInterest
} = require('../controllers/studentController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All student routes require valid Bearer token authentication
router.use(authenticateToken);

// Profile retrieval
router.get('/profile', getProfile);

// Step 1: Personal / Student Information
router.put('/personal-info', updatePersonalInfo);
router.put('/profile', updatePersonalInfo); // Alias for convenience

// Step 2: Educational Background
router.put('/education', updateEducation);

// Step 3: Career Interests & Skills
router.put('/career-interest', updateCareerInterest);

module.exports = router;
