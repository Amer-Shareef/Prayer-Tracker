require('dotenv').config();
const { pool } = require('../config/database');

async function verifyOtpSystem() {
  console.log('🔍 Verifying 4-Digit OTP System Configuration');
  console.log('===========================================');
  
  try {
    // Check database schema
    console.log('1. Checking database schema...');
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'otp_code'`,
      [process.env.DB_NAME]
    );

    if (columns.length > 0) {
      const column = columns[0];
      console.log(`   Database column: ${column.DATA_TYPE}(${column.CHARACTER_MAXIMUM_LENGTH})`);
      
      if (column.CHARACTER_MAXIMUM_LENGTH === 4) {
        console.log('   ✅ Database configured for 4-digit OTPs');
      } else {
        console.log('   ❌ Database still configured for 6-digit OTPs');
        console.log('   🔧 Run: node backend/scripts/updateOtpTo4Digits.js');
      }
    }

    // Test OTP generation
    console.log('\n2. Testing OTP generation...');
    const testOtp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log(`   Generated OTP: ${testOtp}`);
    console.log(`   Length: ${testOtp.length} characters`);
    console.log(`   ${testOtp.length === 4 ? '✅' : '❌'} Correct length`);
    
    // Check existing OTP codes
    console.log('\n3. Checking existing OTP codes...');
    const [existingOtps] = await pool.execute(
      'SELECT username, otp_code, LENGTH(otp_code) as otp_length FROM users WHERE otp_code IS NOT NULL'
    );
    
    if (existingOtps.length > 0) {
      console.log('   Found existing OTP codes:');
      existingOtps.forEach(user => {
        const status = user.otp_length === 4 ? '✅' : '❌';
        console.log(`   ${status} ${user.username}: "${user.otp_code}" (${user.otp_length} digits)`);
      });
    } else {
      console.log('   ✅ No existing OTP codes found');
    }

    console.log('\n🎉 OTP system verification completed!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await pool.end();
  }
}

verifyOtpSystem();
