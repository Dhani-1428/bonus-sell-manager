/**
 * Initialize database schema
 * Run with: npx tsx scripts/init-schema.ts
 */

import { initializeSchema } from '../lib/db-schema';
import { closePool } from '../lib/db';

async function main() {
  console.log('Initializing database schema...\n');
  
  try {
    await initializeSchema();
    console.log('\n✅ Database schema initialized successfully!');
    console.log('\nTables created:');
    console.log('  - users');
    console.log('  - menu_items');
    console.log('  - orders');
    console.log('  - restaurant_settings');
  } catch (error: any) {
    console.error('\n❌ Schema initialization failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await closePool();
  }
}

main().catch(console.error);
