require('dotenv').config();
const mysql = require('mysql2/promise');

async function runTest() {
  console.log('🧪 Testing Database Connection - FINAL FIX');
  console.log('==========================================');
  
  try {
    // Test with raw credentials first
    console.log('🔄 Testing raw connection...');
    const rawConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 30000
    });
    
    console.log('✅ Raw connection successful!');
    
    // Test simple query first
    console.log('🔄 Testing simple query...');
    const [simpleResult] = await rawConnection.execute('SELECT 1 as test');
    console.log('✅ Simple query successful:', simpleResult[0]);
    
    // Test query with NOW() function
    console.log('🔄 Testing NOW() function...');
    const [timeResult] = await rawConnection.execute('SELECT NOW() as server_time');
    console.log('✅ Time query successful:', timeResult[0]);
    
    // Check databases
    console.log('🔄 Checking databases...');
    const [databases] = await rawConnection.execute('SHOW DATABASES');
    console.log('📊 Available databases:', databases.map(db => db.Database));
    
    // Test table access
    console.log('🔄 Checking tables...');
    const [tables] = await rawConnection.execute('SHOW TABLES');
    console.log('📋 Tables in database:', tables.map(t => Object.values(t)[0]));
    
    // Test users table specifically
    console.log('🔄 Testing users table...');
    const [users] = await rawConnection.execute('SELECT id, username, role FROM users LIMIT 3');
    console.log('👥 Sample users:', users);
    
    await rawConnection.end();
    
    // Now test with the app's connection pool
    console.log('\n🔄 Testing with app configuration...');
    const { testConnection } = require('../config/database');
    const success = await testConnection();
    
    if (success) {
      console.log('\n🎉 All connection tests passed!');
      console.log('✅ Ready to start the application');
    } else {
      console.log('\n❌ App configuration test failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('Error Code:', error.code);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🚨 AUTHENTICATION FAILED:');
      console.log('Please check your database credentials in .env file');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🚨 HOST NOT FOUND:');
      console.log('Please check your database host in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n🚨 DATABASE NOT FOUND:');
      console.log('Please check your database name in .env file');
    } else if (error.code === 'ER_PARSE_ERROR') {
      console.log('\n🚨 SQL SYNTAX ERROR:');
      console.log('There is a SQL syntax issue in the query');
      console.log('Error SQL:', error.sql);
    } else {
      console.log('\n🚨 UNKNOWN ERROR:');
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
    }
    process.exit(1);
  }
}

// Run test and exit cleanly
runTest().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Test script error:', error);
  process.exit(1);
});
