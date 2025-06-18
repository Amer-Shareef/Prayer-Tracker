require('dotenv').config();

console.log('🧪 Environment Variable Test');
console.log('============================');
console.log('');

const envVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT', 'HOST', 'PORT'];

envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}:`);
  console.log(`  Value: "${value}"`);
  console.log(`  Length: ${value?.length || 0}`);
  console.log(`  Type: ${typeof value}`);
  
  if (value) {
    const hasSpecialChars = /[\r\n\t\u0000-\u001f\u007f-\u009f]/.test(value);
    console.log(`  Has hidden chars: ${hasSpecialChars}`);
    
    const charCodes = value.split('').map(char => char.charCodeAt(0));
    console.log(`  Char codes: [${charCodes.join(', ')}]`);
  }
  console.log('');
});

// Test direct connection with environment variables
console.log('🔄 Testing with environment variables...');
const mysql = require('mysql2/promise');

async function testWithEnv() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 30000
    });
    
    console.log('✅ Environment-based connection successful!');
    await connection.end();
  } catch (error) {
    console.log('❌ Environment-based connection failed:', error.message);
  }
}

testWithEnv();
