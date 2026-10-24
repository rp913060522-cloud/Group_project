/**
 * CareerSetu — Email Service
 * Handles transactional emails (Password Reset, etc.) using Nodemailer.
 *
 * Configured via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM
 *
 * If SMTP credentials are not configured (e.g. local development / viva demo),
 * the service safely logs the generated reset link to the server console
 * without throwing errors or halting the request.
 */

'use strict';

const nodemailer = require('nodemailer');

/**
 * Creates a Nodemailer transporter instance if credentials exist.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
  // Strip spaces if user copied Google's 4x4 app password with spaces
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : null;

  const isPlaceholder = (val) => !val || val.includes('YOUR_GMAIL') || val.includes('YOUR_16_CHAR') || val.includes('your-email') || val.includes('your-gmail');

  if (isPlaceholder(user) || isPlaceholder(pass)) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

/**
 * Sends a password reset email to the user.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - Recipient student name
 * @param {string} options.resetUrl - Full URL to password reset page with token
 * @returns {Promise<{ success: boolean, simulated: boolean, messageId?: string, resetUrl?: string }>}
 */
async function sendPasswordResetEmail({ to, name = 'Student', resetUrl }) {
  const from = process.env.EMAIL_FROM || '"CareerSetu Support" <no-reply@careersetu.org>';
  const transporter = getTransporter();

  // If SMTP is not yet configured
  if (!transporter) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[EmailService] ⚠️ SMTP_USER and SMTP_PASS are not configured in production. Password reset email could not be dispatched.');
      return { success: false, simulated: false, error: 'SMTP service not configured in production.' };
    }

    // In local development / testing, provide safe simulation banner
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║           CareerSetu Password Reset Notification (Simulated)       ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log(`[EmailService] ✉️  To:        ${to}`);
    console.log(`[EmailService] 👤 Name:      ${name}`);
    console.log(`[EmailService] 🔗 Reset URL: ${resetUrl}`);
    console.log('[EmailService] ℹ️  SMTP_USER / SMTP_PASS not set in .env. Reset link ready for testing.');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');
    return { success: true, simulated: true, resetUrl };
  }

  const subject = 'CareerSetu — Password Reset Request';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .email-container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #1d4ed8; padding: 24px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px 30px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #1d4ed8; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-size: 15px; }
    .note { font-size: 13px; color: #64748b; line-height: 1.6; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; }
    .raw-link { word-break: break-all; color: #2563eb; font-size: 12px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>CareerSetu</h1>
      <p>Empowering Students | Career &amp; Educational Guidance</p>
    </div>
    <div class="content">
      <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset the password for your CareerSetu account. Click the button below to set a new password:</p>
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password &rarr;</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">This password reset link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your account remains secure.</p>
      <div class="note">
        <p style="margin: 0 0 6px;">Button not working? Copy and paste this URL into your browser:</p>
        <a href="${resetUrl}" class="raw-link">${resetUrl}</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

  const text = `Hello ${name},\n\nWe received a request to reset your CareerSetu password.\n\nPlease visit the following link to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\n— The CareerSetu Team`;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html
    });

    console.log(`[EmailService] ✅ Email dispatched successfully to ${to} (Message ID: ${info.messageId})`);
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] ❌ Failed to dispatch email via SMTP:`, err.message);
    if (err.code === 'EAUTH') {
      console.error('[EmailService] 💡 SMTP Authentication Failed: Please verify that SMTP_USER is your full Gmail address and SMTP_PASS is your 16-character Google App Password.');
    } else if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT') {
      console.error('[EmailService] 💡 Network Error: Unable to connect to smtp.gmail.com on port 587. Please check your internet connection or firewall.');
    }
    throw err;
  }
}

module.exports = {
  sendPasswordResetEmail,
  getTransporter
};
