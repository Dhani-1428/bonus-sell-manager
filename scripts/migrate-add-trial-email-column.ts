/**
 * Migration script to add trial_expiration_email_sent column to users table
 * Run this after deploying to ensure the column exists
 */

import { query } from '../lib/db';

async function migrate() {
  try {
    console.log('🔄 Starting migration: Add trial_expiration_email_sent column...');
    
    // Check if column exists
    const [columns] = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'trial_expiration_email_sent'
    `) as any[];
    
    if (columns.length > 0) {
      console.log('✅ Column trial_expiration_email_sent already exists');
      return;
    }
    
    // Add column
    await query(`
      ALTER TABLE users 
      ADD COLUMN trial_expiration_email_sent BOOLEAN DEFAULT FALSE
    `);
    
    console.log('✅ Successfully added trial_expiration_email_sent column');
    console.log('✅ Migration completed successfully');
  } catch (error: any) {
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ Column already exists (duplicate error)');
    } else {
      console.error('❌ Migration error:', error);
      throw error;
    }
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
