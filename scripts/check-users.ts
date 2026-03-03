import { getPool, query, closePool } from '../lib/db';

async function main() {
  console.log('Checking users in database...\n');

  try {
    const dbName = process.env.DB_NAME || 'foodsell_manager';
    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.query(`USE \`${dbName}\``);
      console.log(`Using database: ${dbName}\n`);

      // Check if users table exists
      const tables = await query<{ Table_in_foodsell_manager: string }>('SHOW TABLES');
      const tableNames = tables.map(row => row.Table_in_foodsell_manager);

      if (!tableNames.includes('users')) {
        console.error('❌ Users table does not exist! Please run schema initialization.');
        process.exit(1);
      }

      // Get all users
      const users = await query<{
        id: string;
        name: string;
        email: string;
        created_at: Date;
        subscription_status: string;
        trial_start_date: Date | null;
      }>('SELECT id, name, email, created_at, subscription_status, trial_start_date FROM users ORDER BY created_at DESC');

      console.log(`Found ${users.length} user(s) in database:\n`);

      if (users.length === 0) {
        console.log('⚠️  No users found in database.');
        console.log('\nPossible reasons:');
        console.log('1. Webhook is not configured in Clerk Dashboard');
        console.log('2. Webhook endpoint is not accessible');
        console.log('3. Environment variables are not set in production');
        console.log('4. Webhook failed silently');
      } else {
        users.forEach((user, index) => {
          console.log(`${index + 1}. User:`);
          console.log(`   ID: ${user.id}`);
          console.log(`   Name: ${user.name}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Created: ${user.created_at}`);
          console.log(`   Status: ${user.subscription_status}`);
          console.log(`   Trial Start: ${user.trial_start_date || 'N/A'}`);
          console.log('');
        });
      }

      // Check restaurant_settings
      const settings = await query<{ user_id: string; name: string }>(
        'SELECT user_id, name FROM restaurant_settings'
      );
      console.log(`Found ${settings.length} restaurant setting(s)\n`);

    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('❌ Error checking users:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
