require('dotenv').config();
const mysql = require('mysql2/promise');

async function addOtpFields() {
  console.log('🔧 Adding OTP Fields to Users Table');
  console.log('===================================');
  
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
       AND COLUMN_NAME IN ('otp_code', 'otp_expires', 'otp_verified', 'login_attempts', 'account_locked_until')`,
      [process.env.DB_NAME]
    );

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (!existingColumns.includes('otp_code')) {
      console.log('🔄 Adding otp_code column...');
      await connection.execute(
        'ALTER TABLE users ADD COLUMN otp_code VARCHAR(4) NULL'
      );
      console.log('✅ otp_code column added');
    } else {
      console.log('✅ otp_code column already exists');
      
      // Update existing column to support 4-digit codes
      console.log('🔄 Updating otp_code column to VARCHAR(4)...');
      await connection.execute(
        'ALTER TABLE users MODIFY COLUMN otp_code VARCHAR(4) NULL'
      );
      console.log('✅ otp_code column updated to 4 digits');
    }

    if (!existingColumns.includes('otp_expires')) {
      console.log('🔄 Adding otp_expires column...');
      await connection.execute(
        'ALTER TABLE users ADD COLUMN otp_expires TIMESTAMP NULL'
      );
      console.log('✅ otp_expires column added');
    } else {
      console.log('✅ otp_expires column already exists');
    }

    if (!existingColumns.includes('otp_verified')) {
      console.log('🔄 Adding otp_verified column...');
      await connection.execute(
        'ALTER TABLE users ADD COLUMN otp_verified BOOLEAN DEFAULT FALSE'
      );
      console.log('✅ otp_verified column added');
    } else {
      console.log('✅ otp_verified column already exists');
    }

    if (!existingColumns.includes('login_attempts')) {
      console.log('🔄 Adding login_attempts column...');
      await connection.execute(
        'ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0'
      );
      console.log('✅ login_attempts column added');
    } else {
      console.log('✅ login_attempts column already exists');
    }

    if (!existingColumns.includes('account_locked_until')) {
      console.log('🔄 Adding account_locked_until column...');
      await connection.execute(
        'ALTER TABLE users ADD COLUMN account_locked_until TIMESTAMP NULL'
      );
      console.log('✅ account_locked_until column added');
    } else {
      console.log('✅ account_locked_until column already exists');
    }

    // Add indexes for better performance
    try {
      await connection.execute(
        'CREATE INDEX idx_otp_code ON users(otp_code)'
      );
      console.log('✅ Index created for otp_code');
    } catch (e) {
      console.log('ℹ️  Index for otp_code already exists');
    }

    await connection.end();
    console.log('🎉 OTP fields setup completed!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

addOtpFields();
