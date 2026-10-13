/**
 * CareerSetu — MongoDB Atlas Connection
 * Uses Mongoose to connect to Atlas via MONGODB_URI in .env
 */

const dns = require('dns');
const mongoose = require('mongoose');

/**
 * Configure DNS servers for SRV resolution.
 * Fixes querySrv ECONNREFUSED when default local/ISP DNS fails to resolve SRV records.
 * Can be overridden via DNS_SERVERS env variable (e.g. DNS_SERVERS=1.1.1.1,8.8.8.8).
 */
function configureDns() {
  const customServers = process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(',').map(s => s.trim()).filter(Boolean)
    : ['1.1.1.1', '8.8.8.8'];

  try {
    dns.setServers(customServers);
  } catch (err) {
    console.warn('[DB] ⚠️  Could not set custom DNS servers:', err.message);
  }
}

/**
 * Connect to MongoDB Atlas.
 * Exits the process if the connection fails at startup.
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

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });

    console.log(`[DB] ✅  MongoDB Atlas connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.error('[DB] ❌  MongoDB Atlas connection error:', err.message);
    return false;
  }
}

/**
 * Gracefully close the connection (used in tests and shutdown handlers).
 */
async function disconnectDB() {
  await mongoose.connection.close();
  console.log('[DB] 🔌  MongoDB connection closed.');
}

module.exports = { connectDB, disconnectDB };
