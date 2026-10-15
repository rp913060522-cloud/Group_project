/**
 * CareerSetu — Phase 4 AI Career Guidance Test Suite (Groq API)
 *
 * Automated tests for:
 *   1. Route resolution & mounting (HTTP 200/401/404)
 *   2. Unauthenticated requests rejected (HTTP 401)
 *   3. Incomplete profile validation (HTTP 400, status: 'incomplete_profile')
 *   4. Successful mocked Groq AI career guidance generation (HTTP 200)
 *   5. Retrieval of saved AI guidance (GET /api/ai/saved)
 *   6. Provider error, timeout, rate limiting, and config handling (HTTP 429 / 500 / 502 / 504)
 *   7. Cross-student AI result isolation (Student A results not shared with Student B)
 *   8. Zero secret or key leakage in responses (no GROQ_API_KEY / password)
 *   9. Groq model candidate resolution & resiliency
 *  10. parseGroqJSON resilience & error handling
 */

'use strict';

const http = require('http');
const path = require('path');
const jwt  = require('jsonwebtoken');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_careersetu_2026';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const Student   = require('../models/Student');
const aiService = require('../services/aiService');
const { app }   = require('../server');

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

// In-memory test store
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
    async save() {
      const plain = this.toObject();
      inMemoryStore.set(String(this._id), plain);
      return this;
    }
  };
}

const originalFindById = Student.findById;
const originalGenerateGuidance = aiService.generateCareerGuidance;

function setupMockDatabase() {
  Student.findById = function (id) {
    const doc = inMemoryStore.get(String(id));
    return Promise.resolve(doc ? wrapStudent(doc) : null);
  };
}

