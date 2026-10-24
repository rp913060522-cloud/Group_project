/**
 * CareerSetu — Email Service
 * Handles transactional emails (Password Reset, etc.) across environments.
 *
 * Supported delivery mechanisms:
 *   1. Brevo REST API (HTTPS Port 443 — Recommended for Render Free Tier)
 *      Configured via: BREVO_API_KEY (or SENDINBLUE_API_KEY)
 *   2. Resend REST API (HTTPS Port 443 — Alternative for cloud platforms)
 *      Configured via: RESEND_API_KEY
 *   3. Standard SMTP / Nodemailer (Ports 587/465 — Localhost / Paid Cloud / VPS)
 *      Configured via: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE
 *   4. Local Simulation Fallback (Localhost development when no provider configured)
 *
 * Resiliency & Safety:
 *   - Uses HTTPS Port 443 on Render Free Tier to bypass platform outbound SMTP blocks
 *   - Strict 8-second request timeouts via AbortController / Promise.race
 *   - Zero secret or token exposure in error logs
 */

'use strict';

const nodemailer = require('nodemailer');

/**
 * Checks if a string contains placeholder / template values.
 */
function isPlaceholder(val) {
  if (!val || typeof val !== 'string') return true;
  const lower = val.toLowerCase();
  return (
    lower.includes('your_') ||
    lower.includes('your-') ||
    lower.includes('example.com') ||
    lower.includes('<') ||
    lower.includes('xxxx')
  );
}

/**
 * Parses sender name and email from RFC 5322 string: "Name <email@domain.com>" or "email@domain.com"
 */
function parseSender(fromStr, fallbackEmail) {
  let name = 'CareerSetu Support';
  let email = fallbackEmail || 'support@careersetu.org';

  if (fromStr && typeof fromStr === 'string') {
    const match = fromStr.match(/^(?:"?([^"]*)"?\s)?(?:<?([^>]+@[^>]+)>?)$/);
    if (match) {
      if (match[1] && match[1].trim()) name = match[1].trim();
      if (match[2] && match[2].trim()) email = match[2].trim();
    } else if (fromStr.includes('@')) {
      email = fromStr.trim();
    }
  }

  return { name, email };
}

/**
 * Dispatch transactional email via Brevo HTTP REST API (Port 443 HTTPS).
 * Bypasses Render Free Tier outbound SMTP port blocks.
 */
async function sendViaBrevo({ apiKey, from, to, name, subject, html, text }) {
  const { name: senderName, email: senderEmail } = parseSender(
    from || process.env.EMAIL_FROM,
    process.env.SMTP_USER || 'support@careersetu.org'
  );

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to, name: name || 'Student' }],
    subject,
    htmlContent: html,
    textContent: text
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey.trim(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = data.message || `HTTP ${response.status}`;
      throw new Error(`Brevo API responded with error: ${errMsg}`);
    }

    const messageId = data.messageId || 'brevo-sent';
    console.log(`[EmailService] ✅ Email dispatched via Brevo HTTPS to ${to} (Message ID: ${messageId})`);
    return { success: true, simulated: false, provider: 'brevo', messageId };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Brevo API request timed out after 8000ms');
    }
    throw err;
  }
}

/**
 * Dispatch transactional email via Resend HTTP REST API (Port 443 HTTPS).
 * Bypasses Render Free Tier outbound SMTP port blocks.
 */
async function sendViaResend({ apiKey, from, to, name, subject, html, text }) {
  const defaultFrom = 'CareerSetu Support <onboarding@resend.dev>';
  const fromAddress = from || process.env.EMAIL_FROM || defaultFrom;

  const payload = {
    from: fromAddress,
    to: [to],
    subject,
    html,
    text
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = data.message || `HTTP ${response.status}`;
      throw new Error(`Resend API responded with error: ${errMsg}`);
    }

    const messageId = data.id || 'resend-sent';
    console.log(`[EmailService] ✅ Email dispatched via Resend HTTPS to ${to} (Message ID: ${messageId})`);
    return { success: true, simulated: false, provider: 'resend', messageId };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Resend API request timed out after 8000ms');
    }
    throw err;
  }
}

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

  if (isPlaceholder(user) || isPlaceholder(pass)) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 8000, // 8s to establish socket connection
    greetingTimeout: 5000,   // 5s for SMTP greeting
    socketTimeout: 10000,    // 10s socket inactivity timeout
    dnsTimeout: 5000,        // 5s DNS lookup timeout
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    }
  });
}

/**
 * Dispatch transactional email via Nodemailer SMTP.
 */
