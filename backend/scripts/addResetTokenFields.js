require('dotenv').config();
const mysql = require('mysql2/promise');

async function addResetTokenFields() {
  console.log('🔧 Adding Reset Token Fields to Users Table');
  console.log('============================================');
  
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

    // Check if columns already exist
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' 
       AND COLUMN_NAME IN ('reset_token', 'reset_expires')`,
      [process.env.DB_NAME]
    );

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (!existingColumns.includes('reset_token')) {
      console.log('🔄 Adding reset_token column...');
      await connection.execute(
        'ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL'
      );
      console.log('✅ reset_token column added');
    } else {
      console.log('✅ reset_token column already exists');
    }

    if (!existingColumns.includes('reset_expires')) {
      console.log('🔄 Adding reset_expires column...');
      await connection.execute(
        'ALTER TABLE users ADD COLUMN reset_expires TIMESTAMP NULL'
      );
      console.log('✅ reset_expires column added');
    } else {
      console.log('✅ reset_expires column already exists');
    }

    // Add index for better performance
    try {
      await connection.execute(
        'CREATE INDEX idx_reset_token ON users(reset_token)'
      );
      console.log('✅ Index created for reset_token');
    } catch (e) {
      console.log('ℹ️  Index for reset_token already exists');
    }

    await connection.end();
    console.log('🎉 Reset token fields setup completed!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

addResetTokenFields();
