/**
 * CareerSetu — AI Guidance Controller (Phase 4)
 * Handles /api/ai/analyze and /api/ai/saved endpoints.
 */

'use strict';

const Student = require('../models/Student');
const aiService = require('../services/aiService');

/**
 * POST /api/ai/analyze
 * Generates personalized career guidance for the authenticated student using Gemini.
 */
async function analyzeCareer(req, res) {
  try {
    const student = await Student.findById(req.student._id);
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Authenticated student record not found.'
      });
    }

    // Check if required profile sections exist
    const missing = [];
    if (!student.personalInfo?.fullName) {
      missing.push('Personal Information');
    }
    if (!student.education?.eduLevel || !student.education?.stream) {
      missing.push('Educational Background');
    }
    if (!student.careerInterest?.field && (!req.body || !req.body.interest)) {
      missing.push('Career Interests');
    }

    if (missing.length > 0) {
      return res.status(400).json({
        status: 'incomplete_profile',
        message: `Please complete your ${missing.join(' and ')} before generating personalized AI guidance.`,
        missing,
        redirectUrl: missing.includes('Personal Information')
          ? 'student-info.html'
          : missing.includes('Educational Background')
          ? 'education.html'
          : 'career-interest.html'
      });
    }

    const customInterest = req.body && typeof req.body.interest === 'string'
      ? req.body.interest.trim()
      : null;

    // Call Gemini AI service
    const { guidance, modelUsed } = await aiService.generateCareerGuidance(student, customInterest);

    // Save generated guidance in student's own record
    student.aiResult = {
      generatedAt: new Date(),
      promptSummary: `Guidance for ${customInterest || student.careerInterest?.field}`,
      parsedResult: guidance,
      status: 'success'
    };
    student.lastActive = new Date();
    await student.save();

    return res.status(200).json({
      status: 'success',
      guidance,
      generatedAt: student.aiResult.generatedAt,
      modelUsed
    });
  } catch (error) {
    console.error('[AIController] Guidance generation error:', error.message);

    if (error.code === 'CONFIG_MISSING') {
      return res.status(500).json({
        status: 'error',
        message: 'Gemini AI service is not configured on the server. Please verify GEMINI_API_KEY.'
      });
    }

    if (error.code === 'TIMEOUT') {
      return res.status(504).json({
        status: 'error',
        message: 'The AI request timed out. Please check your connection and try again.'
      });
    }

    return res.status(502).json({
      status: 'error',
      message: error.message || 'Unable to generate AI career guidance at this time. Please try again.'
    });
  }
}

/**
 * GET /api/ai/saved
 * Retrieves the previously saved AI guidance for the authenticated student.
 */
async function getSavedGuidance(req, res) {
  try {
    const student = await Student.findById(req.student._id);
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student account not found.'
      });
    }

    if (!student.aiResult || !student.aiResult.parsedResult || student.aiResult.status !== 'success') {
      return res.status(200).json({
        status: 'no_saved_guidance',
        message: 'No previous AI guidance found for this student account.'
      });
    }

    return res.status(200).json({
      status: 'success',
      guidance: student.aiResult.parsedResult,
      generatedAt: student.aiResult.generatedAt
    });
  } catch (error) {
    console.error('[AIController] Error retrieving saved guidance:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve saved guidance.'
    });
  }
}

module.exports = {
  analyzeCareer,
  getSavedGuidance
};
