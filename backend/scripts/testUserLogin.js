require('dotenv').config();
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

async function testUserLogin() {
  console.log('🧪 Testing User Login System');
  console.log('============================');
  
  try {
    // Test 1: Check if users exist
    console.log('1. Checking test users...');
    const [users] = await pool.execute(
      'SELECT id, username, email, role, password FROM users WHERE username IN (?, ?, ?)',
      ['testmember', 'testfounder', 'testadmin']
    );
    
    console.log(`   Found ${users.length} test users:`);
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - Password hash length: ${user.password.length}`);
    });

    // Test 2: Test password verification
    console.log('\n2. Testing password verification...');
    for (const user of users) {
      try {
        const isValid = await bcrypt.compare('password123', user.password);
        console.log(`   ${user.username}: ${isValid ? '✅ Valid' : '❌ Invalid'} password`);
      } catch (err) {
        console.log(`   ${user.username}: ❌ Error verifying password - ${err.message}`);
      }
    }

    // Test 3: Test actual login endpoint simulation
    console.log('\n3. Testing login logic...');
    const testUsername = 'testmember';
    const testPassword = 'password123';
    
    const [loginUser] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [testUsername]
    );
    
    if (loginUser.length === 0) {
      console.log(`   ❌ User ${testUsername} not found`);
    } else {
      const user = loginUser[0];
      console.log(`   ✅ User found: ${user.username}`);
      
      const isValidPassword = await bcrypt.compare(testPassword, user.password);
      console.log(`   Password valid: ${isValidPassword ? '✅ Yes' : '❌ No'}`);
      
      if (isValidPassword) {
        console.log(`   ✅ Login would succeed for ${user.username}`);
      }
    }

    console.log('\n🎉 Login test completed!');

  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testUserLogin();
