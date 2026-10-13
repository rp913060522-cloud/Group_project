/**
 * CareerSetu — AI Guidance Routes (Phase 4)
 * Mounts: /api/ai
 * All endpoints require JWT authentication.
 */

'use strict';

const express = require('express');
const router = express.Router();

const { analyzeCareer, getSavedGuidance } = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All AI guidance routes require student authentication
router.use(authenticateToken);

// Generate personalized career guidance
router.post('/analyze', analyzeCareer);

// Retrieve previously generated guidance
router.get('/saved', getSavedGuidance);

module.exports = router;
