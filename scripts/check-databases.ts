/**
 * Check available databases
 */
import { query } from '../lib/db';
import { closePool } from '../lib/db';

async function main() {
  try {
    console.log('Checking available databases...\n');
    
    // List all databases
    const databases = await query<{ Database: string }>('SHOW DATABASES');
    
    console.log('Available databases:');
    databases.forEach(db => {
      console.log(`  - ${db.Database}`);
    });
    
    // Check current database
    const currentDb = await query<{ db: string }>('SELECT DATABASE() AS db');
    console.log(`\nCurrent database: ${currentDb[0]?.db || 'None'}`);
    
    // Check user privileges
    const grants = await query<{ Grants: string }>('SHOW GRANTS');
    console.log('\nUser privileges:');
    grants.forEach(grant => {
      console.log(`  ${grant.Grants}`);
    });
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await closePool();
  }
}

main();
