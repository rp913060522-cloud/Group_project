/**
 * CareerSetu — Authentication Controller
 * Handles student registration, login, and authenticated profile retrieval.
 */

'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const emailService = require('../services/emailService');

// Simple RFC 5322 compliant regex for basic email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Identify database unavailability or buffering timeout errors.
 */
function isDbUnavailableError(err) {
  if (!err) return false;
  return (
    (err.name === 'MongooseError' && err.message && err.message.includes('buffering timed out')) ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoTimeoutError'
  );
}

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
    if (isDbUnavailableError(error)) {
      return res.status(503).json({
        status: 'error',
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please verify MongoDB Atlas connection.'
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
    if (isDbUnavailableError(error)) {
      return res.status(503).json({
        status: 'error',
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please verify MongoDB Atlas connection.'
      });
    }
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
    if (isDbUnavailableError(error)) {
      return res.status(503).json({
        status: 'error',
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please verify MongoDB Atlas connection.'
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error fetching user profile.'
    });
  }
}

/**
 * Request password reset link sent to registered email
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address.'
      });
    }

    const student = await Student.findOne({ email: normalizedEmail }).select('+passwordHash +resetPasswordToken +resetPasswordExpires');

    if (student) {
      // Generate cryptographically secure raw token (32 random bytes)
      const rawToken = crypto.randomBytes(32).toString('hex');
      // Store SHA-256 hash in database
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Token expires in 1 hour
      student.resetPasswordToken = hashedToken;
      student.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
      await student.save();

      // Determine client base URL
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      let clientUrl = process.env.CLIENT_URL;
      // Safeguard: In production (e.g. Render), never use localhost for email links
      if (!clientUrl || (process.env.NODE_ENV === 'production' && clientUrl.includes('localhost'))) {
        clientUrl = `${protocol}://${host}`;
      }
      const resetUrl = `${clientUrl.replace(/\/$/, '')}/reset-password.html?token=${rawToken}`;

      // Send the email (or log simulated link if SMTP is not configured)
      try {
        await emailService.sendPasswordResetEmail({
          to: student.email,
          name: student.personalInfo?.fullName || 'Student',
          resetUrl
        });
      } catch (emailErr) {
        console.error('[AuthController] ⚠️ Password reset email could not be dispatched:', emailErr.message);
      }
    }

    // Always return generic success message to prevent user enumeration
    return res.status(200).json({
      status: 'success',
      message: 'If an account exists with that email, a password reset link has been sent. Please check your inbox.'
    });
  } catch (error) {
    console.error('[AuthController] Forgot password error:', error.message || error);
    if (isDbUnavailableError(error)) {
      return res.status(503).json({
        status: 'error',
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please verify MongoDB Atlas connection.'
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process password reset request. Please try again later.'
    });
  }
}

/**
 * Verify validity of a password reset token
 * GET /api/auth/verify-reset-token
 */
async function verifyResetToken(req, res) {
  try {
    const token = req.query.token || req.body?.token;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({
        status: 'error',
        valid: false,
        message: 'Password reset token is required.'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const student = await Student.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!student) {
      return res.status(400).json({
        status: 'error',
        valid: false,
        message: 'Password reset link is invalid or has expired.'
      });
    }

    return res.status(200).json({
      status: 'success',
      valid: true,
      message: 'Password reset token is valid.',
      email: student.email
    });
  } catch (error) {
    console.error('[AuthController] Verify token error:', error);
    if (isDbUnavailableError(error)) {
      return res.status(503).json({
        status: 'error',
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please verify MongoDB Atlas connection.'
      });
    }
    return res.status(500).json({
      status: 'error',
      valid: false,
      message: 'Internal server error verifying token.'
    });
  }
}

/**
 * Reset password using a valid reset token
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { token, password, newPassword } = req.body || {};
    const pass = password || newPassword;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Password reset token is required.'
      });
    }

    if (!pass || typeof pass !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'New password is required.'
      });
    }

    if (pass.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long.'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const student = await Student.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+passwordHash +resetPasswordToken +resetPasswordExpires');

    if (!student) {
      return res.status(400).json({
        status: 'error',
        message: 'Password reset link is invalid or has expired. Please request a new one.'
      });
    }

    // Hash new password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(pass, salt);

    student.passwordHash = passwordHash;
    // Invalidate the one-time reset token
    student.resetPasswordToken = undefined;
    student.resetPasswordExpires = undefined;
    await student.save();

    return res.status(200).json({
      status: 'success',
      message: 'Your password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('[AuthController] Reset password error:', error);
    if (isDbUnavailableError(error)) {
      return res.status(503).json({
        status: 'error',
        code: 'DB_UNAVAILABLE',
        message: 'Database service is temporarily unavailable. Please verify MongoDB Atlas connection.'
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while resetting password.'
    });
  }
}

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  verifyResetToken,
  resetPassword
};
