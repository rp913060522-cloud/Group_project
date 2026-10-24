/**
 * CareerSetu — MongoDB Atlas Diagnostic Utility
 * Safely tests DNS, TCP, TLS, and Atlas authentication without exposing credentials.
 *
 * Usage:
 *   node backend/scripts/diagnoseDb.js
 */

'use strict';

const path = require('path');
const dns = require('dns');
const net = require('net');
const mongoose = require('mongoose');

// Load .env from project root
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function runDiagnostics() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           CareerSetu — MongoDB Atlas Diagnostic Tool             ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const uri = process.env.MONGODB_URI;

  // 1. Check URI presence & formatting
  if (!uri) {
    console.error('❌ Step 1 [Config]: MONGODB_URI is MISSING in .env file.');
    console.error('   Please add MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/careersetu to your .env');
    process.exit(1);
  }

  const isSrv = uri.startsWith('mongodb+srv://');
  const isStandard = uri.startsWith('mongodb://');

  if (!isSrv && !isStandard) {
    console.error('❌ Step 1 [Config]: MONGODB_URI does not start with mongodb+srv:// or mongodb://');
    process.exit(1);
  }

  const hostMatch = uri.match(/@([^/?]+)/);
  const clusterHost = hostMatch ? hostMatch[1] : 'unknown-cluster';
  console.log(`✅ Step 1 [Config]: MONGODB_URI detected.`);
  console.log(`   Protocol: ${isSrv ? 'mongodb+srv:// (SRV)' : 'mongodb://'}`);
  console.log(`   Cluster Host: ${clusterHost}\n`);

  // 2. DNS Resolution Test
  console.log('⏳ Step 2 [DNS]: Testing SRV & A-record resolution...');
  const dnsServers = ['8.8.8.8', '1.1.1.1', '8.8.4.4'];
  let shardAddresses = [];

  if (isSrv) {
    const srvRecord = `_mongodb._tcp.${clusterHost}`;
    try {
      const resolver = new dns.Resolver();
      resolver.setServers(dnsServers);
      shardAddresses = await new Promise((resolve, reject) => {
        resolver.resolveSrv(srvRecord, (err, addrs) => {
          if (err) return reject(err);
          resolve(addrs);
        });
      });
      console.log(`✅ Step 2 [DNS]: SRV resolved successfully via public DNS.`);
      console.log(`   Found ${shardAddresses.length} Atlas replica set members:`);
      shardAddresses.forEach((s, idx) => {
        console.log(`     [Shard ${idx + 1}] ${s.name}:${s.port}`);
      });
    } catch (dnsErr) {
      console.error(`❌ Step 2 [DNS]: SRV lookup failed for ${srvRecord}:`, dnsErr.message);
      console.error('   💡 Diagnosis: Your local network or ISP may be blocking DNS SRV queries.');
      console.error('      Make sure your machine can reach 8.8.8.8 / 1.1.1.1 on UDP port 53.');
      process.exit(1);
    }
  } else {
    console.log('   (Standard connection string; skipping SRV lookup)');
  }

  // 3. TCP Connectivity Test to Shards on Port 27017
  console.log('\n⏳ Step 3 [TCP]: Testing direct network access to port 27017...');
  if (shardAddresses.length > 0) {
    const primaryShard = shardAddresses[0];
    const tcpSuccess = await new Promise((resolve) => {
      const socket = net.createConnection(primaryShard.port, primaryShard.name, () => {
        socket.destroy();
        resolve(true);
      });
      socket.setTimeout(8000);
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        resolve(false);
      });
    });

    if (tcpSuccess) {
      console.log(`✅ Step 3 [TCP]: Direct connection to ${primaryShard.name}:${primaryShard.port} SUCCEEDED.`);
      console.log('   Port 27017 is open and outbound traffic is allowed.');
    } else {
      console.error(`❌ Step 3 [TCP]: Connection timed out or refused to ${primaryShard.name}:${primaryShard.port}.`);
      console.error('   💡 Diagnosis: Atlas Network Access (IP Whitelist) is blocking your connection.');
      console.error('      1. Open MongoDB Atlas (https://cloud.mongodb.com).');
      console.error('      2. Go to "Network Access" in the sidebar.');
      console.error('      3. Click "Add IP Address" -> Select "Allow Access From Anywhere" (0.0.0.0/0) or "Add Current IP".');
      console.error('      4. Wait 1-2 minutes for Atlas to deploy the network change.');
      process.exit(1);
    }
  }

  // 4. Mongoose Atlas Connection & TLS Handshake
  console.log('\n⏳ Step 4 [Mongoose & TLS]: Connecting to MongoDB Atlas...');
  try {
    dns.setServers(dnsServers);
    const startConn = Date.now();
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });
    const connDuration = Date.now() - startConn;
    console.log(`✅ Step 4 [Mongoose & TLS]: Connected in ${connDuration}ms!`);
    console.log(`   Connected Host: ${conn.connection.host}`);
    console.log(`   Ready State: ${conn.connection.readyState} (1 = connected)`);

    // 5. Database Ping
    console.log('\n⏳ Step 5 [Ping]: Executing database admin ping...');
    const adminDb = conn.connection.db.admin();
    const pingResult = await adminDb.ping();
    console.log('✅ Step 5 [Ping]: Atlas responded with:', JSON.stringify(pingResult));

    console.log('\n──────────────────────────────────────────────────────────────────');
    console.log('🎉 MongoDB Atlas is 100% HEALTHY and REACHABLE from your system!');
    console.log('──────────────────────────────────────────────────────────────────\n');
  } catch (mongoErr) {
    console.error('\n❌ Step 4 [Mongoose & TLS]: Connection failed:', mongoErr.message);
    if (mongoErr.message.includes('Server selection timed out')) {
      console.error('   💡 Diagnosis: Server selection timed out.');
      console.error('      • Your IP address is not whitelisted in MongoDB Atlas Network Access.');
      console.error('      • Or internet latency between your network and Atlas exceeded the timeout.');
    } else if (mongoErr.message.includes('Authentication failed') || mongoErr.message.includes('bad auth')) {
      console.error('   💡 Diagnosis: Database username or password in MONGODB_URI is incorrect.');
    }
  } finally {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🔌 Connection closed cleanly.\n');
    }
  }
}

runDiagnostics();