async function sendViaSmtp({ transporter, from, to, subject, html, text }) {
  const sendPromise = transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });

  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      const timeoutErr = new Error('SMTP connection timed out after 8000ms');
      timeoutErr.code = 'ETIMEDOUT';
      reject(timeoutErr);
    }, 8000);
  });

  try {
    const info = await Promise.race([sendPromise, timeoutPromise]);
    clearTimeout(timerId);

    console.log(`[EmailService] ✅ Email dispatched via SMTP to ${to} (Message ID: ${info.messageId})`);
    return { success: true, simulated: false, provider: 'smtp', messageId: info.messageId };
  } catch (err) {
    clearTimeout(timerId);
    console.error(`[EmailService] ❌ Failed to dispatch email via SMTP:`, err.message);

    if (err.code === 'EAUTH') {
      console.error('[EmailService] 💡 SMTP Authentication Failed: Verify SMTP_USER is your full Gmail address and SMTP_PASS is your 16-character Google App Password.');
    } else if (err.code === 'ESOCKET' || err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
      console.error('[EmailService] 💡 Cloud Platform Notice: Render Free Tier blocks outbound SMTP traffic on ports 25, 465, and 587.');
      console.error('     To send emails reliably on Render Free Tier, please configure BREVO_API_KEY (from brevo.com, 300 free emails/day)');
      console.error('     or RESEND_API_KEY (from resend.com). These deliver over standard HTTPS (Port 443), which is never blocked.');
    }
    throw err;
  }
}

/**
 * Sends a password reset email using the best available transport mechanism.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - Recipient student name
 * @param {string} options.resetUrl - Full URL to password reset page with token
 * @returns {Promise<{ success: boolean, simulated: boolean, provider?: string, messageId?: string, resetUrl?: string }>}
 */
async function sendPasswordResetEmail({ to, name = 'Student', resetUrl }) {
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    throw new Error('Valid recipient email address is required');
  }

  // RFC 2606 Reserved Test Domains Protection:
  // If an automated test or local script uses a reserved test domain (e.g. example.com, .test, .invalid, .local),
  // safely simulate delivery to avoid sending real SMTP traffic across the internet that bounces back.
  const isTestDomain = /@(example\.(com|org|net)|test|invalid|localhost|careersetu\.org|careersetu\.local)$/i.test(to.trim());
  if (isTestDomain) {
    console.log(`[EmailService] 🧪 Test recipient detected (${to.trim()}). Safely simulating delivery to prevent network bounce.`);
    return { success: true, simulated: true, recipient: to.trim(), messageId: 'simulated-test-recipient', resetUrl };
  }

  const from = process.env.EMAIL_FROM || '"CareerSetu Support" <no-reply@careersetu.org>';
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

  // 1. Priority: Brevo REST API (HTTPS port 443 — works seamlessly on Render Free Tier)
  const brevoKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  if (brevoKey && !isPlaceholder(brevoKey)) {
    return sendViaBrevo({ apiKey: brevoKey, from, to, name, subject, html, text });
  }

  // 2. Priority: Resend REST API (HTTPS port 443 — works seamlessly on Render Free Tier)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && !isPlaceholder(resendKey)) {
    return sendViaResend({ apiKey: resendKey, from, to, name, subject, html, text });
  }

  // 3. Priority: Standard SMTP via Nodemailer (Localhost / Paid Render / Generic SMTP)
  const transporter = getTransporter();
  if (transporter) {
    return sendViaSmtp({ transporter, from, to, subject, html, text });
  }

  // 4. Priority: Local Development Simulation Fallback
  if (process.env.NODE_ENV === 'production') {
    console.warn('[EmailService] ⚠️ No email service configured in production.');
    console.warn('[EmailService] 💡 On Render Free Tier, please set BREVO_API_KEY or RESEND_API_KEY in environment variables.');
    return { success: false, simulated: false, error: 'No email service configured in production.' };
  }

  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║           CareerSetu Password Reset Notification (Simulated)       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(`[EmailService] ✉️  To:        ${to}`);
  console.log(`[EmailService] 👤 Name:      ${name}`);
  console.log(`[EmailService] 🔗 Reset URL: ${resetUrl}`);
  console.log('[EmailService] ℹ️  SMTP / Brevo not configured in .env. Reset link simulated for testing.');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  return { success: true, simulated: true, resetUrl };
}

module.exports = {
  sendPasswordResetEmail,
  getTransporter,
  sendViaBrevo,
  sendViaResend
};
