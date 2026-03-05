/**
 * Migration script to add google_id and avatar fields to users table
 * Run with: npx tsx scripts/migrate-add-google-fields.ts
 */

import { getPool } from '../lib/db';

async function migrate() {
  console.log('Starting migration: Adding google_id and avatar fields...\n');

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    // Check if columns already exist
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
      console.log('✅ Columns google_id and avatar already exist. Migration not needed.');
      return;
    }

    await connection.beginTransaction();

    // Add google_id column if it doesn't exist
    if (!hasGoogleId) {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN google_id VARCHAR(255) UNIQUE
      `);
      console.log('✅ Added google_id column');
    }

    // Add avatar column if it doesn't exist
    if (!hasAvatar) {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN avatar VARCHAR(500)
      `);
      console.log('✅ Added avatar column');
    }

    // Add index for google_id if it doesn't exist
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
    console.log('\n✅ Migration completed successfully!');
  } catch (error: any) {
    await connection.rollback();
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

migrate().catch(console.error);
