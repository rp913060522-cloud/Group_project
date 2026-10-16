/**
 * CareerSetu — Phase 3 Student Data API Test Suite
 *
 * Automated tests for:
 *   1. Unauthorized requests rejected (HTTP 401)
 *   2. Personal Information validation (name, age, phone, location)
 *   3. Saving and retrieving Student Information
 *   4. Educational Background validation and saving
 *   5. Career Interests & Skills validation and saving
 *   6. Updating an existing profile without creating duplicate records
 *   7. Cross-student data isolation (Student A cannot read or modify Student B's record)
 *   8. Privacy & secret protection (passwordHash never leaks in profile responses)
 */

'use strict';

const http = require('http');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Ensure environment variables are loaded
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

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

// In-memory isolated test store so we do not mutate or delete real MongoDB Atlas records
const inMemoryStore = new Map();

function wrapStudent(doc) {
  return {
    ...doc,
    toObject() {
      const copy = { ...this };
      delete copy.toObject;
      delete copy.toPublicJSON;
      delete copy.comparePassword;
      delete copy.save;
      return JSON.parse(JSON.stringify(copy));
    },
    toPublicJSON() {
      const obj = this.toObject();
      delete obj.passwordHash;
      return obj;
    },
    async comparePassword(candidate) {
      if (!this.passwordHash || !candidate) return false;
      return bcrypt.compare(candidate, this.passwordHash);
    },
    async save() {
      const plain = this.toObject();
      inMemoryStore.set(String(this._id), plain);
      return this;
    }
  };
}

const originalFindById = Student.findById;
const originalFindOne = Student.findOne;
const originalSave = Student.prototype.save;

function setupMockDatabase() {
  Student.findById = function (id) {
    const doc = inMemoryStore.get(String(id));
    return Promise.resolve(doc ? wrapStudent(doc) : null);
  };

  Student.findOne = function (query) {
    if (query && query.email) {
      const email = String(query.email).toLowerCase();
      for (const doc of inMemoryStore.values()) {
        if (doc.email.toLowerCase() === email) {
          return {
            select() { return Promise.resolve(wrapStudent(doc)); },
            then(resolve, reject) { return Promise.resolve(wrapStudent(doc)).then(resolve, reject); }
          };
        }
      }
    }
    return {
      select() { return Promise.resolve(null); },
      then(resolve, reject) { return Promise.resolve(null).then(resolve, reject); }
    };
  };

  Student.prototype.save = async function () {
    const id = this._id ? String(this._id) : 'mock_stu_' + Math.random().toString(36).substring(2, 9);
    const doc = {
      _id: id,
      email: this.email,
      passwordHash: this.passwordHash,
      personalInfo: this.personalInfo ? JSON.parse(JSON.stringify(this.personalInfo)) : {},
      education: this.education ? JSON.parse(JSON.stringify(this.education)) : {},
      careerInterest: this.careerInterest ? JSON.parse(JSON.stringify(this.careerInterest)) : {},
      profileComplete: Boolean(this.profileComplete),
      educationComplete: Boolean(this.educationComplete),
      interestComplete: Boolean(this.interestComplete),
      isGuest: Boolean(this.isGuest),
      lastActive: new Date(),
      createdAt: this.createdAt || new Date(),
      updatedAt: new Date()
    };
    inMemoryStore.set(id, doc);
    this._id = id;
    return this;
  };
}

function restoreDatabase() {
  Student.findById = originalFindById;
  Student.findOne = originalFindOne;
  Student.prototype.save = originalSave;
}