function restoreAll() {
  Student.findById = originalFindById;
  aiService.generateCareerGuidance = originalGenerateGuidance;
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

// Sample mocked AI response matching the expected schema
const mockAiResponse = {
  profileSummary: 'Student has completed 12th in Science with strong affinity for analytical problem-solving and programming.',
  recommendedCareers: [
    {
      title: 'Junior Data Analyst',
      tagline: 'High Demand • Great Starting Role',
      whySuitable: 'Strong fit for mathematics background and interest in Python.',
      eligibility: ['12th Pass with Mathematics', 'Foundational knowledge of Python and SQL'],
      requiredSkills: ['Python', 'SQL', 'Excel', 'Data Visualization'],
      learningRoadmap: ['Learn Python basics', 'Study SQL database queries', 'Build a portfolio project']
    },
    {
      title: 'Web Application Developer',
      tagline: 'Versatile Growth • High Placement',
      whySuitable: 'Good practical match for self-paced project building.',
      eligibility: ['High School or 12th Pass', 'HTML/CSS and JavaScript basics'],
      requiredSkills: ['JavaScript', 'HTML5', 'CSS3', 'Git'],
      learningRoadmap: ['Build responsive web pages', 'Learn JavaScript fundamentals', 'Publish projects online']
    }
  ],
  learningRoadmapGeneral: [
    'Step 1: Dedicate 1 hour daily to practice coding',
    'Step 2: Create a free GitHub account to store projects',
    'Step 3: Connect with college mentors and explore scholarship schemes'
  ],
  recommendedResources: aiService.VERIFIED_RESOURCES,
  disclaimer: aiService.STANDARD_DISCLAIMER
};

async function run() {
  console.log('====================================================');
  console.log('   CareerSetu — Phase 4 AI Guidance Tests (Groq API)');
  console.log('====================================================\n');

  setupMockDatabase();

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
  const port = testServer.address().port;
  console.log(`  ℹ️ Test server listening on http://127.0.0.1:${port}\n`);

  try {
    // Seed Student A (Complete profile)
    const studentAId = 'stu_ai_001';
    const studentAEmail = 'rohan@test.org';
    inMemoryStore.set(studentAId, {
      _id: studentAId,
      email: studentAEmail,
      personalInfo: { fullName: 'Rohan Sharma', age: 18, phone: '9876543210', location: 'Pune' },
      education: { eduLevel: '12th Pass', stream: 'Science (PCM)', marks: '82%' },
      careerInterest: { field: 'Data Science', favSubjects: 'Maths', preference: 'Higher Studies', skills: 'Python' },
      profileComplete: true,
      educationComplete: true,
      interestComplete: true,
      aiResult: {}
    });
    const tokenA = createMockToken(studentAId, studentAEmail);

    // Seed Student B (Incomplete profile — missing education)
    const studentBId = 'stu_ai_002';
    const studentBEmail = 'priya@test.org';
    inMemoryStore.set(studentBId, {
      _id: studentBId,
      email: studentBEmail,
      personalInfo: { fullName: 'Priya Verma' },
      education: {},
      careerInterest: {},
      profileComplete: false,
      educationComplete: false,
      interestComplete: false,
      aiResult: {}
    });
    const tokenB = createMockToken(studentBId, studentBEmail);

    /* ── 1. Route Mounting & Resolution (Regression Prevention) ─────── */
    console.log('1. Route Resolution & Mounting:');
    const analyzeProbe = await request(port, 'POST', '/api/ai/analyze', { interest: 'Tech' });
    assert(analyzeProbe.status !== 404, 'POST /api/ai/analyze is mounted and does not return HTTP 404');
    assert(!analyzeProbe.data?.message?.includes('API route not found'), 'POST /api/ai/analyze does not return "API route not found"');

    const savedProbe = await request(port, 'GET', '/api/ai/saved');
    assert(savedProbe.status !== 404, 'GET /api/ai/saved is mounted and does not return HTTP 404');
    assert(!savedProbe.data?.message?.includes('API route not found'), 'GET /api/ai/saved does not return "API route not found"');

    const unknownAiProbe = await request(port, 'POST', '/api/ai/nonexistent', null, tokenA);
    assert(unknownAiProbe.status === 404, 'Non-existent /api/ai/nonexistent with token returns HTTP 404');
    assert(unknownAiProbe.data?.message === 'API route not found: POST /api/ai/nonexistent', 'Unknown sub-route correctly reaches 404 handler');

    const unknownApiProbe = await request(port, 'GET', '/api/unknown-endpoint');
    assert(unknownApiProbe.status === 404, 'Non-existent /api/unknown-endpoint returns HTTP 404');
    assert(unknownApiProbe.data?.message === 'API route not found: GET /api/unknown-endpoint', 'Unknown /api path correctly reaches 404 handler');

    /* ── 2. Unauthenticated Access Rejected ──────────────────────────── */
    console.log('\n2. Authentication Enforcement:');
    const noTokenPost = analyzeProbe;
    assert(noTokenPost.status === 401, 'POST /api/ai/analyze without token returns HTTP 401');

    const noTokenGetSaved = savedProbe;
    assert(noTokenGetSaved.status === 401, 'GET /api/ai/saved without token returns HTTP 401');

    const badTokenPost = await request(port, 'POST', '/api/ai/analyze', null, 'invalid.jwt.token');
    assert(badTokenPost.status === 401, 'POST /api/ai/analyze with invalid token returns HTTP 401');

    /* ── 3. Incomplete Profile Validation ───────────────────────────── */
    console.log('\n3. Incomplete Profile Detection:');
    const incompleteRes = await request(port, 'POST', '/api/ai/analyze', {}, tokenB);
    assert(incompleteRes.status === 400, 'Rejects analysis for incomplete profile with HTTP 400');
    assert(incompleteRes.data.status === 'incomplete_profile', 'Response has status: "incomplete_profile"');
    assert(Array.isArray(incompleteRes.data.missing), 'Response lists missing sections');
    assert(incompleteRes.data.missing.includes('Educational Background'), 'Identifies missing Educational Background');
    assert(incompleteRes.data.redirectUrl === 'education.html', 'Points redirectUrl to education.html');

    // Partial education test: has eduLevel but missing stream
    inMemoryStore.set(studentBId, {
      ...inMemoryStore.get(studentBId),
      education: { eduLevel: '12th Pass' } // stream missing
    });
    const partialEduRes = await request(port, 'POST', '/api/ai/analyze', {}, tokenB);
    assert(partialEduRes.status === 400, 'Rejects analysis when stream is missing (HTTP 400)');
    assert(partialEduRes.data.missing.includes('Educational Background'), 'Identifies missing stream as incomplete education');

    // Verify isReadyForAI model method consistency
    const studentADoc = inMemoryStore.get(studentAId);
    assert(Boolean(studentADoc.personalInfo?.fullName && studentADoc.education?.eduLevel && studentADoc.education?.stream && studentADoc.careerInterest?.field), 'Student A has all required AI fields');

    /* ── 4. Successful Mocked Groq AI Guidance Generation ───────────── */
    console.log('\n4. Successful AI Guidance Generation (Mocked Groq):');

    // Mock aiService method
    aiService.generateCareerGuidance = async function (student, customInterest) {
      return {
        guidance: mockAiResponse,
        modelUsed: 'llama-3.3-70b-versatile-mock',
        rawText: JSON.stringify(mockAiResponse)
      };
    };

    const validAiRes = await request(port, 'POST', '/api/ai/analyze', { interest: 'Data Science' }, tokenA);
    assert(validAiRes.status === 200, 'POST /api/ai/analyze returns HTTP 200');
    assert(validAiRes.data.status === 'success', 'Response status is "success"');
    assert(Boolean(validAiRes.data.guidance), 'Response contains guidance object');
    assert(validAiRes.data.guidance.profileSummary.includes('Science'), 'Guidance includes profile summary');
    assert(Array.isArray(validAiRes.data.guidance.recommendedCareers), 'Guidance contains recommendedCareers array');
    assert(validAiRes.data.guidance.recommendedCareers.length === 2, 'Contains 2 recommended career options');
    assert(validAiRes.data.guidance.recommendedCareers[0].title === 'Junior Data Analyst', 'First recommendation title matches');
    assert(Array.isArray(validAiRes.data.guidance.recommendedCareers[0].requiredSkills), 'Contains required skills array');
    assert(Array.isArray(validAiRes.data.guidance.recommendedCareers[0].learningRoadmap), 'Contains learning roadmap array');
    assert(Array.isArray(validAiRes.data.guidance.recommendedResources), 'Contains recommended resources array');
    assert(Boolean(validAiRes.data.guidance.disclaimer), 'Includes informational disclaimer');

    // Verify saved to Student A document
    const updatedStudentA = inMemoryStore.get(studentAId);
    assert(Boolean(updatedStudentA.aiResult), 'AI result is saved in student document');
    assert(updatedStudentA.aiResult.status === 'success', 'Saved AI status is "success"');

    /* ── 5. Retrieve Saved Guidance ──────────────────────────────────── */
    console.log('\n5. Retrieve Previously Saved AI Guidance:');
    const savedRes = await request(port, 'GET', '/api/ai/saved', null, tokenA);
    assert(savedRes.status === 200, 'GET /api/ai/saved returns HTTP 200');
    assert(savedRes.data.status === 'success', 'Saved guidance response has status: "success"');
    assert(savedRes.data.guidance.recommendedCareers[0].title === 'Junior Data Analyst', 'Returns previously saved career title');

    /* ── 6. Provider Error, Rate Limit, Timeout & Config Handling ────── */
    console.log('\n6. Provider Error, Rate Limit, Timeout & Config Handling:');

    // Simulate provider timeout
    aiService.generateCareerGuidance = async function () {
      const timeoutErr = new Error('Request to Groq timed out.');
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    };

    const timeoutRes = await request(port, 'POST', '/api/ai/analyze', {}, tokenA);
    assert(timeoutRes.status === 504, 'Provider timeout mapped to HTTP 504 Gateway Timeout');
    assert(timeoutRes.data.status === 'error', 'Timeout response has status: "error"');

    // Simulate rate limit (429)
    aiService.generateCareerGuidance = async function () {
      const rateLimitErr = new Error('Rate limit exceeded');
      rateLimitErr.code = 'RATE_LIMIT';
      rateLimitErr.status = 429;
      throw rateLimitErr;
    };

    const rateLimitRes = await request(port, 'POST', '/api/ai/analyze', {}, tokenA);
    assert(rateLimitRes.status === 429, 'Rate limit mapped to HTTP 429 Too Many Requests');
    assert(rateLimitRes.data.status === 'error', 'Rate limit response has status: "error"');
    assert(rateLimitRes.data.message.includes('rate limit'), 'Rate limit response mentions rate limit');

    // Simulate missing GROQ_API_KEY
    aiService.generateCareerGuidance = async function () {
      const configErr = new Error('Groq API key is not configured in environment variables.');
      configErr.code = 'CONFIG_MISSING';
      throw configErr;
    };

    const configErrRes = await request(port, 'POST', '/api/ai/analyze', {}, tokenA);
    assert(configErrRes.status === 500, 'Missing GROQ_API_KEY mapped to HTTP 500');
    assert(configErrRes.data.message.includes('GROQ_API_KEY'), 'Missing config response references GROQ_API_KEY');

    // Simulate provider failure / invalid model
    aiService.generateCareerGuidance = async function () {
      const err = new Error('Provider unavailable');
      err.code = 'PROVIDER_ERROR';
      throw err;
    };

    const providerErrRes = await request(port, 'POST', '/api/ai/analyze', {}, tokenA);
    assert(providerErrRes.status === 502, 'Provider error mapped to HTTP 502 Bad Gateway');
    assert(providerErrRes.data.status === 'error', 'Error response has status: "error"');

    /* ── 7. Cross-Student AI Isolation ───────────────────────────────── */
    console.log('\n7. Cross-Student AI Data Isolation:');

    // Student B requests saved guidance -> must NOT receive Student A's guidance
    const studentBSaved = await request(port, 'GET', '/api/ai/saved', null, tokenB);
    assert(studentBSaved.status === 200, 'Student B can check their saved guidance');
    assert(studentBSaved.data.status === 'no_saved_guidance', 'Student B does NOT see Student A AI guidance');

    /* ── 8. Zero Secret Leakage ─────────────────────────────────────── */
    console.log('\n8. Secret & Key Leakage Prevention:');
    const checkedPayloads = [validAiRes.data, savedRes.data, timeoutRes.data, rateLimitRes.data, configErrRes.data, providerErrRes.data];
    for (const payload of checkedPayloads) {
      const rawString = JSON.stringify(payload);
      assert(!rawString.includes(process.env.GROQ_API_KEY || 'fake_key'), 'Response never leaks GROQ_API_KEY');
      assert(!rawString.includes('passwordHash'), 'Response never leaks passwordHash');
      assert(!rawString.includes('password'), 'Response never leaks password');
    }

    /* ── 9. Groq Model Candidate Resolution & Resiliency ─────────────── */
    console.log('\n9. Groq Model Candidate Resolution & Resiliency:');
    assert(typeof aiService.getModelCandidates === 'function', 'aiService exports getModelCandidates function');
    const defaultCandidates = aiService.getModelCandidates();
    assert(Array.isArray(defaultCandidates) && defaultCandidates.length >= 3, 'getModelCandidates returns array of fallback candidates');
    assert(defaultCandidates.includes('openai/gpt-oss-120b'), 'Fallback candidates include openai/gpt-oss-120b');
    assert(defaultCandidates.includes('openai/gpt-oss-20b'), 'Fallback candidates include openai/gpt-oss-20b');
    assert(defaultCandidates.includes('qwen/qwen3.8-27b'), 'Fallback candidates include qwen/qwen3.8-27b');

    const customCandidates = aiService.getModelCandidates('custom-groq-model');
    assert(customCandidates[0] === 'custom-groq-model', 'Custom model from GROQ_MODEL is prioritized first');
    assert(new Set(customCandidates).size === customCandidates.length, 'Candidate list contains no duplicates');

    /* ── 10. parseGroqJSON Resilience & Schema Validation ────────────── */
    console.log('\n10. parseGroqJSON Resilience & Schema Validation:');
    assert(typeof aiService.parseGroqJSON === 'function', 'aiService exports parseGroqJSON function');

    // Clean JSON parsing
    const cleanParsed = aiService.parseGroqJSON(JSON.stringify(mockAiResponse));
    assert(cleanParsed.profileSummary === mockAiResponse.profileSummary, 'Parses clean JSON response');
    assert(cleanParsed.recommendedCareers.length === 2, 'Retains recommendedCareers elements');

    // Wrapped in markdown code fences
    const fencedJSON = '```json\n' + JSON.stringify(mockAiResponse) + '\n```';
    const fencedParsed = aiService.parseGroqJSON(fencedJSON);
    assert(fencedParsed.profileSummary === mockAiResponse.profileSummary, 'Parses markdown-fenced JSON response');

    // Invalid / empty string handling
    let emptyThrew = false;
    try {
      aiService.parseGroqJSON('');
    } catch (e) {
      emptyThrew = true;
    }
    assert(emptyThrew, 'Throws error on empty string');

    let malformedThrew = false;
    try {
      aiService.parseGroqJSON('this is not json');
    } catch (e) {
      malformedThrew = true;
    }
    assert(malformedThrew, 'Throws error on non-JSON content');

    let missingCareersThrew = false;
    try {
      aiService.parseGroqJSON(JSON.stringify({ profileSummary: 'Valid summary', recommendedCareers: [] }));
    } catch (e) {
      missingCareersThrew = true;
    }
    assert(missingCareersThrew, 'Throws error when recommendedCareers array is missing or empty');

    console.log('\n====================================================');
    console.log(`Result: ${passedTests} of ${totalTests} checks passed.`);
    console.log('====================================================');

    if (passedTests === totalTests) {
      console.log('🎉 Phase 4 AI Guidance API (Groq) verified successfully!\n');
    }
  } finally {
    restoreAll();
    await new Promise((resolve) => testServer.close(resolve));
    console.log('  ℹ️ Test server closed cleanly.\n');
  }
}

run().catch((err) => {
  console.error('Fatal error in AI test runner:', err);
  restoreAll();
  process.exit(1);
});
