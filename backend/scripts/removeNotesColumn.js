require('dotenv').config();
const mysql = require('mysql2/promise');

async function removeNotesColumn() {
  console.log('🗑️  Removing Notes Column from Daily Activities');
  console.log('===============================================');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000
    });

    console.log('✅ Connected to database');

    // Check if notes column exists
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'daily_activities' 
       AND COLUMN_NAME = 'notes'`,
      [process.env.DB_NAME]
    );

    if (columns.length > 0) {
      console.log('🗑️  Removing notes column from daily_activities table...');
      
      await connection.execute(
        'ALTER TABLE daily_activities DROP COLUMN notes'
      );
      
      console.log('✅ Notes column removed successfully');
    } else {
      console.log('ℹ️  Notes column does not exist - no action needed');
    }

    // Show current table structure
    console.log('\n📋 Current daily_activities table structure:');
    const [tableStructure] = await connection.execute(
      'DESCRIBE daily_activities'
    );
    
    tableStructure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    await connection.end();
    console.log('\n🎉 Notes column removal completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Removed notes column from database');
    console.log('   ✅ Simplified activity tracking');
    console.log('   ✅ Reduced database storage');

  } catch (error) {
    console.error('❌ Failed to remove notes column:', error.message);
    process.exit(1);
  }
}

removeNotesColumn();
