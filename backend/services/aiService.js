/**
 * CareerSetu — Groq AI Career Guidance Service (Phase 4)
 * Uses official groq-sdk to analyze student profile
 * and return structured JSON career recommendations.
 */

'use strict';

const Groq = require('groq-sdk');

/**
 * Verified learning resources that are always accurate and safe
 */
const VERIFIED_RESOURCES = [
  {
    title: 'CareerSetu Curated YouTube Learning Playlists',
    url: 'youtube-resources.html',
    type: 'internal',
    description: 'Explore 100+ curated playlists covering Python, Web Dev, Data Science, and Foundation courses.'
  },
  {
    title: 'National Scholarship Portal (NSP)',
    url: 'scholarships.html',
    type: 'internal',
    description: 'Central and state government scholarship schemes to fund higher education.'
  },
  {
    title: 'Government Jobs & Exam Results Portal',
    url: 'jobs-results.html',
    type: 'internal',
    description: 'Official notifications for SSC, UPSC, Banking, and State recruitment exams.'
  }
];

const STANDARD_DISCLAIMER =
  'This career guidance is AI-generated for informational and educational purposes. Course eligibility, admissions, and recruitment criteria must be verified through official government or institution notifications.';

/**
 * Build system prompt instructing Groq model on role and exact JSON schema.
 */
function buildSystemPrompt() {
  return `You are CareerSetu AI, an empathetic and practical career counselor for college and high-school students in India (including students from underprivileged backgrounds).
Your task is to analyze the student's academic background and career interests, then return structured, realistic career guidance.

CRITICAL RULES:
1. Do NOT make guarantees about jobs, placements, salaries, or admissions.
2. Provide at least 2 to 3 realistic, viable career options aligned with their education and interests.
3. Every career must include clear, realistic eligibility criteria and concrete beginner steps.
4. You MUST respond with a single valid JSON object strictly matching the required schema. No Markdown backticks, no prefix or suffix commentary.

The JSON schema must match:
{
  "profileSummary": "string (2-3 sentences summarizing their current profile and potential)",
  "recommendedCareers": [
    {
      "title": "string (career title)",
      "tagline": "string (e.g. High Demand • Strong Growth)",
      "whySuitable": "string (why this fits their stream and interests)",
      "eligibility": ["string", "string"],
      "requiredSkills": ["string", "string", "string", "string"],
      "learningRoadmap": ["string (step 1)", "string (step 2)", "string (step 3)"]
    }
  ],
  "learningRoadmapGeneral": [
    "string (step 1)",
    "string (step 2)",
    "string (step 3)"
  ]
}`;
}

/**
 * Build a concise, privacy-safe student prompt for Groq.
 * Sends ONLY education & career preference details, NEVER passwords, phone numbers, or emails.
 */
function buildPrompt(studentProfile, customInterest) {
  const pInfo = studentProfile.personalInfo || {};
  const edu   = studentProfile.education || {};
  const cInt  = studentProfile.careerInterest || {};

  const effectiveField  = (customInterest || cInt.field || 'General').trim();
  const effectiveEdu    = (edu.eduLevel || 'Student').trim();
  const effectiveStream = (edu.stream || 'General').trim();
  const marks           = (edu.marks || 'Not specified').trim();
  const favSubjects     = (cInt.favSubjects || 'Not specified').trim();
  const preference      = (cInt.preference || 'Career guidance').trim();
  const skills          = (cInt.skills || 'Not specified').trim();

  return `
Analyze this student profile and generate structured, realistic career guidance in JSON format:
- Education Level: ${effectiveEdu}
- Stream / Course: ${effectiveStream}
- Academic Performance / Marks: ${marks}
- Preferred Career Interest: ${effectiveField}
- Favourite Subjects: ${favSubjects}
- Career Priority / Preference: ${preference}
- Skills Interested In Learning: ${skills}
`.trim();
}

/**
 * Safely parse JSON from Groq AI response.
 * Handles cases where model wraps in markdown code fences or has leading/trailing text.
 */
function parseGroqJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from AI model.');
  }

  let cleaned = rawText.trim();

  // Strip markdown code fences if present (```json ... ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // Find the outermost JSON object
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not contain a valid JSON object.');
  }

  cleaned = cleaned.substring(start, end + 1);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse AI response JSON: ${err.message}`);
  }

  // Validate required structure
  if (!parsed.profileSummary || !Array.isArray(parsed.recommendedCareers) || parsed.recommendedCareers.length === 0) {
    throw new Error('AI response is missing required career recommendations.');
  }

  return {
    profileSummary: String(parsed.profileSummary),
    recommendedCareers: parsed.recommendedCareers.map((c) => ({
      title: String(c.title || 'Career Option'),
      tagline: String(c.tagline || 'Career Opportunity'),
      whySuitable: String(c.whySuitable || 'Aligns with your education and interest.'),
      eligibility: Array.isArray(c.eligibility) ? c.eligibility.map(String) : [],
      requiredSkills: Array.isArray(c.requiredSkills) ? c.requiredSkills.map(String) : [],
      learningRoadmap: Array.isArray(c.learningRoadmap) ? c.learningRoadmap.map(String) : []
    })),
    learningRoadmapGeneral: Array.isArray(parsed.learningRoadmapGeneral)
      ? parsed.learningRoadmapGeneral.map(String)
      : [],
    recommendedResources: VERIFIED_RESOURCES,
    disclaimer: STANDARD_DISCLAIMER
  };
}

/**
 * Determine ordered candidate models for generation.
 * Checks GROQ_MODEL env var first, followed by active, high-availability models.
 */
function getModelCandidates(overrideModel) {
  const configured = overrideModel !== undefined ? overrideModel : process.env.GROQ_MODEL;
  const custom = configured && typeof configured === 'string' ? configured.trim() : null;
  const candidateSet = new Set(
    [
      custom,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant'
    ].filter(Boolean)
  );
  return Array.from(candidateSet);
}

/**
 * Generate Career Guidance by calling Groq API.
 * Supports configurable model names and fallback models in case of rate limit or deprecation.
 */
async function generateCareerGuidance(studentProfile, customInterest = null) {
  const apiKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : '';
  if (!apiKey || apiKey.includes('your_groq') || apiKey.includes('your-groq')) {
    const err = new Error('Groq API key is not configured in environment variables.');
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const groq = new Groq({ apiKey });
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildPrompt(studentProfile, customInterest);
  const modelCandidates = getModelCandidates();

  let lastError = null;

  for (const model of modelCandidates) {
    try {
      // 25s timeout promise race
      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          const timeoutErr = new Error('Request to Groq timed out.');
          timeoutErr.code = 'TIMEOUT';
          reject(timeoutErr);
        }, 25000);
        timer.unref?.();
      });

      const completionPromise = groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model,
        temperature: 0.5,
        response_format: { type: 'json_object' }
      });

      const response = await Promise.race([completionPromise, timeoutPromise]);
      const text = response?.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error('Groq returned an empty response text.');
      }

      const structuredResult = parseGroqJSON(text);
      console.log(`[aiService] ✅ Career guidance generated successfully using Groq model: ${model}`);
      return {
        guidance: structuredResult,
        modelUsed: model,
        rawText: text
      };
    } catch (err) {
      lastError = err;
      // Redact sensitive keys or tokens from log output
      const safeMsg = (err.message || '').replace(/(?:gsk_|key=)[a-zA-Z0-9_\-]+/gi, '[REDACTED]');
      console.warn(`[aiService] Groq model ${model} generation attempt failed:`, safeMsg);

      // If timed out, break immediately to avoid compounding delays
      if (err.code === 'TIMEOUT') break;

      // If authentication error (invalid key), do not try other models with same key
      if (err.status === 401 || err?.error?.code === 'invalid_api_key') {
        const authErr = new Error('Invalid Groq API key.');
        authErr.code = 'AUTH_ERROR';
        authErr.status = 401;
        throw authErr;
      }

      // If rate limit (429), note the status
      if (err.status === 429 || err?.error?.code === 'rate_limit_exceeded') {
        lastError.code = 'RATE_LIMIT';
        lastError.status = 429;
      }
    }
  }

  // If all model candidates failed, throw user-friendly error with appropriate code
  let finalError;
  if (lastError?.code === 'TIMEOUT') {
    finalError = new Error('The AI guidance request timed out. Please check your connection and try again.');
    finalError.code = 'TIMEOUT';
    finalError.status = 504;
  } else if (lastError?.code === 'RATE_LIMIT' || lastError?.status === 429) {
    finalError = new Error('AI service rate limit reached. Please wait a moment and try again.');
    finalError.code = 'RATE_LIMIT';
    finalError.status = 429;
  } else if (lastError?.code === 'AUTH_ERROR' || lastError?.status === 401) {
    finalError = new Error('Groq API authentication failed. Please verify GROQ_API_KEY.');
    finalError.code = 'AUTH_ERROR';
    finalError.status = 401;
  } else {
    finalError = new Error('AI guidance service is temporarily unavailable. Please try again in a few moments.');
    finalError.code = lastError?.code || 'PROVIDER_ERROR';
    finalError.status = 502;
  }
  throw finalError;
}

module.exports = {
  generateCareerGuidance,
  parseGroqJSON,
  buildPrompt,
  buildSystemPrompt,
  getModelCandidates,
  VERIFIED_RESOURCES,
  STANDARD_DISCLAIMER
};
