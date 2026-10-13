/**
 * CareerSetu — Gemini AI Career Guidance Service (Phase 4)
 * Uses official @google/genai SDK to analyze student profile
 * and return structured JSON career recommendations.
 */

'use strict';

const { GoogleGenAI } = require('@google/genai');

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
 * Build a concise, privacy-safe prompt for Gemini.
 * Sends ONLY education & career preference details, NEVER passwords, phone numbers, or emails.
 */
function buildPrompt(studentProfile, customInterest) {
  const pInfo = studentProfile.personalInfo || {};
  const edu   = studentProfile.education || {};
  const cInt  = studentProfile.careerInterest || {};

  const effectiveField = (customInterest || cInt.field || 'General').trim();
  const effectiveEdu   = (edu.eduLevel || 'Student').trim();
  const effectiveStream = (edu.stream || 'General').trim();
  const marks          = (edu.marks || 'Not specified').trim();
  const favSubjects    = (cInt.favSubjects || 'Not specified').trim();
  const preference     = (cInt.preference || 'Career guidance').trim();
  const skills         = (cInt.skills || 'Not specified').trim();

  return `
You are CareerSetu AI, an empathetic and practical career counselor for college and high-school students in India (including students from underprivileged backgrounds).

Analyze this student profile and generate structured, realistic career guidance:
- Education Level: ${effectiveEdu}
- Stream / Course: ${effectiveStream}
- Academic Performance / Marks: ${marks}
- Preferred Career Interest: ${effectiveField}
- Favourite Subjects: ${favSubjects}
- Career Priority / Preference: ${preference}
- Skills Interested In Learning: ${skills}

CRITICAL RULES:
1. Do NOT make guarantees about jobs, placements, salaries, or admissions.
2. Provide at least 2 to 3 realistic, viable career options aligned with their education and interests.
3. Every career must include clear, realistic eligibility criteria and concrete beginner steps.
4. Return ONLY a single valid JSON object, with NO markdown formatting, NO backticks, and NO extra commentary.

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
}
`.trim();
}

/**
 * Safely parse JSON from Gemini response.
 * Handles cases where model wraps in markdown code fences or has leading/trailing text.
 */
function parseGeminiJSON(rawText) {
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

  const parsed = JSON.parse(cleaned);

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
 * Generate Career Guidance by calling Gemini.
 * Supports configurable model names and fallback models in case of rate limit or deprecation.
 */
async function generateCareerGuidance(studentProfile, customInterest = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_gemini') || apiKey.includes('your-gemini')) {
    const err = new Error('Gemini API key is not configured in environment variables.');
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(studentProfile, customInterest);

  const modelCandidates = [
    process.env.GEMINI_MODEL,
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-2.0-flash'
  ].filter(Boolean);

  let lastError = null;

  for (const model of modelCandidates) {
    try {
      // Call Gemini with timeout promise race
      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          const timeoutErr = new Error(`Request to Gemini timed out.`);
          timeoutErr.code = 'TIMEOUT';
          reject(timeoutErr);
        }, 25000);
        timer.unref?.();
      });

      const generatePromise = ai.models.generateContent({
        model,
        contents: prompt
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);

      const text = response?.text;
      if (!text) {
        throw new Error('Gemini returned an empty response text.');
      }

      const structuredResult = parseGeminiJSON(text);
      return {
        guidance: structuredResult,
        modelUsed: model,
        rawText: text
      };
    } catch (err) {
      lastError = err;
      console.warn(`[aiService] Model ${model} generation attempt failed:`, err.message);

      // If timed out, break immediately to avoid compounding delays
      if (err.code === 'TIMEOUT') break;
    }
  }

  // If all model candidates failed, throw user-friendly error
  const finalError = new Error(
    lastError?.code === 'TIMEOUT'
      ? 'The AI guidance request timed out. Please check your connection and try again.'
      : 'AI guidance service is temporarily unavailable. Please try again in a few moments.'
  );
  finalError.code = lastError?.code || 'PROVIDER_ERROR';
  throw finalError;
}

module.exports = {
  generateCareerGuidance,
  parseGeminiJSON,
  buildPrompt,
  VERIFIED_RESOURCES,
  STANDARD_DISCLAIMER
};
