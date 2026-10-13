/**
 * CareerSetu — Authentication Controller
 * Handles student registration, login, and authenticated profile retrieval.
 */

'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// Simple RFC 5322 compliant regex for basic email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new student account
 * POST /api/auth/register
 */
async function register(req, res) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[AuthController] ❌ JWT_SECRET is not configured.');
      return res.status(500).json({
        status: 'error',
        message: 'Authentication service configuration error.'
      });
    }

    const { name, fullName, email, password } = req.body || {};
    const displayName = (name || fullName || '').trim();

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address is required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address.'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Password is required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check for duplicate account
    const existingStudent = await Student.findOne({ email: normalizedEmail });
    if (existingStudent) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email address already exists. Please log in instead.'
      });
    }

    // Hash password with bcryptjs (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const student = new Student({
      email: normalizedEmail,
      passwordHash,
      personalInfo: {
        fullName: displayName
      },
      isGuest: false
    });

    await student.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id, email: student.email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(201).json({
      status: 'success',
      message: 'Account registered successfully.',
      token,
      student: student.toPublicJSON()
    });
  } catch (error) {
    console.error('[AuthController] Registration error:', error);
    // Handle Mongoose duplicate key error (code 11000) if race condition occurs
    if (error.code === 11000) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email address already exists.'
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while creating account.'
    });
  }
}

/**
 * Log in an existing student
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[AuthController] ❌ JWT_SECRET is not configured.');
      return res.status(500).json({
        status: 'error',
        message: 'Authentication service configuration error.'
      });
    }

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Both email and password are required.'
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Fetch student including the normally hidden passwordHash field
    const student = await Student.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!student) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    // Compare candidate password with stored hash
    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    // Update last activity
    student.lastActive = new Date();
    await student.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: student._id, email: student.email },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      token,
      student: student.toPublicJSON()
    });
  } catch (error) {
    console.error('[AuthController] Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during login.'
    });
  }
}

/**
 * Get profile of currently authenticated user
 * GET /api/auth/me
 */
async function getMe(req, res) {
  try {
    if (!req.student) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated.'
      });
    }

    return res.status(200).json({
      status: 'success',
      student: req.student.toPublicJSON()
    });
  } catch (error) {
    console.error('[AuthController] GetMe error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error fetching user profile.'
    });
  }
}

module.exports = {
  register,
  login,
  getMe
};
