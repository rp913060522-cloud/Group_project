/**
 * CareerSetu — Email Delivery Diagnostic & Test Utility
 * Tests active email transport (Brevo, Resend, or SMTP) without leaking secrets.
 *
 * Usage:
 *   node backend/scripts/testEmailDelivery.js
 *   node backend/scripts/testEmailDelivery.js --send your-email@gmail.com
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { sendPasswordResetEmail, getTransporter } = require('../services/emailService');

async function testDelivery() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           CareerSetu — Email Delivery Diagnostic Tool            ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  console.log('1. Detecting Active Email Configuration:');
  if (brevoKey && !brevoKey.includes('your-')) {
    console.log('   🟢 Provider: Brevo REST API (HTTPS Port 443 — Render Free Tier Compatible)');
  } else if (resendKey && !resendKey.includes('your-')) {
    console.log('   🟢 Provider: Resend REST API (HTTPS Port 443 — Render Free Tier Compatible)');
  } else if (smtpUser && smtpPass && !smtpPass.includes('your-')) {
    console.log('   🟡 Provider: Standard SMTP via Nodemailer');
    console.log(`      Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${process.env.SMTP_PORT || 587}`);
    console.log('      ⚠️ Note: Render Free Tier blocks outbound SMTP ports 25, 465, and 587.');
  } else {
    console.log('   ⚪ Provider: Local Simulation Mode (No external provider configured)');
  }

  // Check if --send flag was provided
  const sendArgIndex = process.argv.indexOf('--send');
  const targetEmail = sendArgIndex !== -1 ? process.argv[sendArgIndex + 1] : null;

  if (targetEmail) {
    console.log(`\n2. Attempting test dispatch to: ${targetEmail}...`);
    try {
      const res = await sendPasswordResetEmail({
        to: targetEmail,
        name: 'Test Student',
        resetUrl: 'http://localhost:5000/reset-password.html?token=test-diagnostic-token'
      });
      console.log('✅ Dispatch succeeded!');
      console.log('   Result:', JSON.stringify(res, null, 2));
    } catch (err) {
      console.error('❌ Dispatch failed:', err.message);
    }
  } else {
    console.log('\n💡 Tip: To send a real test email to your inbox, run:');
    console.log('   node backend/scripts/testEmailDelivery.js --send your-email@gmail.com\n');
  }
}

testDelivery();
