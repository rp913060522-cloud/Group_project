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
const { app } = require('../server');

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
      return copy;
    },
    async comparePassword(candidate) {
      if (!doc.passwordHash || !candidate) return false;
      return bcrypt.compare(candidate, doc.passwordHash);
    },
    async save() {
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
    const email = query && query.email ? String(query.email).toLowerCase() : null;
    const doc = email ? inMemoryStore.get(email) : null;
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
