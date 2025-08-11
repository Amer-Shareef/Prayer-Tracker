const { pool } = require('../config/database');

async function checkFeedsTable() {
  try {
    console.log('🔧 Checking feeds table constraints...');
    
    // First, let's see the current table structure
    const [columns] = await pool.execute('DESCRIBE feeds');
    console.log('📋 Current feeds table structure:');
    columns.forEach(col => console.log(`  - ${col.Field}: ${col.Type}`));
    
    // Check for foreign key constraints
    const [constraints] = await pool.execute(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'db_fajr_app' 
      AND TABLE_NAME = 'feeds' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log('🔗 Current foreign key constraints:');
    constraints.forEach(c => console.log(`  - ${c.CONSTRAINT_NAME}: ${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkFeedsTable();
