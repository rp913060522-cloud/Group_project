/**
 * CareerSetu — Student Model
 *
 * Stores the complete student profile across all three data-collection steps:
 *   1. Personal information  (student-info page)
 *   2. Educational background (education page)
 *   3. Career interest        (career-interest page)
 *
 * Phase 4: aiResult (Groq AI analysis output)
 * Phase 5 will let the admin read these documents.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/* ── Sub-schema: Personal Information ────────────────────────────────────── */
const personalInfoSchema = new mongoose.Schema(
  {
    fullName:  { type: String, trim: true },
    age:       { type: Number, min: 10, max: 100 },
    gender:    {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
      default: ''
    },
    phone:     { type: String, trim: true },
    location:  { type: String, trim: true },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

/* ── Sub-schema: Educational Background ──────────────────────────────────── */
const educationSchema = new mongoose.Schema(
  {
    eduLevel:       { type: String, trim: true },  // effective level (may be custom)
    eduLevelSelect: { type: String, trim: true },  // dropdown value ('Other' or predefined)
    eduLevelCustom: { type: String, trim: true },  // text if 'Other' was chosen
    stream:         { type: String, trim: true },
    streamSelect:   { type: String, trim: true },
    streamCustom:   { type: String, trim: true },
    subjects:       { type: String, trim: true },
    marks:          { type: String, trim: true },  // stored as string to allow "75%" or "7.8 CGPA"
    updatedAt:      { type: Date, default: Date.now }
  },
  { _id: false }
);

/* ── Sub-schema: Career Interest ─────────────────────────────────────────── */
const careerInterestSchema = new mongoose.Schema(
  {
    field:            { type: String, trim: true },  // effective preferred field/industry
    fieldSelect:      { type: String, trim: true },  // dropdown value ('Other' or predefined)
    fieldCustom:      { type: String, trim: true },  // text if 'Other' was chosen
    favSubjects:      { type: String, trim: true },
    preference:       { type: String, trim: true },  // effective career preference / priority
    preferenceSelect: { type: String, trim: true },  // dropdown value ('Other' or predefined)
    preferenceCustom: { type: String, trim: true },  // text if 'Other' was chosen
    skills:           { type: String, trim: true },  // skills the student wants to learn
    updatedAt:        { type: Date, default: Date.now }
  },
  { _id: false }
);

/* ── Sub-schema: AI Result (placeholder for Phase 4) ─────────────────────── */
const aiResultSchema = new mongoose.Schema(
  {
    generatedAt:    { type: Date },
    promptSummary:  { type: String },       // truncated prompt sent to AI
    rawResponse:    { type: String },       // raw AI response text (for debugging)
    parsedResult:   { type: mongoose.Schema.Types.Mixed }, // structured JSON from AI
    status:         {
      type: String,
      enum: ['pending', 'success', 'error'],
      default: 'pending'
    },
    errorMessage:   { type: String }
  },
  { _id: false }
);

/* ── Main Student Schema ──────────────────────────────────────────────────── */
const studentSchema = new mongoose.Schema(
  {
    /* Auth fields (Phase 2 will add passwordHash + JWT) */
    email:        {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      select: false    // never returned in queries by default
    },

    /* Profile completeness flags — useful for admin overview */
    profileComplete:     { type: Boolean, default: false },
    educationComplete:   { type: Boolean, default: false },
    interestComplete:    { type: Boolean, default: false },

    /* Data sections — populated progressively as the student fills in forms */
    personalInfo:   { type: personalInfoSchema,    default: () => ({}) },
    education:      { type: educationSchema,       default: () => ({}) },
    careerInterest: { type: careerInterestSchema,  default: () => ({}) },
    aiResult:       { type: aiResultSchema,        default: () => ({}) },

    /* Metadata */
    isGuest:       { type: Boolean, default: false },  // true = entered via "Skip for Now"
    lastActive:    { type: Date, default: Date.now }
  },
  {
    timestamps: true  // adds createdAt and updatedAt at the document level
  }
);

/* ── Indexes ─────────────────────────────────────────────────────────────── */
studentSchema.index({ createdAt: -1 });

/* ── Instance helpers ────────────────────────────────────────────────────── */

/**
 * Returns a safe public view of the student (no passwordHash).
 */
studentSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

/**
 * Compares candidate plain-text password with stored bcrypt passwordHash.
 */
studentSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash || !candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Checks whether all three profile sections are filled enough to send to AI.
 */
studentSchema.methods.isReadyForAI = function () {
  const hasProfile   = !!(this.personalInfo?.fullName);
  const hasEducation = !!(this.education?.eduLevel && this.education?.stream);
  const effectiveField = (this.careerInterest?.field === 'Other' && this.careerInterest?.fieldCustom)
    ? this.careerInterest.fieldCustom
    : this.careerInterest?.field;
  const hasInterest  = !!(effectiveField && effectiveField !== 'Other');
  return hasProfile && hasEducation && hasInterest;
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
