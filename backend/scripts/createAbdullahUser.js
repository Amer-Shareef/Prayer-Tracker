require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

async function createAbdullahUser() {
  console.log('👤 Creating Abdullah Test User with Gmail');
  console.log('==========================================');
  
  try {
    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      ['abdullah', 'inshaf4online@gmail.com']
    );

    if (existingUsers.length > 0) {
      console.log('🔄 Updating existing Abdullah user with Gmail...');
      
      // Update existing user
      const hashedPassword = await bcrypt.hash('abc123', 10);
      
      await pool.execute(
        'UPDATE users SET email = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
        ['inshaf4online@gmail.com', hashedPassword, 'abdullah']
      );
      
      console.log('✅ Abdullah user updated successfully!');
    } else {
      console.log('📝 Creating new Abdullah user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('abc123', 10);

      // Create user
      const [result] = await pool.execute(
        `INSERT INTO users (username, email, password, role, status, joined_date, mosque_id)
         VALUES (?, ?, ?, ?, ?, CURDATE(), ?)`,
        ['abdullah', 'inshaf4online@gmail.com', hashedPassword, 'Member', 'active', 1]
      );

      console.log('✅ Abdullah user created successfully!');
      console.log(`   User ID: ${result.insertId}`);
    }
    
    console.log('');
    console.log('📋 User Details:');
    console.log('   Username: abdullah');
    console.log('   Email: inshaf4online@gmail.com');
    console.log('   Password: abc123');
    console.log('   Role: Member');
    
    console.log('');
    console.log('🧪 Test Instructions:');
    console.log('1. Make sure Gmail SMTP is configured in .env');
    console.log('2. Start the application: npm start');
    console.log('3. Login with:');
    console.log('   Username: abdullah');
    console.log('   Password: abc123');
    console.log('4. Check inshaf4online@gmail.com for 4-digit OTP email');
    console.log('5. Enter the 4-digit OTP to complete login');

  } catch (error) {
    console.error('❌ Failed to create/update Abdullah user:', error.message);
  } finally {
    await pool.end();
  }
}

createAbdullahUser();
