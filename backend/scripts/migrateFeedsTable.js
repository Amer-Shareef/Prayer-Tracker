const { pool } = require('../config/database');

async function migrateFeedsTable() {
  try {
    console.log('🔧 Starting feeds table migration...');
    
    // Step 1: Drop the old foreign key constraint
    console.log('📝 Step 1: Dropping old mosque_id foreign key constraint...');
    await pool.execute('ALTER TABLE feeds DROP FOREIGN KEY feeds_ibfk_2');
    console.log('✅ Dropped feeds_ibfk_2 constraint');
    
    // Step 2: Drop the mosque_id column
    console.log('📝 Step 2: Dropping mosque_id column...');
    await pool.execute('ALTER TABLE feeds DROP COLUMN mosque_id');
    console.log('✅ Dropped mosque_id column');
    
    // Step 3: Add foreign key constraint for area_id
    console.log('📝 Step 3: Adding area_id foreign key constraint...');
    await pool.execute(`
      ALTER TABLE feeds 
      ADD CONSTRAINT feeds_area_fk 
      FOREIGN KEY (area_id) REFERENCES areas(area_id) 
      ON DELETE CASCADE
    `);
    console.log('✅ Added area_id foreign key constraint');
    
    // Step 4: Verify the changes
    console.log('📝 Step 4: Verifying changes...');
    const [columns] = await pool.execute('DESCRIBE feeds');
    console.log('📋 Updated feeds table structure:');
    columns.forEach(col => console.log(`  - ${col.Field}: ${col.Type}`));
    
    const [constraints] = await pool.execute(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'db_fajr_app' 
      AND TABLE_NAME = 'feeds' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log('🔗 Updated foreign key constraints:');
    constraints.forEach(c => console.log(`  - ${c.CONSTRAINT_NAME}: ${c.COLUMN_NAME} -> ${c.REFERENCED_TABLE_NAME}.${c.REFERENCED_COLUMN_NAME}`));
    
    console.log('🎉 Feeds table migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    process.exit(0);
  }
}

migrateFeedsTable();
