/**
 * Verify database schema
 */
import { query } from '../lib/db';
import { closePool } from '../lib/db';

async function main() {
  const { getPool } = await import('../lib/db');
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    console.log('Verifying database schema...\n');
    
    const dbName = process.env.DB_NAME || 'foodsell_manager';
    await connection.query(`USE \`${dbName}\``);
    console.log(`Using database: ${dbName}\n`);
    
    // Show tables
    const [tables] = await connection.query('SHOW TABLES') as any[];
    console.log('Tables in database:');
    tables.forEach(table => {
      console.log(`  ✅ ${table.Tables_in_foodsell_manager}`);
    });
    
    // Show table structures
    console.log('\nTable structures:');
    for (const table of tables) {
      const tableName = table[`Tables_in_${dbName}`];
      console.log(`\n📋 ${tableName}:`);
      const [columns] = await connection.query(`DESCRIBE \`${tableName}\``) as any[];
      columns.forEach((col: any) => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    }
    
    console.log('\n✅ Schema verification complete!');
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    connection.release();
    await closePool();
  }
}

main();
