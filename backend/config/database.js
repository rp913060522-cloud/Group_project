/**
 * CareerSetu — MongoDB Atlas Connection
 * Uses Mongoose to connect to Atlas via MONGODB_URI in .env
 */

'use strict';

const dns = require('dns');
const mongoose = require('mongoose');

let listenersRegistered = false;
let retryTimer = null;

/**
 * Configure DNS servers for SRV resolution.
 * Fixes querySrv ECONNREFUSED when default local/ISP DNS fails to resolve SRV records.
 * Can be overridden via DNS_SERVERS env variable (e.g. DNS_SERVERS=8.8.8.8,1.1.1.1,8.8.4.4).
 */
function configureDns() {
  const customServers = process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(',').map(s => s.trim()).filter(Boolean)
    : ['8.8.8.8', '1.1.1.1', '8.8.4.4'];

  try {
    dns.setServers(customServers);
  } catch (err) {
    console.warn('[DB] ⚠️  Could not set custom DNS servers:', err.message);
  }
}

/**
 * Register lifecycle listeners once to monitor connection health.
 */
function registerConnectionListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    console.log('[DB] 🟢 MongoDB connection active.');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[DB] ❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] 🟡 MongoDB connection disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[DB] 🔄 MongoDB reconnected to Atlas.');
  });
}

/**
 * Connect to MongoDB Atlas with adaptive timeout and safe diagnostic reporting.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('cluster0.example')) {
    console.warn('[DB] ⚠️  MONGODB_URI is not configured in .env (or contains template placeholders).');
    console.warn('[DB]    Copy .env.example to .env and configure your MongoDB Atlas connection string.');
    return false;
  }

  // Set public DNS servers for mongodb+srv:// lookup to prevent querySrv ECONNREFUSED
  if (uri.startsWith('mongodb+srv://')) {
    configureDns();
  }

  registerConnectionListeners();

  // Allow configurable timeout for slow connections / cloud cold starts (default 25s)
  const timeoutMs = process.env.MONGODB_TIMEOUT_MS
    ? parseInt(process.env.MONGODB_TIMEOUT_MS, 10)
    : 25000;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs,
      socketTimeoutMS: 45000,
    });

    console.log(`[DB] ✅  MongoDB Atlas connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    const hostMatch = uri.match(/@([^/?]+)/);
    const clusterHost = hostMatch ? hostMatch[1] : 'unknown-cluster';

    console.error(`[DB] ❌  MongoDB Atlas connection error: ${err.message}`);
    console.error(`[DB] 🔍  Target cluster: ${clusterHost}`);

    if (err.message.includes('Server selection timed out') || err.message.includes('buffering timed out')) {
      console.error('[DB] 💡  Diagnosis: Connection timed out reaching MongoDB Atlas.');
      console.error('      1. IP Whitelist: Ensure your current IP is added in MongoDB Atlas (Network Access).');
      console.error('      2. Outbound port: Ensure your router or firewall allows outbound TCP on port 27017.');
      console.error('      3. Network speed: You can set MONGODB_TIMEOUT_MS=30000 in .env for slower connections.');
    } else if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error('[DB] 💡  Diagnosis: Authentication failed. Verify your database username and password in MONGODB_URI.');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
      console.error('[DB] 💡  Diagnosis: DNS lookup failed. Check your internet connection or DNS settings.');
    }

    // Schedule a background reconnection attempt if running as server
    scheduleBackgroundReconnect();
    return false;
  }
}

/**
 * Attempt background reconnection without blocking application startup.
 */
function scheduleBackgroundReconnect(delayMs = 12000) {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(async () => {
    if (mongoose.connection.readyState === 0) {
      console.log('[DB] 🔄 Attempting background reconnection to MongoDB Atlas...');
      await connectDB();
    }
  }, delayMs);
  if (retryTimer.unref) {
    retryTimer.unref(); // Prevents keeping tests or short-lived CLI scripts awake
  }
}

/**
 * Check if database is currently connected (readyState === 1).
 */
function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

/**
 * Gracefully close the connection (used in tests and shutdown handlers).
 */
async function disconnectDB() {
  if (retryTimer) clearTimeout(retryTimer);
  await mongoose.connection.close();
  console.log('[DB] 🔌  MongoDB connection closed.');
}

module.exports = {
  connectDB,
  disconnectDB,
  isDbConnected
};
