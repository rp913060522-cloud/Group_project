/**
 * CareerSetu — Student Data Controller (Phase 3)
 * Handles profile retrieval and progressive persistence of:
 *   - Personal / Student Information
 *   - Educational Background
 *   - Career Interests & Skills
 */

'use strict';

const Student = require('../models/Student');

/**
 * Helper: Validate that a string exists, is a string, and has non-whitespace characters.
 */
function isValidString(val, minLen = 1, maxLen = 255) {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.length >= minLen && trimmed.length <= maxLen;
}

/**
 * GET /api/student/profile
 * Retrieves the authenticated student's full saved profile.
 */
async function getProfile(req, res) {
  try {
    const student = await Student.findById(req.student._id);
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student account not found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      student: student.toPublicJSON()
    });
  } catch (error) {
    console.error('[StudentController] Error fetching profile:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve student profile.'
    });
  }
}

/**
 * PUT /api/student/personal-info (also mounted at /api/student/profile)
 * Saves or updates personal information for the authenticated student.
 */
async function updatePersonalInfo(req, res) {
  try {
    const { fullName, age, gender, phone, location } = req.body || {};

    // 1. Validation
    if (!isValidString(fullName, 2, 100)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid full name (minimum 2 characters).'
      });
    }

    const parsedAge = Number(age);
    if (isNaN(parsedAge) || parsedAge < 10 || parsedAge > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid age between 10 and 100.'
      });
    }

    const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say', ''];
    if (gender && !validGenders.includes(gender)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please select a valid gender option.'
      });
    }

    if (!isValidString(phone, 7, 20)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid phone number (7 to 20 digits/characters).'
      });
    }

    if (!isValidString(location, 2, 120)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid city or location.'
      });
    }

    // 2. Fetch authenticated student record using verified JWT identity
    const student = await Student.findById(req.student._id);
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student account not found.'
      });
    }

    // 3. Update personal info subdocument
    student.personalInfo = {
      fullName: fullName.trim(),
      age: parsedAge,
      gender: gender || '',
      phone: phone.trim(),
      location: location.trim(),
      updatedAt: new Date()
    };
    student.profileComplete = true;
    student.lastActive = new Date();

    await student.save();

    return res.status(200).json({
      status: 'success',
      message: 'Student information saved successfully.',
      student: student.toPublicJSON()
    });
  } catch (error) {
    console.error('[StudentController] Error saving personal info:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save student information.'
    });
  }
}

/**
 * PUT /api/student/education
 * Saves or updates educational background for the authenticated student.
 */
async function updateEducation(req, res) {
  try {
    const {
      eduLevel,
      eduLevelSelect,
      eduLevelCustom,
      stream,
      streamSelect,
      streamCustom,
      subjects,
      marks
    } = req.body || {};

    // 1. Validation
    const effectiveEduLevel = (eduLevelCustom && eduLevelSelect === 'Other'
      ? eduLevelCustom
      : (eduLevel || eduLevelSelect || eduLevelCustom || '')
    ).trim();

    if (!effectiveEduLevel) {
      return res.status(400).json({
        status: 'error',
        message: 'Please specify your current education level.'
      });
    }

    const effectiveStream = (streamCustom && streamSelect === 'Other'
      ? streamCustom
      : (stream || streamSelect || streamCustom || '')
    ).trim();

    if (!effectiveStream) {
      return res.status(400).json({
        status: 'error',
        message: 'Please specify your stream or course.'
      });
    }

    const marksStr = marks !== undefined && marks !== null ? String(marks).trim() : '';
    if (!marksStr) {
      return res.status(400).json({
        status: 'error',
        message: 'Please enter your marks or percentage.'
      });
    }

    // 2. Fetch authenticated student record using verified JWT identity
    const student = await Student.findById(req.student._id);
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student account not found.'
      });
    }

    // 3. Update education subdocument
    student.education = {
      eduLevel: effectiveEduLevel,
      eduLevelSelect: (eduLevelSelect || '').trim(),
      eduLevelCustom: (eduLevelCustom || '').trim(),
      stream: effectiveStream,
      streamSelect: (streamSelect || '').trim(),
      streamCustom: (streamCustom || '').trim(),
      subjects: typeof subjects === 'string' ? subjects.trim() : '',
      marks: marksStr,
      updatedAt: new Date()
    };
    student.educationComplete = true;
    student.lastActive = new Date();

    await student.save();

    return res.status(200).json({
      status: 'success',
      message: 'Educational background saved successfully.',
      student: student.toPublicJSON()
    });
  } catch (error) {
    console.error('[StudentController] Error saving education:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save educational background.'
    });
  }
}

/**
 * PUT /api/student/career-interest
 * Saves or updates career interests and skills for the authenticated student.
 */
async function updateCareerInterest(req, res) {
  try {
    const {
      field,
      fieldSelect,
      fieldCustom,
      favSubjects,
      preference,
      preferenceSelect,
      preferenceCustom,
      skills
    } = req.body || {};

    // Determine effective field and preference (resolving 'Other' to custom text)
    const effectiveField = (fieldCustom && fieldSelect === 'Other'
      ? fieldCustom
      : (field || fieldSelect || fieldCustom || '')
    ).trim();

    const effectivePreference = (preferenceCustom && preferenceSelect === 'Other'
      ? preferenceCustom
      : (preference || preferenceSelect || preferenceCustom || '')
    ).trim();

    // 1. Validation
    if (!isValidString(effectiveField, 2, 100) || effectiveField.toLowerCase() === 'other') {
      return res.status(400).json({
        status: 'error',
        message: 'Please select or enter your preferred career field.'
      });
    }

    if (!isValidString(favSubjects, 2, 150)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please enter your favourite subjects.'
      });
    }

    if (!isValidString(effectivePreference, 2, 100) || effectivePreference.toLowerCase() === 'other') {
      return res.status(400).json({
        status: 'error',
        message: 'Please select or enter your career preference / priority.'
      });
    }

    if (!isValidString(skills, 2, 200)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please specify the skills you want to learn.'
      });
    }

    // 2. Fetch authenticated student record using verified JWT identity
    const student = await Student.findById(req.student._id);
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student account not found.'
      });
    }

    // 3. Update career interest subdocument
    student.careerInterest = {
      field: effectiveField,
      fieldSelect: (fieldSelect || '').trim(),
      fieldCustom: (fieldCustom || '').trim(),
      favSubjects: favSubjects.trim(),
      preference: effectivePreference,
      preferenceSelect: (preferenceSelect || '').trim(),
      preferenceCustom: (preferenceCustom || '').trim(),
      skills: skills.trim(),
      updatedAt: new Date()
    };
    student.interestComplete = true;
    student.lastActive = new Date();

    await student.save();

    return res.status(200).json({
      status: 'success',
      message: 'Career interests saved successfully.',
      student: student.toPublicJSON()
    });
  } catch (error) {
    console.error('[StudentController] Error saving career interest:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save career interests.'
    });
  }
}

module.exports = {
  getProfile,
  updatePersonalInfo,
  updateEducation,
  updateCareerInterest
};
