/**
 * CareerSetu — Phase 2 Authentication Test Suite
 *
 * Tests the complete authentication flow in isolation:
 *   1. Registration validation (missing email, invalid email, missing password, short password)
 *   2. Successful registration (HTTP 201, token, public profile)
 *   3. Duplicate email rejection (HTTP 409)
 *   4. Password hashing verification (bcrypt hash verified, never plain text)
 *   5. Successful login (HTTP 200, JWT token, public profile)
 *   6. Incorrect password rejection (HTTP 401)
 *   7. Unknown email login rejection (HTTP 401)
 *   8. Missing JWT on protected route /api/auth/me (HTTP 401)
 *   9. Invalid/tampered JWT on protected route (HTTP 401)
 *  10. Valid JWT on protected route (HTTP 200, returns user profile)
 *  11. Data safety: password and passwordHash are NEVER leaked in any API response
 */

'use strict';

const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Ensure environment variables are loaded
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Ensure fallback secret for testing if not set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_careersetu_2026';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const Student = require('../models/Student');
const emailService = require('../services/emailService');
const { app } = require('../server');

// Intercept email dispatch during test to prevent real outbound emails to dummy test addresses
const dispatchedResetEmails = [];
emailService.sendPasswordResetEmail = async function (options) {
  dispatchedResetEmails.push(options);
  return { success: true, simulated: true, recipient: options.to, messageId: 'mock-test-id' };
};

let passedTests = 0;
let totalTests  = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// In-memory test store to avoid touching or modifying real student data in MongoDB Atlas
const inMemoryStore = new Map();

// Helper to wrap mock student document with model methods
function wrapStudent(doc) {
  return {
    ...doc,
    toObject() {
      return JSON.parse(JSON.stringify(doc));
    },
    toPublicJSON() {
      const copy = JSON.parse(JSON.stringify(doc));
      delete copy.passwordHash;
      delete copy.resetPasswordToken;
      delete copy.resetPasswordExpires;
      return copy;
    },
    async comparePassword(candidate) {
      if (!doc.passwordHash || !candidate) return false;
      return bcrypt.compare(candidate, doc.passwordHash);
    },
    async save() {
      doc.passwordHash = this.passwordHash;
      doc.resetPasswordToken = this.resetPasswordToken;
      doc.resetPasswordExpires = this.resetPasswordExpires;
      inMemoryStore.set(doc.email, doc);
      return this;
    }
  };
}

// Install mock methods on Student model for the duration of this test
const originalFindOne = Student.findOne;
const originalFindById = Student.findById;
const originalSave = Student.prototype.save;

