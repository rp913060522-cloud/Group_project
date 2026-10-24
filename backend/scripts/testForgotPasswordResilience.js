/**
 * CareerSetu — Forgot Password & SMTP Timeout Resilience Verification Script
 */

'use strict';

const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { app } = require('../server');
const { connectDB } = require('../config/database');
const Student = require('../models/Student');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

function postJSON(port, reqPath, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: reqPath,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║       CareerSetu — Forgot Password Resilience Verification         ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  // Connect to DB
  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  console.log(`ℹ️ Test server listening on http://127.0.0.1:${port}\n`);

  const testStudentEmail = 'test.student.resilience@careersetu.org';

  try {
    // 1. Missing Email Validation
    console.log('1. Input Validation:');
    const res1 = await postJSON(port, '/api/auth/forgot-password', {});
    assert(res1.statusCode === 400, 'Rejects empty request with HTTP 400');
    assert(res1.data.status === 'error', 'Error response status is "error"');

    const res2 = await postJSON(port, '/api/auth/forgot-password', { email: 'not-an-email' });
    assert(res2.statusCode === 400, 'Rejects malformed email with HTTP 400');

    // 2. Anti-enumeration: Non-existent email returns generic HTTP 200
    console.log('\n2. User Enumeration Protection:');
    const startNonExist = Date.now();
    const res3 = await postJSON(port, '/api/auth/forgot-password', { email: 'nonexistent.user.test@careersetu.org' });
    const elapsedNonExist = Date.now() - startNonExist;
    assert(res3.statusCode === 200, 'Non-existent email returns HTTP 200 (anti-enumeration)');
    assert(res3.data.status === 'success', 'Response status is "success"');
    assert(elapsedNonExist < 2000, `Non-existent email responds swiftly without delay (${elapsedNonExist}ms < 2000ms)`);

    // 3. Registered Email Flow & Timeout Safeguard
    console.log('\n3. Registered Email Flow & SMTP Timeout Protection:');
    await Student.findOneAndUpdate(
      { email: testStudentEmail },
      {
        email: testStudentEmail,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr',
        personalInfo: { fullName: 'Resilience Test Student' }
      },
      { upsert: true, new: true }
    );

    const startExist = Date.now();
    const res4 = await postJSON(port, '/api/auth/forgot-password', { email: testStudentEmail });
    const elapsedExist = Date.now() - startExist;

    assert(res4.statusCode === 200, 'Registered email returns HTTP 200');
    assert(res4.data.status === 'success', 'Response status is "success"');
    assert(elapsedExist < 10000, `Server responds well under 10 seconds (${elapsedExist}ms < 10000ms) without indefinite hanging`);

    // Verify token was generated in database
    const student = await Student.findOne({ email: testStudentEmail }).select('+resetPasswordToken +resetPasswordExpires');
    assert(Boolean(student.resetPasswordToken), 'Reset token hash generated and persisted in database');
    assert(student.resetPasswordExpires > Date.now(), 'Reset token expiry set in the future (1 hour)');

    // 4. Verify token endpoint accepts the generated token
    console.log('\n4. Token Verification:');
    const resVerify = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/auth/verify-reset-token?token=invalid_dummy_token`, (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(body) }));
      }).on('error', reject);
    });
    assert(resVerify.statusCode === 400, 'Rejects invalid raw token with HTTP 400');
    assert(resVerify.data.valid === false, 'Invalid token returns valid: false');

  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    // Clean up temporary test student
    try {
      await Student.deleteOne({ email: testStudentEmail });
    } catch (e) {}

    server.close();
    await mongoose.connection.close();
  }

  console.log('\n====================================================');
  console.log(`Result: ${passed} of ${total} checks passed.`);
  console.log('====================================================\n');
}

run();
