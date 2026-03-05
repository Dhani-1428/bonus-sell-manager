/**
 * Test database connection script
 * Run with: npx tsx scripts/test-db.ts
 */

import { testConnection, query } from '../lib/db';

async function main() {
  console.log('Testing database connection...\n');
  console.log('Connection details:');
  console.log(`  Host: ${process.env.DB_HOST || 'foodsell.cluster-ctu4682g825l.eu-north-1.rds.amazonaws.com'}`);
  console.log(`  Port: ${process.env.DB_PORT || '3306'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'foodsell_manager'}`);
  console.log(`  User: ${process.env.DB_USER || 'bfsmanager'}`);
  console.log(`  SSL: ${process.env.DB_SSL || 'true'}\n`);
  
  try {
    // Test basic connection
    const isConnected = await testConnection();
    
    if (isConnected) {
      console.log('\n✅ Database connection successful!\n');
      
      // Test a simple query
      console.log('Testing query execution...');
      const result = await query<{ v: string }>('SELECT VERSION() AS v');
      console.log('✅ Query executed successfully!');
      console.log('Database version:', result[0]?.v);
      
      // Test database name
      const dbResult = await query<{ db: string }>('SELECT DATABASE() AS db');
      console.log('Current database:', dbResult[0]?.db || 'Not selected');
      
      // Test current user
      const userResult = await query<{ user: string }>('SELECT USER() AS user');
      console.log('Current user:', userResult[0]?.user);
      
      console.log('\n✅ All tests passed! Database is ready to use.');
    } else {
      console.error('\n❌ Database connection failed!');
      console.error('\nTroubleshooting:');
      console.error('1. Verify RDS instance is running and publicly accessible');
      console.error('2. Check security group allows inbound connections on port 3306');
      console.error('3. Ensure your IP is whitelisted in security group');
      console.error('4. Verify credentials are correct');
      console.error('5. Check if SSL certificate is required');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Database test error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    // Close connection pool
    const { closePool } = await import('../lib/db');
    await closePool();
  }
}

main();
