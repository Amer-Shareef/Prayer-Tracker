const axios = require('axios');

async function testLogin() {
  console.log('🧪 Testing Backend Login API...');
  
  try {
    // Test the login endpoint
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'testfounder',
      password: 'password123'
    });
    
    console.log('✅ LOGIN SUCCESS!');
    console.log('Response:', response.data);
    console.log('Token received:', response.data.token ? 'YES' : 'NO');
    console.log('User role:', response.data.user?.role);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ LOGIN FAILED');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('❌ CONNECTION FAILED');
      console.log('Error:', error.message);
      console.log('Make sure backend server is running on port 5000');
    }
  }
}

// Test with wrong credentials too
async function testWrongLogin() {
  console.log('\n🧪 Testing Wrong Credentials...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'wrong',
      password: 'wrong'
    });
    
    console.log('❌ This should have failed!');
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ CORRECTLY REJECTED wrong credentials');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

async function runTests() {
  console.log('Starting Backend Login Tests...');
  console.log('Make sure your backend server is running (npm start)');
  console.log('='.repeat(50));
  
  await testLogin();
  await testWrongLogin();
  
  console.log('\n' + '='.repeat(50));
  console.log('Backend test completed!');
}

runTests();
