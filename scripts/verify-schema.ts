/**
 * Verify database schema
 */
import { query } from '../lib/db';
import { closePool } from '../lib/db';

async function main() {
  try {
    console.log('Verifying database schema...\n');
    
    // Show tables
    const tables = await query<{ Tables_in_foodsell_manager: string }>('SHOW TABLES');
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.Tables_in_foodsell_manager}`);
    });
    
    // Show table structures
    console.log('\nTable structures:');
    for (const table of tables) {
      const tableName = table.Tables_in_foodsell_manager;
      console.log(`\n📋 ${tableName}:`);
      const columns = await query<any>(`DESCRIBE \`${tableName}\``);
      columns.forEach((col: any) => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    }
    
    console.log('\n✅ Schema verification complete!');
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await closePool();
  }
}

main();
