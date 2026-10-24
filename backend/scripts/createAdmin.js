/**
 * CareerSetu — Administrator Provisioning Utility
 * Securely creates or updates the administrative account using environment variables.
 *
 * Usage:
 *   npm run setup:admin
 *   node backend/scripts/createAdmin.js
 *
 * Required environment variables in .env:
 *   ADMIN_EMAIL=admin@careersetu.local
 *   ADMIN_PASSWORD=your_secure_password
 *   ADMIN_NAME=Platform Administrator (optional)
 */

'use strict';

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Determine path to .env
const envPath = path.resolve(__dirname, '..', '..', '.env');

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const { connectDB } = require('../config/database');
const Admin = require('../models/Admin');

async function setupAdmin() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           CareerSetu — Administrator Provisioning Utility        ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // 1. Verify environment configuration
  if (!fs.existsSync(envPath)) {
    console.error(`[AdminSetup] ❌ .env file not found at: ${envPath}`);
    console.error('            Please verify that your .env file exists in the project root.');
    process.exitCode = 1;
    return;
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('[AdminSetup] ❌ Configuration Error: ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env.');
    console.error('            Please ensure the following variables are set in your .env file:');
    console.error('            ADMIN_EMAIL=admin@careersetu.local');
    console.error('            ADMIN_PASSWORD=YourSecurePassword\n');
    process.exitCode = 1;
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (password.length < 8) {
    console.error('[AdminSetup] ❌ Security Warning: ADMIN_PASSWORD must be at least 8 characters long.\n');
    process.exitCode = 1;
    return;
  }

  console.log(`[AdminSetup] 📄 Configuration loaded from: ${envPath}`);
  console.log(`[AdminSetup] 👤 Target Admin Email: ${normalizedEmail}`);
  console.log('[AdminSetup] ⏳ Connecting to MongoDB Atlas (this may take 3-8 seconds)...');

  // 2. Connect to database
  let connected = false;
  try {
    connected = await connectDB();
  } catch (connErr) {
    console.error('[AdminSetup] ❌ Database connection threw an error:', connErr.message);
  }

  if (!connected) {
    console.error('[AdminSetup] ❌ Unable to connect to MongoDB Atlas.');
    console.error('            1. Check your internet connection.');
    console.error('            2. Check MONGODB_URI in .env.');
    console.error('            3. Ensure your current IP is whitelisted in MongoDB Atlas Network Access.\n');
    process.exitCode = 1;
    return;
  }

  // 3. Hash password and upsert admin record
  try {
    console.log('[AdminSetup] 🔒 Securely hashing admin password with bcryptjs (salt rounds: 10)...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log('[AdminSetup] 🔍 Checking for existing administrator record...');
    let admin = await Admin.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (admin) {
      admin.passwordHash = passwordHash;
      admin.role = 'admin';
      admin.isActive = true;
      if (process.env.ADMIN_NAME) {
        admin.fullName = process.env.ADMIN_NAME;
      }
      await admin.save();
      console.log(`[AdminSetup] ✅ Existing admin account updated for "${normalizedEmail}".`);
    } else {
      admin = new Admin({
        email: normalizedEmail,
        passwordHash,
        fullName: process.env.ADMIN_NAME || 'Platform Administrator',
        role: 'admin',
        isActive: true
      });
      await admin.save();
      console.log(`[AdminSetup] ✅ New administrator account created for "${normalizedEmail}".`);
    }

    console.log('\n──────────────────────────────────────────────────────────────────');
    console.log('🎉 Administrator Ready!');
    console.log(`📧 Login Email:    ${normalizedEmail}`);
    console.log('🔑 Password:       [Configured securely from ADMIN_PASSWORD in .env]');
    console.log('🌐 Admin Login URL: http://localhost:5000/admin/login.html');
    console.log('──────────────────────────────────────────────────────────────────\n');
  } catch (err) {
    console.error('[AdminSetup] ❌ Error provisioning admin account:', err.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('[AdminSetup] 🔌 Database connection closed cleanly.\n');
    }
  }
}

if (require.main === module) {
  setupAdmin()
    .then(() => {
      // Exit cleanly after event loop drains
    })
    .catch((err) => {
      console.error('[AdminSetup] ❌ Unhandled error:', err);
      process.exitCode = 1;
    });
}

module.exports = { setupAdmin };
