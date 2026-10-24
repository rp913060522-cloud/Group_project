/**
 * CareerSetu — Phase 5 Admin Panel Test Suite
 *
 * Verifies the complete administrative architecture in isolation:
 *   1. Admin login validation (missing fields, wrong credentials, non-existent admin)
 *   2. Successful admin login (HTTP 200, role: admin, safe public profile, no passwordHash)
 *   3. Role-based authorization & access control:
 *      - Requests without tokens -> HTTP 401
 *      - Requests with standard student tokens -> HTTP 403 Forbidden
 *      - Requests with valid admin tokens -> HTTP 200 OK
 *   4. Admin profile endpoint (/api/admin/me)
 *   5. Platform statistics (/api/admin/stats)
 *   6. Student record listing, searching & filtering (/api/admin/students)
 *   7. Specific student detail retrieval (/api/admin/students/:id)
 *   8. Privacy & secret protection:
 *      - passwordHash is never leaked
 *      - resetPasswordToken is never leaked
 *      - resetPasswordExpires is never leaked
 *   9. Data export (/api/admin/export/csv)
 */

'use strict';

const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_careersetu_admin_2026';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const Admin = require('../models/Admin');
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

// In-memory test stores
const inMemoryAdmins = new Map();
const inMemoryStudents = new Map();

// Helper to make HTTP requests
function request(port, method, reqPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: reqPath,
        method,
        headers: reqHeaders
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(rawData);
          } catch {
            data = rawData;
          }
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Original model functions for restoration
const originalAdminFindOne = Admin.findOne;
const originalAdminFindById = Admin.findById;
const originalStudentCountDocuments = Student.countDocuments;
const originalStudentFind = Student.find;
const originalStudentFindById = Student.findById;

function setupMockDatabase() {
  Admin.findOne = function (query) {
    const email = query && query.email ? String(query.email).toLowerCase() : null;
    const doc = email ? inMemoryAdmins.get(email) : null;
    const wrapped = doc ? {
      ...doc,
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
        inMemoryAdmins.set(doc.email, doc);
        return this;
      }
    } : null;

    return {
      select() { return Promise.resolve(wrapped); },
      then(resolve, reject) { return Promise.resolve(wrapped).then(resolve, reject); }
    };
  };

  Admin.findById = function (id) {
    let found = null;
    for (const doc of inMemoryAdmins.values()) {
      if (String(doc._id) === String(id)) {
        found = {
          ...doc,
          toPublicJSON() {
            const copy = JSON.parse(JSON.stringify(doc));
            delete copy.passwordHash;
            return copy;
          }
        };
        break;
      }
    }
    return Promise.resolve(found);
  };

  Student.countDocuments = function (query = {}) {
    let count = 0;
    for (const doc of inMemoryStudents.values()) {
      let matches = true;
      if (query.isGuest !== undefined && Boolean(doc.isGuest) !== Boolean(query.isGuest)) {
        matches = false;
      }
      if (query.profileComplete && !doc.profileComplete) matches = false;
      if (query.educationComplete && !doc.educationComplete) matches = false;
      if (query.interestComplete && !doc.interestComplete) matches = false;
      if (query['aiResult.status'] && (!doc.aiResult || doc.aiResult.status !== query['aiResult.status'])) matches = false;
      if (matches) count++;
    }
    return Promise.resolve(count);
  };

  Student.find = function (query = {}) {
    let results = Array.from(inMemoryStudents.values()).filter((doc) => {
      if (query.isGuest !== undefined && Boolean(doc.isGuest) !== Boolean(query.isGuest)) return false;
      if (query['education.eduLevel'] && (!doc.education || !query['education.eduLevel'].test(doc.education.eduLevel))) return false;
      if (query.$or) {
        // e.g. search regex
        const matchesOr = query.$or.some((cond) => {
          if (cond.email && cond.email.test(doc.email)) return true;
          if (cond['personalInfo.fullName'] && doc.personalInfo && cond['personalInfo.fullName'].test(doc.personalInfo.fullName)) return true;
          if (cond['personalInfo.location'] && doc.personalInfo && cond['personalInfo.location'].test(doc.personalInfo.location)) return true;
          return false;
        });
        if (!matchesOr) return false;
      }
      return true;
    });

    const chain = {
      select() { return chain; },
      sort() { return chain; },
      skip(n) {
        results = results.slice(n);
        return chain;
      },
      limit(n) {
        results = results.slice(0, n);
        return chain;
      },
      lean() { return Promise.resolve(JSON.parse(JSON.stringify(results))); },
      then(resolve, reject) { return Promise.resolve(results).then(resolve, reject); }
    };
    return chain;
  };

  Student.findById = function (id) {
    let found = null;
    for (const doc of inMemoryStudents.values()) {
      if (String(doc._id) === String(id)) {
        found = JSON.parse(JSON.stringify(doc));
        delete found.passwordHash;
        delete found.resetPasswordToken;
        delete found.resetPasswordExpires;
        break;
      }
    }
    return {
      select() { return this; },
      lean() { return Promise.resolve(found); },
      then(resolve, reject) { return Promise.resolve(found).then(resolve, reject); }
    };
  };
}

