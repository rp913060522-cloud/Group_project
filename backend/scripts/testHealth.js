/**
 * CareerSetu — Phase 1 Verification Test Suite
 *
 * Runs automated checks verifying:
 *   1. Environment configuration (.env.example & gitignore)
 *   2. Student Mongoose Model Schema & Methods
 *   3. Express Server & /api/health Endpoint
 *   4. 404 JSON Handler for API routes
 */

'use strict';

const http   = require('http');
const path   = require('path');
const fs     = require('fs');

const { app }     = require('../server');
const Student     = require('../models/Student');

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

async function run() {
  console.log('====================================================');
  console.log('   CareerSetu — Phase 1 Automated Verification');
  console.log('====================================================\n');

  /* ── 1. Configuration & Secrets Checks ────────────────────────────── */
  console.log('1. Configuration & Security:');
  const envExamplePath = path.join(__dirname, '..', '..', '.env.example');
  const gitignorePath  = path.join(__dirname, '..', '..', '.gitignore');

  assert(fs.existsSync(envExamplePath), '.env.example exists');
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  assert(envExampleContent.includes('MONGODB_URI'), '.env.example defines MONGODB_URI placeholder');
  assert(envExampleContent.includes('GEMINI_API_KEY'), '.env.example defines GEMINI_API_KEY placeholder');
  assert(envExampleContent.includes('PORT'), '.env.example defines PORT');

  assert(fs.existsSync(gitignorePath), '.gitignore exists');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  assert(gitignoreContent.includes('.env'), '.gitignore properly excludes .env from git');

  /* ── 2. Mongoose Student Model Schema Checks ──────────────────────── */
  console.log('\n2. Student Model Schema & Validation:');

  // Test missing email validation
  const invalidStudent = new Student({});
  const validationErr = invalidStudent.validateSync();
  assert(validationErr && validationErr.errors['email'], 'Student schema rejects missing email');

  // Test invalid email format
  const badEmailStudent = new Student({ email: 'not-an-email' });
  const badEmailErr = badEmailStudent.validateSync();
  assert(badEmailErr && badEmailErr.errors['email'], 'Student schema rejects invalid email format');

  // Test valid student document with methods
  const validStudent = new Student({
    email: 'student@example.com',
    passwordHash: 'secret-hash-12345',
    personalInfo: {
      fullName: 'Rahul Sharma',
      age: 18,
      gender: 'Male',
      phone: '9876543210',
      location: 'Pune, Maharashtra'
    },
    education: {
      eduLevel: '12th Pass',
      stream: 'Science (PCM)',
      subjects: 'Physics, Chemistry, Maths',
      marks: '82%'
    },
    careerInterest: {
      field: 'Data Science',
      favSubjects: 'Mathematics',
      preference: 'Higher Studies',
      skills: 'Python, SQL'
    }
  });

  const validErr = validStudent.validateSync();
  assert(!validErr, 'Valid student document passes schema validation');

  assert(typeof validStudent.toPublicJSON === 'function', 'Student model has toPublicJSON() method');
  const publicJSON = validStudent.toPublicJSON();
  assert(!publicJSON.passwordHash, 'toPublicJSON() strips passwordHash from output');
  assert(publicJSON.email === 'student@example.com', 'toPublicJSON() preserves student email');

  assert(typeof validStudent.isReadyForAI === 'function', 'Student model has isReadyForAI() method');
  assert(validStudent.isReadyForAI() === true, 'isReadyForAI() returns true when profile, education, and interest are populated');

  const incompleteStudent = new Student({ email: 'incomplete@example.com' });
  assert(incompleteStudent.isReadyForAI() === false, 'isReadyForAI() returns false when sections are missing');

  /* ── 3. Express App & /api/health Endpoint Check ─────────────────── */
  console.log('\n3. Express Server & Health API:');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`  ℹ️ Ephemeral test server listening on http://127.0.0.1:${port}`);

  function makeRequest(path) {
    return new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}${path}`, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(rawData) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: rawData });
          }
        });
      }).on('error', reject);
    });
  }

  // Check /api/health
  const healthRes = await makeRequest('/api/health');
  assert(healthRes.statusCode === 200, 'GET /api/health responds with status code 200');
  assert(healthRes.data && healthRes.data.status === 'ok', 'Health response has status: "ok"');
  assert(healthRes.data && healthRes.data.service === 'CareerSetu API', 'Health response identifies service as "CareerSetu API"');
  assert(healthRes.data && healthRes.data.version === '1.0.0', 'Health response reports version "1.0.0"');
  assert(healthRes.data && healthRes.data.phase === 'Phase 1 — Backend Foundation', 'Health response confirms Phase 1 backend');
  assert(healthRes.data && typeof healthRes.data.database === 'object', 'Health response includes database status object');

  // Check 404 handler for unknown /api route
  const notFoundRes = await makeRequest('/api/nonexistent-route');
  assert(notFoundRes.statusCode === 404, 'GET /api/nonexistent-route returns 404');
  assert(notFoundRes.data && notFoundRes.data.status === 'error', '404 response returns JSON with status: "error"');

  await new Promise((resolve) => server.close(resolve));
  console.log('  ℹ️ Ephemeral test server closed cleanly');

  /* ── Summary ──────────────────────────────────────────────────────── */
  console.log('\n====================================================');
  console.log(`Result: ${passedTests} of ${totalTests} checks passed.`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    console.log('🎉 Phase 1 backend implementation verified successfully!\n');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed. Please inspect logs above.\n');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