function setupMockDatabase() {
  Student.findOne = function (query) {
    let doc = null;
    if (query && query.email) {
      doc = inMemoryStore.get(String(query.email).toLowerCase());
    } else if (query && query.resetPasswordToken) {
      for (const d of inMemoryStore.values()) {
        if (d.resetPasswordToken === query.resetPasswordToken) {
          if (query.resetPasswordExpires && query.resetPasswordExpires.$gt) {
            if (new Date(d.resetPasswordExpires) > new Date(query.resetPasswordExpires.$gt)) {
              doc = d;
              break;
            }
          } else {
            doc = d;
            break;
          }
        }
      }
    }
    const wrapped = doc ? wrapStudent(doc) : null;

    // Chainable object to mimic Mongoose's .select('+passwordHash')
    return {
      select(field) {
        return Promise.resolve(wrapped);
      },
      then(resolve, reject) {
        return Promise.resolve(wrapped).then(resolve, reject);
      }
    };
  };

  Student.findById = function (id) {
    let found = null;
    for (const doc of inMemoryStore.values()) {
      if (String(doc._id) === String(id)) {
        found = wrapStudent(doc);
        break;
      }
    }
    return Promise.resolve(found);
  };

  Student.prototype.save = async function () {
    const doc = {
      _id: this._id || 'mock_id_' + Math.random().toString(36).substring(2, 9),
      email: this.email,
      passwordHash: this.passwordHash,
      resetPasswordToken: this.resetPasswordToken,
      resetPasswordExpires: this.resetPasswordExpires,
      personalInfo: this.personalInfo ? JSON.parse(JSON.stringify(this.personalInfo)) : {},
      isGuest: Boolean(this.isGuest),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryStore.set(doc.email, doc);
    this._id = doc._id;
    return this;
  };
}

function restoreDatabase() {
  Student.findOne = originalFindOne;
  Student.findById = originalFindById;
  Student.prototype.save = originalSave;
}

// Helper to make HTTP requests against the test server
function request(serverPort, method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = { ...headers };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: serverPort,
        path: endpoint,
        method,
        headers: reqHeaders
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => { raw += c; });
        res.on('end', () => {
          let data;
          try {
            data = JSON.parse(raw);
          } catch (e) {
            data = raw;
          }
          resolve({ status: res.statusCode, data });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('   CareerSetu — Phase 2 Authentication Tests');
  console.log('====================================================\n');

  setupMockDatabase();

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
  const port = testServer.address().port;
  console.log(`  ℹ️ Test server running on http://127.0.0.1:${port}\n`);

  try {
    /* ── 1. Registration Validation Checks ───────────────────────────── */
    console.log('1. Registration Validation:');

    // Missing email
    const resNoEmail = await request(port, 'POST', '/api/auth/register', {
      name: 'Test Student',
      password: 'password123'
    });
    assert(resNoEmail.status === 400, 'Registration rejects missing email with HTTP 400');
    assert(resNoEmail.data && resNoEmail.data.status === 'error', 'Error response has status: "error"');

    // Invalid email format
    const resBadEmail = await request(port, 'POST', '/api/auth/register', {
      name: 'Test Student',
      email: 'not-an-email',
      password: 'password123'
    });
    assert(resBadEmail.status === 400, 'Registration rejects malformed email with HTTP 400');

    // Missing password
    const resNoPass = await request(port, 'POST', '/api/auth/register', {
      name: 'Test Student',
      email: 'valid@example.com'
    });
    assert(resNoPass.status === 400, 'Registration rejects missing password with HTTP 400');

    // Password too short (< 6 characters)
    const resShortPass = await request(port, 'POST', '/api/auth/register', {
      name: 'Test Student',
      email: 'valid@example.com',
      password: '123'
    });
    assert(resShortPass.status === 400, 'Registration rejects short password (<6 chars) with HTTP 400');

    /* ── 2. Successful Registration ──────────────────────────────────── */
    console.log('\n2. Successful Registration:');

    const testStudentData = {
      name: 'Aarav Patel',
      email: 'aarav.patel@example.com',
      password: 'SecurePassword123!'
    };

    const regRes = await request(port, 'POST', '/api/auth/register', testStudentData);
    assert(regRes.status === 201, 'Successful registration responds with HTTP 201 Created');
    assert(regRes.data && regRes.data.status === 'success', 'Response status is "success"');
    assert(typeof regRes.data.token === 'string' && regRes.data.token.length > 20, 'Response includes valid JWT token');
    assert(regRes.data.student && regRes.data.student.email === testStudentData.email, 'Response includes correct registered student email');
    assert(regRes.data.student.personalInfo.fullName === testStudentData.name, 'Response preserves student full name');

    // Security check: passwords must never leak in response
    assert(!regRes.data.student.passwordHash, 'Registered student response omits passwordHash');
    assert(!regRes.data.student.password, 'Registered student response omits plain-text password');

    /* ── 3. Duplicate Email Rejection ────────────────────────────────── */
    console.log('\n3. Duplicate Email Handling:');

    const dupRes = await request(port, 'POST', '/api/auth/register', testStudentData);
    assert(dupRes.status === 409, 'Registration rejects duplicate email with HTTP 409 Conflict');
    assert(dupRes.data && dupRes.data.status === 'error', 'Duplicate response status is "error"');
    assert(dupRes.data.message.includes('already exists'), 'Duplicate response explains email already exists');

    /* ── 4. Password Hashing Verification ────────────────────────────── */
    console.log('\n4. Password Hashing Verification:');

    const storedStudent = inMemoryStore.get(testStudentData.email);
    assert(Boolean(storedStudent), 'Student is persisted in database');
    assert(storedStudent.passwordHash !== testStudentData.password, 'Stored password is NOT plain text');
    assert(storedStudent.passwordHash.startsWith('$2a$') || storedStudent.passwordHash.startsWith('$2b$'), 'Password is stored as a valid bcrypt hash');

    const isMatch = await bcrypt.compare(testStudentData.password, storedStudent.passwordHash);
    assert(isMatch === true, 'Stored bcrypt hash verifies against original password');

    /* ── 5. Successful Login ─────────────────────────────────────────── */
    console.log('\n5. Successful Login:');

    const loginRes = await request(port, 'POST', '/api/auth/login', {
      email: testStudentData.email,
      password: testStudentData.password
    });

    assert(loginRes.status === 200, 'Successful login responds with HTTP 200 OK');
    assert(loginRes.data && loginRes.data.status === 'success', 'Login response status is "success"');
    assert(typeof loginRes.data.token === 'string' && loginRes.data.token.length > 20, 'Login response returns JWT token');
    assert(loginRes.data.student && loginRes.data.student.email === testStudentData.email, 'Login returns matching student email');
    assert(!loginRes.data.student.passwordHash, 'Login response omits passwordHash');
    assert(!loginRes.data.student.password, 'Login response omits plain-text password');

    const authToken = loginRes.data.token;

    /* ── 6. Incorrect Password & Unknown User Rejection ─────────────── */
    console.log('\n6. Login Credential Validation:');

    // Wrong password
    const wrongPassRes = await request(port, 'POST', '/api/auth/login', {
      email: testStudentData.email,
      password: 'IncorrectPassword'
    });
    assert(wrongPassRes.status === 401, 'Login with incorrect password returns HTTP 401');
    assert(wrongPassRes.data.status === 'error', 'Incorrect password response has status: "error"');

    // Unknown email
    const unknownEmailRes = await request(port, 'POST', '/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'SomePassword123'
    });
    assert(unknownEmailRes.status === 401, 'Login with non-existent email returns HTTP 401');

    // Missing fields
    const missingFieldsRes = await request(port, 'POST', '/api/auth/login', {});
    assert(missingFieldsRes.status === 400, 'Login with missing fields returns HTTP 400');

    /* ── 7. Protected Route /api/auth/me ─────────────────────────────── */
    console.log('\n7. Protected Endpoint /api/auth/me:');

    // No token
    const noTokenRes = await request(port, 'GET', '/api/auth/me');
    assert(noTokenRes.status === 401, 'Protected /api/auth/me rejects request without token with HTTP 401');

    // Invalid token
    const badTokenRes = await request(port, 'GET', '/api/auth/me', null, {
      Authorization: 'Bearer invalid.token.value'
    });
    assert(badTokenRes.status === 401, 'Protected /api/auth/me rejects invalid token with HTTP 401');

    // Valid token
    const validMeRes = await request(port, 'GET', '/api/auth/me', null, {
      Authorization: `Bearer ${authToken}`
    });
    assert(validMeRes.status === 200, 'Protected /api/auth/me succeeds with valid Bearer token (HTTP 200)');
    assert(validMeRes.data && validMeRes.data.status === 'success', 'Response status is "success"');
    assert(validMeRes.data.student && validMeRes.data.student.email === testStudentData.email, 'Protected endpoint returns authenticated user email');
    assert(validMeRes.data.student.personalInfo.fullName === testStudentData.name, 'Protected endpoint returns authenticated student name');
    assert(!validMeRes.data.student.passwordHash, 'Protected profile omits passwordHash');

    /* ── 8. Forgot Password & Password Reset Flow ─────────────────────── */
    console.log('\n8. Forgot Password & Password Reset Flow:');

    // Missing email
    const emptyForgotRes = await request(port, 'POST', '/api/auth/forgot-password', {});
    assert(emptyForgotRes.status === 400, 'Forgot password rejects missing email with HTTP 400');

    // Invalid email format
    const invalidForgotRes = await request(port, 'POST', '/api/auth/forgot-password', { email: 'invalid-email' });
    assert(invalidForgotRes.status === 400, 'Forgot password rejects invalid email format with HTTP 400');

    // Non-existent email (returns generic success to prevent email enumeration)
    const nonExistentForgotRes = await request(port, 'POST', '/api/auth/forgot-password', { email: 'nobody@example.com' });
    assert(nonExistentForgotRes.status === 200, 'Forgot password returns HTTP 200 for non-existent email (anti-enumeration)');
    assert(nonExistentForgotRes.data.status === 'success', 'Response status is "success"');

    // Valid existing email
    const validForgotRes = await request(port, 'POST', '/api/auth/forgot-password', { email: testStudentData.email });
    assert(validForgotRes.status === 200, 'Forgot password succeeds for registered email with HTTP 200');
    assert(validForgotRes.data.status === 'success', 'Response status is "success"');

    // Email dispatch verification (intended recipient & duplicate prevention)
    assert(dispatchedResetEmails.length === 1, 'Exactly one password reset email dispatched per request (no duplicates)');
    assert(dispatchedResetEmails[0].to === testStudentData.email, 'Email sent strictly to intended recipient matching registered student');
    assert(Boolean(dispatchedResetEmails[0].resetUrl && dispatchedResetEmails[0].resetUrl.includes('/reset-password.html?token=')), 'Reset email contains valid reset URL');

    // Check mock database for token
    const studentAfterForgot = inMemoryStore.get(testStudentData.email);
    assert(!!studentAfterForgot.resetPasswordToken, 'Generates and stores SHA-256 hashed reset token in student record');
    assert(new Date(studentAfterForgot.resetPasswordExpires) > new Date(), 'Sets token expiration time in the future');

    // Verify token endpoint without token
    const emptyVerifyRes = await request(port, 'GET', '/api/auth/verify-reset-token');
    assert(emptyVerifyRes.status === 400, 'Verify token endpoint rejects missing token with HTTP 400');

    // Verify token endpoint with invalid token
    const badVerifyRes = await request(port, 'GET', '/api/auth/verify-reset-token?token=completely_fake_token_123');
    assert(badVerifyRes.status === 400, 'Verify token endpoint rejects invalid token with HTTP 400');
    assert(badVerifyRes.data.valid === false, 'Invalid token returns valid: false');

    // Setup a known token to test verification and reset
    const crypto = require('crypto');
    const testRawToken = 'test_raw_token_abcdef1234567890';
    const testHashedToken = crypto.createHash('sha256').update(testRawToken).digest('hex');
    studentAfterForgot.resetPasswordToken = testHashedToken;
    studentAfterForgot.resetPasswordExpires = new Date(Date.now() + 3600000);
    inMemoryStore.set(testStudentData.email, studentAfterForgot);

    // Verify token endpoint with valid raw token
    const goodVerifyRes = await request(port, 'GET', `/api/auth/verify-reset-token?token=${testRawToken}`);
    assert(goodVerifyRes.status === 200, 'Verify token endpoint accepts valid raw token with HTTP 200');
    assert(goodVerifyRes.data.valid === true, 'Valid token returns valid: true');
    assert(goodVerifyRes.data.email === testStudentData.email, 'Valid token returns user email');

    // Reset password validation: missing password
    const noPassResetRes = await request(port, 'POST', '/api/auth/reset-password', { token: testRawToken });
    assert(noPassResetRes.status === 400, 'Reset password rejects missing password with HTTP 400');

    // Reset password validation: short password
    const shortPassResetRes = await request(port, 'POST', '/api/auth/reset-password', {
      token: testRawToken,
      password: '123'
    });
    assert(shortPassResetRes.status === 400, 'Reset password rejects password under 6 characters with HTTP 400');

    // Reset password validation: invalid token
    const badTokenResetRes = await request(port, 'POST', '/api/auth/reset-password', {
      token: 'invalid_reset_token',
      password: 'NewStrongPassword456'
    });
    assert(badTokenResetRes.status === 400, 'Reset password rejects invalid token with HTTP 400');

    // Successful password reset
    const newPassword = 'NewSecretPassword789';
    const successResetRes = await request(port, 'POST', '/api/auth/reset-password', {
      token: testRawToken,
      password: newPassword
    });
    assert(successResetRes.status === 200, 'Reset password succeeds with valid token (HTTP 200)');
    assert(successResetRes.data.status === 'success', 'Response status is "success"');

    // Verify token cannot be reused
    const reusedResetRes = await request(port, 'POST', '/api/auth/reset-password', {
      token: testRawToken,
      password: 'AnotherPassword999'
    });
    assert(reusedResetRes.status === 400, 'Token cannot be reused once consumed (one-time use, HTTP 400)');

    // Verify old password fails login
    const oldLoginRes = await request(port, 'POST', '/api/auth/login', {
      email: testStudentData.email,
      password: testStudentData.password
    });
    assert(oldLoginRes.status === 401, 'Login with old password now fails (HTTP 401)');

    // Verify new password succeeds login
    const newLoginRes = await request(port, 'POST', '/api/auth/login', {
      email: testStudentData.email,
      password: newPassword
    });
    assert(newLoginRes.status === 200, 'Login with newly reset password succeeds (HTTP 200)');
    assert(!!newLoginRes.data.token, 'Login returns new JWT authentication token');

    console.log('\n====================================================');
    console.log(`Result: ${passedTests} of ${totalTests} checks passed.`);
    console.log('====================================================');

    if (passedTests === totalTests) {
      console.log('🎉 Phase 2 Authentication API verified successfully!\n');
    }
  } finally {
    restoreDatabase();
    await new Promise((resolve) => testServer.close(resolve));
    console.log('  ℹ️ Test server closed cleanly.\n');
  }
}

run().catch((err) => {
  console.error('Fatal error in auth test runner:', err);
  restoreDatabase();
  process.exit(1);
});
