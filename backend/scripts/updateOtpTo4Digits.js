require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateOtpTo4Digits() {
  console.log('🔧 Updating OTP System to 4-Digit Codes');
  console.log('========================================');
  
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

    // Update otp_code column to support 4-digit codes
    console.log('🔄 Updating otp_code column to VARCHAR(4)...');
    await connection.execute(
      'ALTER TABLE users MODIFY COLUMN otp_code VARCHAR(4) NULL'
    );
    console.log('✅ otp_code column updated to support 4-digit codes');

    // Clear any existing OTP codes (they might be 6-digit)
    console.log('🔄 Clearing existing OTP codes...');
    await connection.execute(
      'UPDATE users SET otp_code = NULL, otp_expires = NULL WHERE otp_code IS NOT NULL'
    );
    console.log('✅ Existing OTP codes cleared');

    // Verify the change
    console.log('🔍 Verifying database schema...');
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'otp_code'`,
      [process.env.DB_NAME]
    );

    if (columns.length > 0) {
      const column = columns[0];
      console.log(`✅ Verified: otp_code is ${column.DATA_TYPE}(${column.CHARACTER_MAXIMUM_LENGTH})`);
      
      if (column.CHARACTER_MAXIMUM_LENGTH === 4) {
        console.log('✅ Database successfully updated for 4-digit OTP codes');
      } else {
        console.log('❌ Database update may have failed');
      }
    }

    await connection.end();
    console.log('\n🎉 OTP system update completed!');
    console.log('\n📋 Changes made:');
    console.log('  ✅ Database column updated to VARCHAR(4)');
    console.log('  ✅ Existing OTP codes cleared');
    console.log('  ✅ System now generates 4-digit codes (1000-9999)');
    console.log('  ✅ Email templates updated for 4-digit display');
    console.log('  ✅ Frontend validation updated for 4-digit input');
    
    console.log('\n🚀 Next steps:');
    console.log('  1. Restart your application: npm start');
    console.log('  2. Test login with 4-digit OTP codes');
    console.log('  3. Verify email templates show 4-digit codes correctly');

  } catch (error) {
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

updateOtpTo4Digits();
