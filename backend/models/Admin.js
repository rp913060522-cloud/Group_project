/**
 * CareerSetu — Admin Model
 * Stores administrative accounts for student record management and platform metrics.
 * Passwords are encrypted using bcryptjs.
 */

'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false // never returned in queries by default
    },
    fullName: {
      type: String,
      default: 'Administrator',
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

/* ── Instance Methods ────────────────────────────────────────────────────── */

/**
 * Returns safe public object excluding passwordHash
 */
adminSchema.methods.toPublicJSON = function () {
  const obj = this.toObject ? this.toObject() : { ...this };
  delete obj.passwordHash;
  return obj;
};

/**
 * Compares candidate password with stored bcrypt hash
 */
adminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash || !candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
