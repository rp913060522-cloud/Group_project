/**
 * CareerSetu — Express Server (Phase 1)
 *
 * Phase 1: Server + DB connection + health endpoint
 * Phase 2: Auth routes (register/login/JWT)
 * Phase 3: Student data routes
 * Phase 4: AI analysis route
 * Phase 5: Admin routes
 */

'use strict';

const path    = require('path');
const express = require('express');
const cors    = require('cors');

/* ── Load environment variables first ───────────────────────────────────── */
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { connectDB } = require('./config/database');

/* ── App setup ───────────────────────────────────────────────────────────── */
const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ──────────────────────────────────────────────────────────── */

// CORS — allow frontend in local development and production (Render/custom domain)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',   // Live Server (VS Code)
  'http://127.0.0.1:5500',
  'http://localhost:5000',
  /^file:\/\//               // local file:// pages during development
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin static files)
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'production') return callback(null, true);
    if (allowedOrigins.some(o => (o instanceof RegExp ? o.test(origin) : o === origin))) {
      return callback(null, true);
    }
    return callback(null, true); // Safe fallback to allow deployed frontend
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));           // parse JSON bodies
app.use(express.urlencoded({ extended: true }));    // parse form bodies

/* ── Static: serve the frontend ─────────────────────────────────────────── */
// Students can open http://localhost:5000 to reach the frontend directly.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

/* ── Health endpoint ─────────────────────────────────────────────────────── */
/**
 * GET /api/health
 * Returns server status, uptime, and database connection state.
 * Used by the test script and can be used by any monitoring tool.
 */
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');

  // Mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  const dbState  = dbStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status:    'ok',
    service:   'CareerSetu API',
    version:   '1.0.0',
    phase:     'Phase 1 — Backend Foundation',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()) + 's',
    database: {
      state: dbState,
      host:  mongoose.connection.host || null
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

/* ── API routes ─────────────────────────────────────────────────────────── */

// Phase 2: Authentication
app.use('/api/auth', require('./routes/authRoutes'));

// Phase 3: Student Data & Profile Persistence
app.use('/api/student', require('./routes/studentRoutes'));

// Phase 4: Groq AI Career Guidance
app.use('/api/ai', require('./routes/aiRoutes'));

// Phase 5: app.use('/api/admin',   require('./routes/adminRoutes'));

/* ── 404 handler for unknown API routes ─────────────────────────────────── */
app.use('/api', (req, res) => {
  res.status(404).json({
    status:  'error',
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

/* ── Catch-all: serve index.html for frontend navigation ─────────────────── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

/* ── Global error handler ────────────────────────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(err.status || 500).json({
    status:  'error',
    message: process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred.'
      : err.message
  });
});

/* ── Boot sequence ───────────────────────────────────────────────────────── */
async function start() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     CareerSetu Backend — Phase 1         ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`[Server] Node.js ${process.version}  |  ENV: ${process.env.NODE_ENV || 'development'}`);

  // Connect to MongoDB Atlas (or log warning if URI not configured yet)
  const connected = await connectDB();
  if (!connected) {
    console.log('[Server] ℹ️  Continuing startup without active database connection.');
  }

  const server = app.listen(PORT, () => {
    console.log(`[Server] ✅  Listening on http://localhost:${PORT}`);
    console.log(`[Server] 🩺  Health check: http://localhost:${PORT}/api/health`);
    console.log(`[Server] 🌐  Frontend:     http://localhost:${PORT}`);
    console.log('');
  });

  return server;
}

// Only launch listener when executed directly (not when required as a module in tests)
if (require.main === module) {
  start().catch((err) => {
    console.error('[Server] ❌  Failed to start:', err.message);
    process.exit(1);
  });
}

module.exports = { app, start };

