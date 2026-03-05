/**
 * Complete setup script for Google OAuth
 * This script:
 * 1. Checks database connection
 * 2. Initializes/updates database schema
 * 3. Adds google_id and avatar columns if needed
 * 4. Verifies everything is ready
 * 
 * Run with: npx tsx scripts/setup-google-auth.ts
 */

import { getPool, testConnection } from '../lib/db';
import { initializeSchema } from '../lib/db-schema';

async function setupGoogleAuth() {
  console.log('🚀 Starting Google OAuth Setup...\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Test database connection
    console.log('\n📡 Step 1: Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Database connection failed!');
      console.error('Please check your database credentials in .env file');
      process.exit(1);
    }
    console.log('✅ Database connection successful!\n');

    // Step 2: Initialize/Update database schema
    console.log('📊 Step 2: Initializing database schema...');
    try {
      await initializeSchema();
      console.log('✅ Database schema initialized/updated successfully!\n');
    } catch (error: any) {
      console.error('❌ Error initializing schema:', error.message);
      if (error.message.includes("doesn't exist")) {
        console.error('\n⚠️  Database may not exist. Please create it first:');
        console.error(`   CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'foodsell_manager'}\`;`);
      }
      throw error;
    }

    // Step 3: Verify google_id and avatar columns exist
    console.log('🔍 Step 3: Verifying Google OAuth columns...');
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'users' 
         AND COLUMN_NAME IN ('google_id', 'avatar')`
      ) as any[];

      const existingColumns = columns.map((col: any) => col.COLUMN_NAME);
      const hasGoogleId = existingColumns.includes('google_id');
      const hasAvatar = existingColumns.includes('avatar');

      if (hasGoogleId && hasAvatar) {
        console.log('✅ google_id and avatar columns exist');
      } else {
        console.log('⚠️  Missing columns detected. Adding them...');
        
        await connection.beginTransaction();

        if (!hasGoogleId) {
          await connection.query(`
            ALTER TABLE users 
            ADD COLUMN google_id VARCHAR(255) UNIQUE
          `);
          console.log('✅ Added google_id column');
        }

        if (!hasAvatar) {
          await connection.query(`
            ALTER TABLE users 
            ADD COLUMN avatar VARCHAR(500)
          `);
          console.log('✅ Added avatar column');
        }

        // Add index for google_id
        try {
          await connection.query(`
            CREATE INDEX idx_google_id ON users(google_id)
          `);
          console.log('✅ Added index for google_id');
        } catch (error: any) {
          if (error.code === 'ER_DUP_KEYNAME') {
            console.log('ℹ️  Index idx_google_id already exists');
          } else {
            throw error;
          }
        }

        await connection.commit();
        console.log('✅ Columns added successfully!\n');
      }
    } catch (error: any) {
      await connection.rollback();
      console.error('❌ Error verifying/adding columns:', error.message);
      throw error;
    } finally {
      connection.release();
    }

    // Step 4: Verify environment variables
    console.log('🔐 Step 4: Checking environment variables...');
    const requiredVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'NEXT_PUBLIC_APP_URL',
    ];

    const missingVars: string[] = [];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      console.warn('⚠️  Missing environment variables:');
      missingVars.forEach(v => console.warn(`   - ${v}`));
      console.warn('\nPlease add these to your .env file and Vercel environment variables\n');
    } else {
      console.log('✅ All required environment variables are set\n');
    }

    // Step 5: Summary
    console.log('='.repeat(60));
    console.log('✅ Google OAuth Setup Complete!');
    console.log('='.repeat(60));
    console.log('\n📝 Next Steps:');
    console.log('1. Ensure environment variables are set in Vercel:');
    console.log('   - GOOGLE_CLIENT_ID');
    console.log('   - GOOGLE_CLIENT_SECRET');
    console.log('   - NEXT_PUBLIC_APP_URL');
    console.log('   - GOOGLE_REDIRECT_URI (optional)');
    console.log('\n2. Redeploy your application on Vercel');
    console.log('\n3. Test Google login at: https://bonusfoodsellmanager.com');
    console.log('\n🎉 Setup complete! Google OAuth is ready to use.\n');

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    const pool = getPool();
    await pool.end();
  }
}

setupGoogleAuth().catch(console.error);
