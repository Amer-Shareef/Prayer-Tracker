require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanDatabase() {
  console.log('🧹 Cleaning AWS RDS database...');
  
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

    console.log('✅ Connected to AWS RDS database');

    // Clean up all data but keep structure
    console.log('🗑️  Cleaning up existing data...');
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Clean tables in correct order
    await connection.execute('DELETE FROM pickup_requests');
    console.log('   ✅ Cleaned pickup_requests');
    
    await connection.execute('DELETE FROM announcements');
    console.log('   ✅ Cleaned announcements');
    
    await connection.execute('DELETE FROM prayers');
    console.log('   ✅ Cleaned prayers');
    
    await connection.execute('DELETE FROM users');
    console.log('   ✅ Cleaned users');
    
    await connection.execute('DELETE FROM mosques');
    console.log('   ✅ Cleaned mosques');
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // Reset auto increment
    await connection.execute('ALTER TABLE mosques AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE prayers AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE announcements AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE pickup_requests AUTO_INCREMENT = 1');
    
    console.log('✅ Database cleaned successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run seed-users');
    console.log('2. Start server: npm start');

    await connection.end();
  } catch (error) {
    console.error('❌ Database cleaning failed:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
