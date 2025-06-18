require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabase() {
  console.log('🧪 Testing db_fajr_app database...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000
    });

    console.log('✅ Connected successfully to db_fajr_app!');

    // First, check what databases exist
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('📊 Available databases:', databases.map(db => db.Database));

    // Check if our database exists
    const dbExists = databases.some(db => db.Database === 'db_fajr_app');
    if (!dbExists) {
      console.log('❌ Database db_fajr_app does not exist!');
      console.log('💡 Tell boss to create: CREATE DATABASE db_fajr_app;');
      await connection.end();
      return;
    }

    // Test the users table
    try {
      const [users] = await connection.execute('SELECT * FROM users');
      console.log('✅ Users found:', users);
    } catch (tableError) {
      if (tableError.code === 'ER_NO_SUCH_TABLE') {
        console.log('❌ Users table does not exist in db_fajr_app!');
        console.log('💡 Tell boss to run these commands in db_fajr_app:');
        console.log(`
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    role ENUM('Member', 'Founder', 'Admin') NOT NULL,
    password VARCHAR(255) NOT NULL
);

INSERT INTO users (username, role, password) VALUES 
('testmember', 'Member', 'password123'),
('testfounder', 'Founder', 'password123'),
('testadmin', 'Admin', 'password123');
        `);
      } else {
        console.error('❌ Table query failed:', tableError.message);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error code:', error.code);
  }
}

testDatabase();