function request(serverPort, method, endpoint, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {};
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
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

function createMockToken(studentId, email) {
  return jwt.sign(
    { id: studentId, email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function run() {
  console.log('====================================================');
  console.log('   CareerSetu — Phase 3 Student Data API Tests');
  console.log('====================================================\n');

  setupMockDatabase();

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
  const port = testServer.address().port;
  console.log(`  ℹ️ Test server listening on http://127.0.0.1:${port}\n`);

  try {
    // Seed Student A
    const studentAId = 'stu_001_aarav';
    const studentAEmail = 'aarav@test.org';
    inMemoryStore.set(studentAId, {
      _id: studentAId,
      email: studentAEmail,
      passwordHash: '$2b$10$fakeHashedPasswordForStudentA',
      personalInfo: { fullName: 'Aarav Patel' },
      education: {},
      careerInterest: {},
      profileComplete: false,
      educationComplete: false,
      interestComplete: false
    });
    const tokenA = createMockToken(studentAId, studentAEmail);

    // Seed Student B
    const studentBId = 'stu_002_diya';
    const studentBEmail = 'diya@test.org';
    inMemoryStore.set(studentBId, {
      _id: studentBId,
      email: studentBEmail,
      passwordHash: '$2b$10$fakeHashedPasswordForStudentB',
      personalInfo: { fullName: 'Diya Joshi' },
      education: {},
      careerInterest: {},
      profileComplete: false,
      educationComplete: false,
      interestComplete: false
    });
    const tokenB = createMockToken(studentBId, studentBEmail);

    /* ── 1. Unauthorized Requests Rejected ──────────────────────────── */
    console.log('1. Authorization Enforcement (Reject Unauthorized):');
    const noTokenGet = await request(port, 'GET', '/api/student/profile');
    assert(noTokenGet.status === 401, 'GET /api/student/profile without token returns HTTP 401');

    const noTokenPutInfo = await request(port, 'PUT', '/api/student/personal-info', { fullName: 'Hacker' });
    assert(noTokenPutInfo.status === 401, 'PUT /api/student/personal-info without token returns HTTP 401');

    const noTokenPutEdu = await request(port, 'PUT', '/api/student/education', { eduLevel: '10th' });
    assert(noTokenPutEdu.status === 401, 'PUT /api/student/education without token returns HTTP 401');

    const noTokenPutInterest = await request(port, 'PUT', '/api/student/career-interest', { field: 'Tech' });
    assert(noTokenPutInterest.status === 401, 'PUT /api/student/career-interest without token returns HTTP 401');

    const badTokenGet = await request(port, 'GET', '/api/student/profile', null, 'malformed.jwt.token');
    assert(badTokenGet.status === 401, 'GET /api/student/profile with invalid token returns HTTP 401');

    /* ── 2. Personal Information Validation ─────────────────────────── */
    console.log('\n2. Personal Information Validation:');
    const missingName = await request(port, 'PUT', '/api/student/personal-info', {
      age: 18,
      phone: '9876543210',
      location: 'Pune'
    }, tokenA);
    assert(missingName.status === 400, 'Rejects personal info with missing name (HTTP 400)');

    const invalidAge = await request(port, 'PUT', '/api/student/personal-info', {
      fullName: 'Aarav Patel',
      age: 5,
      phone: '9876543210',
      location: 'Pune'
    }, tokenA);
    assert(invalidAge.status === 400, 'Rejects personal info with invalid age (<10) (HTTP 400)');

    const invalidGender = await request(port, 'PUT', '/api/student/personal-info', {
      fullName: 'Aarav Patel',
      age: 18,
      gender: 'Martian',
      phone: '9876543210',
      location: 'Pune'
    }, tokenA);
    assert(invalidGender.status === 400, 'Rejects personal info with unrecognized gender (HTTP 400)');

    const shortPhone = await request(port, 'PUT', '/api/student/personal-info', {
      fullName: 'Aarav Patel',
      age: 18,
      phone: '123',
      location: 'Pune'
    }, tokenA);
    assert(shortPhone.status === 400, 'Rejects personal info with too short phone number (HTTP 400)');

    /* ── 3. Saving & Retrieving Personal Information ────────────────── */
    console.log('\n3. Saving & Retrieving Personal Information:');
    const validInfoPayload = {
      fullName: 'Aarav K. Patel',
      age: 18,
      gender: 'Male',
      phone: '9876543210',
      location: 'Mumbai, Maharashtra'
    };

    const saveInfoRes = await request(port, 'PUT', '/api/student/personal-info', validInfoPayload, tokenA);
    assert(saveInfoRes.status === 200, 'PUT /api/student/personal-info responds with HTTP 200');
    assert(saveInfoRes.data.status === 'success', 'Save response has status: "success"');
    assert(saveInfoRes.data.student.personalInfo.fullName === validInfoPayload.fullName, 'Returns updated full name');
    assert(saveInfoRes.data.student.personalInfo.age === validInfoPayload.age, 'Returns updated age');
    assert(saveInfoRes.data.student.profileComplete === true, 'Sets profileComplete flag to true');

    const getProfileRes = await request(port, 'GET', '/api/student/profile', null, tokenA);
    assert(getProfileRes.status === 200, 'GET /api/student/profile responds with HTTP 200');
    assert(getProfileRes.data.student.personalInfo.phone === validInfoPayload.phone, 'GET returns persisted phone');
    assert(getProfileRes.data.student.personalInfo.location === validInfoPayload.location, 'GET returns persisted location');

    /* ── 4. Educational Background Validation & Saving ──────────────── */
    console.log('\n4. Educational Background Validation & Saving:');
    const missingEduLevel = await request(port, 'PUT', '/api/student/education', {
      stream: 'Science',
      marks: '85%'
    }, tokenA);
    assert(missingEduLevel.status === 400, 'Rejects education with missing eduLevel (HTTP 400)');

    const missingStream = await request(port, 'PUT', '/api/student/education', {
      eduLevel: '12th Pass',
      marks: '85%'
    }, tokenA);
    assert(missingStream.status === 400, 'Rejects education with missing stream (HTTP 400)');

    const missingMarks = await request(port, 'PUT', '/api/student/education', {
      eduLevel: '12th Pass',
      stream: 'Science (PCM)'
    }, tokenA);
    assert(missingMarks.status === 400, 'Rejects education with missing marks (HTTP 400)');

    const validEduPayload = {
      eduLevel: '12th Pass',
      eduLevelSelect: '12th Pass',
      stream: 'Science (PCM)',
      streamSelect: 'Science (PCM)',
      subjects: 'Physics, Chemistry, Mathematics',
      marks: '88.5%'
    };

    const saveEduRes = await request(port, 'PUT', '/api/student/education', validEduPayload, tokenA);
    assert(saveEduRes.status === 200, 'PUT /api/student/education responds with HTTP 200');
    assert(saveEduRes.data.status === 'success', 'Education save status is "success"');
    assert(saveEduRes.data.student.education.stream === validEduPayload.stream, 'Returns updated stream');
    assert(saveEduRes.data.student.education.marks === validEduPayload.marks, 'Returns updated marks');
    assert(saveEduRes.data.student.educationComplete === true, 'Sets educationComplete flag to true');

    // Test saving with numeric marks
    const numericMarksRes = await request(port, 'PUT', '/api/student/education', {
      eduLevel: '12th Pass',
      stream: 'Science (PCM)',
      marks: 92
    }, tokenA);
    assert(numericMarksRes.status === 200, 'Accepts numeric marks and responds with HTTP 200');
    assert(numericMarksRes.data.student.education.marks === '92', 'Normalizes numeric marks to string');

    // Test saving with custom level and stream ('Other')
    const customEduRes = await request(port, 'PUT', '/api/student/education', {
      eduLevelSelect: 'Other',
      eduLevelCustom: 'Polytechnic Diploma',
      streamSelect: 'Other',
      streamCustom: 'Civil Engineering',
      marks: '84%'
    }, tokenA);
    assert(customEduRes.status === 200, 'Accepts custom education level and stream (HTTP 200)');
    assert(customEduRes.data.student.education.eduLevel === 'Polytechnic Diploma', 'Stores effective custom education level');
    assert(customEduRes.data.student.education.stream === 'Civil Engineering', 'Stores effective custom stream');

    // Verify GET /api/student/profile returns persisted education
    const getEduProfile = await request(port, 'GET', '/api/student/profile', null, tokenA);
    assert(getEduProfile.status === 200, 'GET /api/student/profile returns HTTP 200');
    assert(getEduProfile.data.student.education.eduLevel === 'Polytechnic Diploma', 'GET returns persisted eduLevel');
    assert(getEduProfile.data.student.education.stream === 'Civil Engineering', 'GET returns persisted stream');

    /* ── 5. Career Interests Validation & Saving ────────────────────── */
    console.log('\n5. Career Interests & Skills Validation & Saving:');
    const missingField = await request(port, 'PUT', '/api/student/career-interest', {
      favSubjects: 'Maths',
      preference: 'Higher Studies',
      skills: 'Python'
    }, tokenA);
    assert(missingField.status === 400, 'Rejects career interest with missing field (HTTP 400)');

    const validInterestPayload = {
      field: 'Data Science & Analytics',
      favSubjects: 'Mathematics, Computer Science',
      preference: 'Higher Studies & Degree with Scholarships',
      skills: 'Python, SQL, Machine Learning'
    };

    const saveInterestRes = await request(port, 'PUT', '/api/student/career-interest', validInterestPayload, tokenA);
    assert(saveInterestRes.status === 200, 'PUT /api/student/career-interest responds with HTTP 200');
    assert(saveInterestRes.data.status === 'success', 'Career interest save status is "success"');
    assert(saveInterestRes.data.student.careerInterest.field === validInterestPayload.field, 'Returns updated career field');
    assert(saveInterestRes.data.student.careerInterest.skills === validInterestPayload.skills, 'Returns updated skills');
    assert(saveInterestRes.data.student.interestComplete === true, 'Sets interestComplete flag to true');

    // Test rejection of literal 'Other' without custom text
    const rejectEmptyOther = await request(port, 'PUT', '/api/student/career-interest', {
      fieldSelect: 'Other',
      fieldCustom: '',
      favSubjects: 'Physics',
      preference: 'Higher Studies',
      skills: 'C++'
    }, tokenA);
    assert(rejectEmptyOther.status === 400, 'Rejects literal Other field when custom text is empty (HTTP 400)');

    // Test saving with custom field and custom preference ('Other')
    const customInterestPayload = {
      fieldSelect: 'Other',
      fieldCustom: 'Robotics & Automation',
      favSubjects: 'Physics, Mathematics',
      preferenceSelect: 'Other',
      preferenceCustom: 'Startup Incubation & Freelance',
      skills: 'ROS, Python, Arduino'
    };

    const customInterestRes = await request(port, 'PUT', '/api/student/career-interest', customInterestPayload, tokenA);
    assert(customInterestRes.status === 200, 'Accepts custom career field and preference (HTTP 200)');
    assert(customInterestRes.data.student.careerInterest.field === 'Robotics & Automation', 'Stores effective custom career field');
    assert(customInterestRes.data.student.careerInterest.preference === 'Startup Incubation & Freelance', 'Stores effective custom career preference');

    // Verify GET /api/student/profile returns persisted custom career interest
    const getInterestProfile = await request(port, 'GET', '/api/student/profile', null, tokenA);
    assert(getInterestProfile.status === 200, 'GET /api/student/profile returns HTTP 200');
    assert(getInterestProfile.data.student.careerInterest.field === 'Robotics & Automation', 'GET returns persisted custom field');
    assert(getInterestProfile.data.student.careerInterest.preference === 'Startup Incubation & Freelance', 'GET returns persisted custom preference');

    /* ── 6. Updating Without Duplication ────────────────────────────── */
    console.log('\n6. Updating Profile Without Creating Duplicate Records:');
    const initialRecordCount = inMemoryStore.size;

    const updateAgainRes = await request(port, 'PUT', '/api/student/personal-info', {
      ...validInfoPayload,
      location: 'Nagpur, Maharashtra'
    }, tokenA);
    assert(updateAgainRes.status === 200, 'Secondary update responds with HTTP 200');
    assert(inMemoryStore.size === initialRecordCount, 'Database record count unchanged (no duplicate documents created)');
    assert(updateAgainRes.data.student._id === studentAId, 'Student _id is preserved across updates');

    /* ── 7. Cross-Student Data Isolation ────────────────────────────── */
    console.log('\n7. Cross-Student Authorization & Data Isolation:');

    // Student B requests their own profile
    const getStudentBRes = await request(port, 'GET', '/api/student/profile', null, tokenB);
    assert(getStudentBRes.status === 200, 'Student B can fetch their own profile');
    assert(getStudentBRes.data.student._id === studentBId, 'Student B receives Student B identity');
    assert(getStudentBRes.data.student.personalInfo.fullName === 'Diya Joshi', 'Student B receives Diya Joshi (not Student A data)');

    // Student A attempts to tamper/spoof by passing Student B's email or ID in body
    const spoofAttemptRes = await request(port, 'PUT', '/api/student/personal-info', {
      _id: studentBId,
      email: studentBEmail,
      fullName: 'Spoofed Name',
      age: 22,
      phone: '9999999999',
      location: 'Hacked City'
    }, tokenA); // authenticated as Student A!

    assert(spoofAttemptRes.status === 200, 'Request processed based on token identity');
    assert(spoofAttemptRes.data.student._id === studentAId, 'Backend updated Student A, ignoring spoofed ID in body');

    // Verify Student B was completely untouched
    const verifyStudentB = inMemoryStore.get(studentBId);
    assert(verifyStudentB.personalInfo.fullName === 'Diya Joshi', 'Student B record was NOT modified by Student A');

    /* ── 8. Privacy & Secret Protection ─────────────────────────────── */
    console.log('\n8. Privacy & Secret Protection:');
    const responsesToCheck = [
      saveInfoRes.data.student,
      getProfileRes.data.student,
      saveEduRes.data.student,
      saveInterestRes.data.student
    ];

    for (const stu of responsesToCheck) {
      assert(!stu.passwordHash, 'Response never contains passwordHash');
      assert(!stu.password, 'Response never contains plain-text password');
      assert(!stu.token, 'Response never embeds token in student object');
    }

    console.log('\n====================================================');
    console.log(`Result: ${passedTests} of ${totalTests} checks passed.`);
    console.log('====================================================');

    if (passedTests === totalTests) {
      console.log('🎉 Phase 3 Student Data API verified successfully!\n');
    }
  } finally {
    restoreDatabase();
    await new Promise((resolve) => testServer.close(resolve));
    console.log('  ℹ️ Test server closed cleanly.\n');
  }
}

run().catch((err) => {
  console.error('Fatal error in student data test runner:', err);
  restoreDatabase();
  process.exit(1);
});
