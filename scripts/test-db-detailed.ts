/**
 * Detailed database connection test script
 * Tests connection with various configurations
 */

import mysql from 'mysql2/promise';
import * as dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

async function testDNSResolution(hostname: string): Promise<void> {
  console.log(`\n🔍 Testing DNS resolution for: ${hostname}`);
  try {
    const result = await dnsLookup(hostname);
    console.log(`✅ DNS resolved: ${hostname} → ${result.address}`);
  } catch (error: any) {
    console.error(`❌ DNS resolution failed: ${error.message}`);
    throw error;
  }
}

async function testPortConnection(hostname: string, port: number): Promise<void> {
  console.log(`\n🔍 Testing port connectivity: ${hostname}:${port}`);
  try {
    const net = await import('net');
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = 5000;
      
      socket.setTimeout(timeout);
      socket.once('connect', () => {
        console.log(`✅ Port ${port} is open and accepting connections`);
        socket.destroy();
        resolve();
      });
      
      socket.once('timeout', () => {
        socket.destroy();
        reject(new Error(`Connection timeout after ${timeout}ms`));
      });
      
      socket.once('error', (err: Error) => {
        socket.destroy();
        reject(err);
      });
      
      socket.connect(port, hostname);
    });
  } catch (error: any) {
    console.error(`❌ Port connection failed: ${error.message}`);
    throw error;
  }
}

async function testMySQLConnection(config: mysql.PoolOptions, testName: string): Promise<boolean> {
  console.log(`\n🔍 Testing MySQL connection: ${testName}`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   User: ${config.user}`);
  console.log(`   SSL: ${config.ssl ? 'Enabled' : 'Disabled'}`);
  
  let connection: mysql.PoolConnection | null = null;
  
  try {
    const pool = mysql.createPool(config);
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute('SELECT VERSION() AS v, DATABASE() AS db, USER() AS user');
    const result = rows as any[];
    
    console.log(`✅ Connection successful!`);
    console.log(`   Database version: ${result[0]?.v}`);
    console.log(`   Current database: ${result[0]?.db || 'Not selected'}`);
    console.log(`   Current user: ${result[0]?.user}`);
    
    await pool.end();
    return true;
  } catch (error: any) {
    console.error(`❌ Connection failed: ${error.message}`);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.errno) {
      console.error(`   Error number: ${error.errno}`);
    }
    if (error.sqlState) {
      console.error(`   SQL State: ${error.sqlState}`);
    }
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function main() {
  const hostname = process.env.DB_HOST || 'foodsell.cluster-ctu4682g825l.eu-north-1.rds.amazonaws.com';
  const port = parseInt(process.env.DB_PORT || '3306');
  const database = process.env.DB_NAME || 'foodsell_manager';
  const user = process.env.DB_USER || 'bfsmanager';
  const password = process.env.DB_PASSWORD || 'Dhani1428';
  
  console.log('='.repeat(60));
  console.log('DATABASE CONNECTION DETAILED TEST');
  console.log('='.repeat(60));
  console.log(`\nConfiguration:`);
  console.log(`  Host: ${hostname}`);
  console.log(`  Port: ${port}`);
  console.log(`  Database: ${database}`);
  console.log(`  User: ${user}`);
  console.log(`  Password: ${password.substring(0, 4)}****`);
  
  try {
    // Step 1: Test DNS resolution
    await testDNSResolution(hostname);
    
    // Step 2: Test port connectivity
    try {
      await testPortConnection(hostname, port);
    } catch (error: any) {
      console.error(`\n⚠️  Port connectivity test failed. This might indicate:`);
      console.error(`   - Firewall blocking port ${port}`);
      console.error(`   - Security group not allowing inbound connections`);
      console.error(`   - RDS instance not publicly accessible`);
      console.error(`\nContinuing with MySQL connection test anyway...\n`);
    }
    
    // Step 3: Test MySQL connection WITHOUT SSL first
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Connection WITHOUT SSL');
    console.log('='.repeat(60));
    const test1Success = await testMySQLConnection({
      host: hostname,
      port: port,
      database: database,
      user: user,
      password: password,
      ssl: false,
      connectTimeout: 10000,
    }, 'Without SSL');
    
    // Step 4: Test MySQL connection WITH SSL
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Connection WITH SSL (rejectUnauthorized: false)');
    console.log('='.repeat(60));
    const test2Success = await testMySQLConnection({
      host: hostname,
      port: port,
      database: database,
      user: user,
      password: password,
      ssl: {
        rejectUnauthorized: false,
      },
      connectTimeout: 10000,
    }, 'With SSL (no cert verification)');
    
    // Step 5: Test MySQL connection WITH SSL and certificate (if available)
    const certPath = process.env.DB_SSL_CERT_PATH;
    if (certPath) {
      console.log('\n' + '='.repeat(60));
      console.log('TEST 3: Connection WITH SSL and Certificate');
      console.log('='.repeat(60));
      const fs = await import('fs');
      if (fs.existsSync(certPath)) {
        await testMySQLConnection({
          host: hostname,
          port: port,
          database: database,
          user: user,
          password: password,
          ssl: {
            rejectUnauthorized: false,
            ca: fs.readFileSync(certPath),
          },
          connectTimeout: 10000,
        }, 'With SSL and Certificate');
      } else {
        console.log(`⚠️  Certificate file not found: ${certPath}`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    if (test1Success || test2Success) {
      console.log('✅ At least one connection method succeeded!');
      console.log(`   Without SSL: ${test1Success ? '✅' : '❌'}`);
      console.log(`   With SSL: ${test2Success ? '✅' : '❌'}`);
    } else {
      console.log('❌ All connection attempts failed');
      console.log('\nTroubleshooting steps:');
      console.log('1. Verify RDS instance is running in AWS Console');
      console.log('2. Check if instance is publicly accessible');
      console.log('3. Verify security group allows inbound on port 3306');
      console.log('4. Check if your IP is whitelisted in security group');
      console.log('5. Verify database credentials are correct');
      console.log('6. Check AWS RDS logs for connection errors');
    }
    
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main().catch(console.error);
