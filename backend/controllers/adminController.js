/**
 * CareerSetu — Admin Controller
 * Handles administrator authentication, metrics reporting, student management,
 * and data export (CSV/Excel).
 */

'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Student = require('../models/Student');

/**
 * Admin Login
 * POST /api/admin/login
 */
async function login(req, res) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[AdminController] ❌ JWT_SECRET is not configured.');
      return res.status(500).json({
        status: 'error',
        message: 'Authentication service configuration error.'
      });
    }

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Both admin email and password are required.'
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Query admin and include passwordHash
    const admin = await Admin.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid administrative credentials.'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid administrative credentials.'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Issue JWT token containing role: 'admin'
    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role || 'admin',
        name: admin.fullName
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Admin authentication successful.',
      token,
      admin: admin.toPublicJSON()
    });
  } catch (error) {
    console.error('[AdminController] Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during admin login.'
    });
  }
}

/**
 * Get Authenticated Admin Profile
 * GET /api/admin/me
 */
async function getMe(req, res) {
  try {
    if (!req.admin) {
      return res.status(401).json({
        status: 'error',
        message: 'Admin authentication required.'
      });
    }

    return res.status(200).json({
      status: 'success',
      admin: req.admin.toPublicJSON()
    });
  } catch (error) {
    console.error('[AdminController] GetMe error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve admin profile.'
    });
  }
}

/**
 * Get Platform Dashboard Statistics
 * GET /api/admin/stats
 */
async function getStats(req, res) {
  try {
    const [totalStudents, totalGuests, completedProfiles, aiGuidanceCount, educationCounts] = await Promise.all([
      Student.countDocuments({ isGuest: false }),
      Student.countDocuments({ isGuest: true }),
      Student.countDocuments({
        isGuest: false,
        profileComplete: true,
        educationComplete: true,
        interestComplete: true
      }),
      Student.countDocuments({
        isGuest: false,
        'aiResult.status': 'success'
      }),
      Student.aggregate([
        { $match: { isGuest: false, 'education.eduLevel': { $exists: true, $ne: '' } } },
        { $group: { _id: '$education.eduLevel', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).catch(() => [])
    ]);

    const stats = {
      totalRegisteredStudents: totalStudents,
      totalGuestSessions: totalGuests,
      fullyCompletedProfiles: completedProfiles,
      aiGuidanceGenerated: aiGuidanceCount,
      completionRate: totalStudents > 0 ? Math.round((completedProfiles / totalStudents) * 100) : 0,
      educationBreakdown: educationCounts || []
    };

    return res.status(200).json({
      status: 'success',
      stats
    });
  } catch (error) {
    console.error('[AdminController] Stats error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to aggregate platform metrics.'
    });
  }
}

/**
 * Get Filtered and Paginated Student Records
 * GET /api/admin/students
 */
async function getStudents(req, res) {
  try {
    const {
      search,
      eduLevel,
      stream,
      profileStatus,
      includeGuests = 'false',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filter out guest users by default unless explicitly requested
    if (includeGuests === 'true') {
      // allow all
    } else {
      query.isGuest = false;
    }

    // Text search on name, email, location, phone
    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { email: regex },
        { 'personalInfo.fullName': regex },
        { 'personalInfo.location': regex },
        { 'personalInfo.phone': regex }
      ];
    }

    // Filter by education level
    if (eduLevel && String(eduLevel).trim()) {
      query['education.eduLevel'] = new RegExp(String(eduLevel).trim(), 'i');
    }

    // Filter by stream
    if (stream && String(stream).trim()) {
      query['education.stream'] = new RegExp(String(stream).trim(), 'i');
    }

    // Filter by completion status
    if (profileStatus === 'complete') {
      query.profileComplete = true;
      query.educationComplete = true;
      query.interestComplete = true;
    } else if (profileStatus === 'incomplete') {
      query.$or = [
        { profileComplete: false },
        { educationComplete: false },
        { interestComplete: false }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'fullName') {
      sortOptions['personalInfo.fullName'] = sortDirection;
    } else if (sortBy === 'lastActive') {
      sortOptions.lastActive = sortDirection;
    } else {
      sortOptions.createdAt = sortDirection;
    }

    const [total, students] = await Promise.all([
      Student.countDocuments(query),
      Student.find(query)
        .select('-passwordHash -resetPasswordToken -resetPasswordExpires')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    const sanitizedStudents = (students || []).map((s) => {
      const copy = { ...s };
      delete copy.passwordHash;
      delete copy.resetPasswordToken;
      delete copy.resetPasswordExpires;
      return copy;
    });

    return res.status(200).json({
      status: 'success',
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      students: sanitizedStudents
    });
  } catch (error) {
    console.error('[AdminController] GetStudents error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve student records.'
    });
  }
}

/**
 * Get Specific Student Details
 * GET /api/admin/students/:id
 */
async function getStudentById(req, res) {
  try {
    const student = await Student.findById(req.params.id)
      .select('-passwordHash -resetPasswordToken -resetPasswordExpires')
      .lean();

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student record not found.'
      });
    }

    delete student.passwordHash;
    delete student.resetPasswordToken;
    delete student.resetPasswordExpires;

    return res.status(200).json({
      status: 'success',
      student
    });
  } catch (error) {
    console.error('[AdminController] GetStudentById error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve student details.'
    });
  }
}