function restoreDatabase() {
  Admin.findOne = originalAdminFindOne;
  Admin.findById = originalAdminFindById;
  Student.countDocuments = originalStudentCountDocuments;
  Student.find = originalStudentFind;
  Student.findById = originalStudentFindById;
}

async function run() {
  console.log('====================================================');
  console.log('   CareerSetu — Phase 5 Admin & Security Tests');
  console.log('====================================================\n');

  setupMockDatabase();

  // Seed test Admin
  const adminSalt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('AdminSecurePass123!', adminSalt);
  const mockAdmin = {
    _id: 'admin_mock_id_001',
    email: 'admin@careersetu.org',
    passwordHash: adminPasswordHash,
    fullName: 'Chief Administrator',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  inMemoryAdmins.set(mockAdmin.email, mockAdmin);

  // Seed test Students
  const studentSalt = await bcrypt.genSalt(10);
  const studentPasswordHash = await bcrypt.hash('StudentPass123!', studentSalt);
  const mockStudentA = {
    _id: 'student_mock_001',
    email: 'rohit.sharma@example.org',
    passwordHash: studentPasswordHash,
    resetPasswordToken: 'mock_hashed_token_xyz',
    resetPasswordExpires: new Date(Date.now() + 3600000),
    isGuest: false,
    profileComplete: true,
    educationComplete: true,
    interestComplete: true,
    personalInfo: { fullName: 'Rohit Sharma', phone: '9876543210', age: 19, gender: 'Male', location: 'Nagpur' },
    education: { eduLevel: '12th Standard', stream: 'Science', marks: '84%', subjects: 'Physics, Chemistry, Maths' },
    careerInterest: { field: 'Engineering & Technology', preference: 'Software Development', skills: 'Python, JavaScript' },
    aiResult: { status: 'success', parsedResult: { summary: 'Strong analytical skills for Computer Engineering.', recommendedCareers: [{ title: 'Software Engineer' }] } },
    createdAt: new Date(),
    lastActive: new Date()
  };

  const mockStudentB = {
    _id: 'student_mock_002',
    email: 'sneha.patil@example.org',
    passwordHash: studentPasswordHash,
    isGuest: false,
    profileComplete: true,
    educationComplete: false,
    interestComplete: false,
    personalInfo: { fullName: 'Sneha Patil', phone: '9123456780', age: 17, gender: 'Female', location: 'Pune' },
    education: { eduLevel: '10th Standard', stream: 'General', marks: '78%' },
    careerInterest: { field: 'Medical & Healthcare' },
    createdAt: new Date(),
    lastActive: new Date()
  };

  const mockGuest = {
    _id: 'guest_mock_003',
    email: 'guest_anonymous_session@careersetu.local',
    isGuest: true,
    createdAt: new Date()
  };

  inMemoryStudents.set(mockStudentA._id, mockStudentA);
  inMemoryStudents.set(mockStudentB._id, mockStudentB);
  inMemoryStudents.set(mockGuest._id, mockGuest);

  // Generate tokens
  const adminToken = jwt.sign(
    { id: mockAdmin._id, email: mockAdmin.email, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentToken = jwt.sign(
    { id: mockStudentA._id, email: mockStudentA.email, role: 'student' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Start test server on random free port
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
  const port = testServer.address().port;
  console.log(`  ℹ️ Test server running on http://127.0.0.1:${port}\n`);

  try {
    /* ── 1. Admin Login Validation ─────────────────────────────────── */
    console.log('1. Admin Login Validation:');

    // Missing credentials
    const emptyLogin = await request(port, 'POST', '/api/admin/login', {});
    assert(emptyLogin.status === 400, 'Admin login rejects missing credentials with HTTP 400');

    // Wrong password
    const wrongPass = await request(port, 'POST', '/api/admin/login', {
      email: mockAdmin.email,
      password: 'WrongPassword999!'
    });
    assert(wrongPass.status === 401, 'Admin login rejects invalid password with HTTP 401');

    // Non-existent admin email
    const nonExistent = await request(port, 'POST', '/api/admin/login', {
      email: 'nonexistent.admin@careersetu.org',
      password: 'AdminSecurePass123!'
    });
    assert(nonExistent.status === 401, 'Admin login rejects unknown email with HTTP 401');

    /* ── 2. Successful Admin Login ──────────────────────────────────── */
    console.log('\n2. Successful Admin Login:');

    const successfulLogin = await request(port, 'POST', '/api/admin/login', {
      email: mockAdmin.email,
      password: 'AdminSecurePass123!'
    });
    assert(successfulLogin.status === 200, 'Admin login succeeds with valid credentials (HTTP 200)');
    assert(successfulLogin.data.status === 'success', 'Login response status is "success"');
    assert(!!successfulLogin.data.token, 'Login returns JWT bearer token');
    assert(successfulLogin.data.admin && successfulLogin.data.admin.email === mockAdmin.email, 'Returns correct admin email');
    assert(successfulLogin.data.admin.role === 'admin', 'Identifies account role as "admin"');
    assert(!successfulLogin.data.admin.passwordHash, 'Admin response omits passwordHash');

    /* ── 3. Authorization & Access Control (Student vs Admin) ──────── */
    console.log('\n3. Role-Based Access Control & Route Protection:');

    // No token
    const noToken = await request(port, 'GET', '/api/admin/me');
    assert(noToken.status === 401, 'Rejects unauthenticated request without token (HTTP 401)');

    // Invalid token
    const badToken = await request(port, 'GET', '/api/admin/me', null, {
      Authorization: 'Bearer invalid.tampered.token'
    });
    assert(badToken.status === 401, 'Rejects invalid token with HTTP 401');

    // Student token on Admin route (Strict 403 Forbidden enforcement)
    const studentAccessMe = await request(port, 'GET', '/api/admin/me', null, {
      Authorization: `Bearer ${studentToken}`
    });
    assert(studentAccessMe.status === 403, 'Rejects standard student account accessing /api/admin/me with HTTP 403 Forbidden');

    const studentAccessStats = await request(port, 'GET', '/api/admin/stats', null, {
      Authorization: `Bearer ${studentToken}`
    });
    assert(studentAccessStats.status === 403, 'Rejects student accessing platform stats with HTTP 403 Forbidden');

    const studentAccessList = await request(port, 'GET', '/api/admin/students', null, {
      Authorization: `Bearer ${studentToken}`
    });
    assert(studentAccessList.status === 403, 'Rejects student accessing student directory with HTTP 403 Forbidden');

    const studentAccessExport = await request(port, 'GET', '/api/admin/export/csv', null, {
      Authorization: `Bearer ${studentToken}`
    });
    assert(studentAccessExport.status === 403, 'Rejects student accessing CSV export with HTTP 403 Forbidden');

    // Admin token succeeds
    const adminMe = await request(port, 'GET', '/api/admin/me', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(adminMe.status === 200, 'Authorized admin accesses /api/admin/me with HTTP 200');
    assert(adminMe.data.admin.role === 'admin', 'Confirmed admin role in session');

    /* ── 4. Platform Statistics Endpoint ───────────────────────────── */
    console.log('\n4. Admin Dashboard Metrics (/api/admin/stats):');

    const statsRes = await request(port, 'GET', '/api/admin/stats', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(statsRes.status === 200, 'Admin can fetch platform stats (HTTP 200)');
    assert(statsRes.data.status === 'success', 'Stats response status is "success"');
    assert(typeof statsRes.data.stats.totalRegisteredStudents === 'number', 'Reports totalRegisteredStudents count');
    assert(typeof statsRes.data.stats.fullyCompletedProfiles === 'number', 'Reports fullyCompletedProfiles count');
    assert(typeof statsRes.data.stats.aiGuidanceGenerated === 'number', 'Reports aiGuidanceGenerated count');
    assert(typeof statsRes.data.stats.totalGuestSessions === 'number', 'Reports totalGuestSessions count');

    /* ── 5. Student Record Listing & Filtering ─────────────────────── */
    console.log('\n5. Student Directory Listing & Filtering (/api/admin/students):');

    const listRes = await request(port, 'GET', '/api/admin/students', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(listRes.status === 200, 'Admin can list student records (HTTP 200)');
    assert(Array.isArray(listRes.data.students), 'Returns students array');
    assert(listRes.data.total >= 2, 'Lists registered students');

    // Search filter
    const searchRes = await request(port, 'GET', '/api/admin/students?search=Rohit', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(searchRes.status === 200, 'Search by name returns HTTP 200');
    assert(searchRes.data.students.some((s) => s.personalInfo?.fullName === 'Rohit Sharma'), 'Finds student by search query');

    // Education level filter
    const eduFilterRes = await request(port, 'GET', '/api/admin/students?eduLevel=12th', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(eduFilterRes.status === 200, 'Filter by education level returns HTTP 200');
    assert(eduFilterRes.data.students.every((s) => s.education?.eduLevel.includes('12th')), 'All results match education filter');

    /* ── 6. Student Detail Modal Endpoint ──────────────────────────── */
    console.log('\n6. Student Details by ID (/api/admin/students/:id):');

    const detailRes = await request(port, 'GET', `/api/admin/students/${mockStudentA._id}`, null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(detailRes.status === 200, 'Fetches student profile by ID (HTTP 200)');
    assert(detailRes.data.student.email === mockStudentA.email, 'Returns correct student email');
    assert(detailRes.data.student.personalInfo.fullName === mockStudentA.personalInfo.fullName, 'Returns correct student full name');

    // Unknown ID
    const notFoundRes = await request(port, 'GET', '/api/admin/students/unknown_id_9999', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(notFoundRes.status === 404, 'Non-existent student ID returns HTTP 404');

    /* ── 7. Sensitive Information Leakage Prevention ───────────────── */
    console.log('\n7. Privacy & Sensitive Field Protection:');

    // In student list
    const firstStudentInList = listRes.data.students[0];
    assert(!firstStudentInList.passwordHash, 'Student listing NEVER leaks passwordHash');
    assert(!firstStudentInList.password, 'Student listing NEVER leaks plain password');
    assert(!firstStudentInList.resetPasswordToken, 'Student listing NEVER leaks resetPasswordToken');
    assert(!firstStudentInList.resetPasswordExpires, 'Student listing NEVER leaks resetPasswordExpires');

    // In student detail
    assert(!detailRes.data.student.passwordHash, 'Student details NEVER leak passwordHash');
    assert(!detailRes.data.student.resetPasswordToken, 'Student details NEVER leak resetPasswordToken');
    assert(!detailRes.data.student.resetPasswordExpires, 'Student details NEVER leak resetPasswordExpires');

    /* ── 8. CSV Data Export ────────────────────────────────────────── */
    console.log('\n8. Student Data CSV Export (/api/admin/export/csv):');

    const csvRes = await request(port, 'GET', '/api/admin/export/csv', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(csvRes.status === 200, 'CSV export returns HTTP 200');
    assert(csvRes.headers['content-type'] && csvRes.headers['content-type'].includes('text/csv'), 'Sets Content-Type: text/csv');
    assert(typeof csvRes.data === 'string', 'Returns string data');
    assert(csvRes.data.includes('Student ID,Full Name,Email Address'), 'Contains standard CSV header columns');
    assert(csvRes.data.includes('rohit.sharma@example.org'), 'Contains student record data');
    assert(!csvRes.data.includes('mock_hashed_token_xyz'), 'CSV export NEVER includes resetPasswordToken');

    console.log('\n====================================================');
    console.log(`Result: ${passedTests} of ${totalTests} checks passed.`);
    console.log('====================================================');

    if (passedTests === totalTests) {
      console.log('🎉 Phase 5 Admin Panel & Security verified successfully!\n');
    }
  } finally {
    restoreDatabase();
    await new Promise((resolve) => testServer.close(resolve));
    console.log('  ℹ️ Test server closed cleanly.\n');
  }
}

run().catch((err) => {
  console.error('Fatal error in admin test runner:', err);
  restoreDatabase();
  process.exit(1);
});
