require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateMemberSchema() {
  console.log('🔧 Updating Member Schema for Comprehensive Data');
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

    // Check existing columns
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
      [process.env.DB_NAME]
    );
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    // Add new columns if they don't exist
    const newColumns = [
      { name: 'full_name', type: 'VARCHAR(100)', description: 'Full name of member' },
      { name: 'date_of_birth', type: 'DATE', description: 'Date of birth' },
      { name: 'address', type: 'TEXT', description: 'Full address' },
      { name: 'area', type: 'VARCHAR(100)', description: 'Area/District' },
      { name: 'mobility', type: 'VARCHAR(50)', description: 'How they travel to mosque' },
      { name: 'living_on_rent', type: 'BOOLEAN DEFAULT FALSE', description: 'Living on rent' },
      { name: 'zakath_eligible', type: 'BOOLEAN DEFAULT FALSE', description: 'Zakath eligible' },
      { name: 'differently_abled', type: 'BOOLEAN DEFAULT FALSE', description: 'Differently abled' },
      { name: 'muallafathil_quloob', type: 'BOOLEAN DEFAULT FALSE', description: 'Muallafathil Quloob (Convert)' }
    ];

    for (const column of newColumns) {
      if (!existingColumns.includes(column.name)) {
        console.log(`🔄 Adding ${column.name} column...`);
        await connection.execute(
          `ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`
        );
        console.log(`✅ Added ${column.name} - ${column.description}`);
      } else {
        console.log(`✅ ${column.name} column already exists`);
      }
    }

    console.log('\n📋 Updated users table structure:');
    const [finalStructure] = await connection.execute('DESCRIBE users');
    finalStructure.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    await connection.end();
    console.log('\n🎉 Member schema update completed!');

  } catch (error) {
    console.error('❌ Schema update failed:', error.message);
    process.exit(1);
  }
}

updateMemberSchema();