/**
 * Export Student Records as CSV
 * GET /api/admin/export/csv
 */
async function exportCSV(req, res) {
  try {
    const { search, eduLevel, stream, profileStatus, includeGuests = 'false' } = req.query;
    const query = {};

    if (includeGuests !== 'true') {
      query.isGuest = false;
    }

    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { email: regex },
        { 'personalInfo.fullName': regex },
        { 'personalInfo.location': regex },
        { 'personalInfo.phone': regex }
      ];
    }

    if (eduLevel && String(eduLevel).trim()) {
      query['education.eduLevel'] = new RegExp(String(eduLevel).trim(), 'i');
    }

    if (stream && String(stream).trim()) {
      query['education.stream'] = new RegExp(String(stream).trim(), 'i');
    }

    if (profileStatus === 'complete') {
      query.profileComplete = true;
      query.educationComplete = true;
      query.interestComplete = true;
    } else if (profileStatus === 'incomplete') {
      query.$or = [
        { profileComplete: false },
        { educationComplete: false },
        { interestComplete: false }
      ];
    }

    const students = await Student.find(query)
      .select('-passwordHash -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Student ID',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Age',
      'Gender',
      'Location',
      'Education Level',
      'Stream / Branch',
      'Marks / Score',
      'Favourite Subjects',
      'Career Field',
      'Career Priority',
      'Target Skills',
      'Profile Complete',
      'AI Guidance Generated',
      'Registration Date',
      'Last Active'
    ];

    function escapeCSV(val) {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }

    const rows = students.map((s) => {
      const p = s.personalInfo || {};
      const e = s.education || {};
      const c = s.careerInterest || {};
      const isComplete = Boolean(s.profileComplete && s.educationComplete && s.interestComplete);
      const hasAI = s.aiResult && s.aiResult.status === 'success';

      return [
        escapeCSV(s._id),
        escapeCSV(p.fullName || 'N/A'),
        escapeCSV(s.email),
        escapeCSV(p.phone || 'N/A'),
        escapeCSV(p.age || 'N/A'),
        escapeCSV(p.gender || 'N/A'),
        escapeCSV(p.location || 'N/A'),
        escapeCSV(e.eduLevel || 'N/A'),
        escapeCSV(e.stream || 'N/A'),
        escapeCSV(e.marks || 'N/A'),
        escapeCSV(e.subjects || 'N/A'),
        escapeCSV(c.field || 'N/A'),
        escapeCSV(c.preference || 'N/A'),
        escapeCSV(c.skills || 'N/A'),
        escapeCSV(isComplete ? 'Complete' : 'Incomplete'),
        escapeCSV(hasAI ? 'Yes' : 'No'),
        escapeCSV(s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : 'N/A'),
        escapeCSV(s.lastActive ? new Date(s.lastActive).toISOString().split('T')[0] : 'N/A')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="careersetu-students-${dateStr}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('[AdminController] ExportCSV error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate student data export.'
    });
  }
}

module.exports = {
  login,
  getMe,
  getStats,
  getStudents,
  getStudentById,
  exportCSV
};
