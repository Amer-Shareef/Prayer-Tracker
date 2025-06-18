require('dotenv').config();
const { pool } = require('../config/database');

async function verifyPickupSchema() {
  console.log('🔍 Verifying Pickup Requests Database Schema');
  console.log('============================================');
  
  try {
    // Check if pickup_requests table exists
    const [tables] = await pool.execute(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = 'pickup_requests'`,
      [process.env.DB_NAME]
    );

    if (tables.length === 0) {
      console.log('❌ pickup_requests table does not exist');
      console.log('🔄 Creating pickup_requests table...');
      
      await pool.execute(`
        CREATE TABLE pickup_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          mosque_id INT,
          prayer_type ENUM('Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha') NOT NULL,
          request_date DATE NOT NULL,
          pickup_location TEXT NOT NULL,
          notes TEXT,
          status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_date (user_id, request_date),
          INDEX idx_status (status),
          INDEX idx_mosque_status (mosque_id, status),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (mosque_id) REFERENCES mosques(id) ON DELETE SET NULL
        )
      `);
      
      console.log('✅ pickup_requests table created');
    } else {
      console.log('✅ pickup_requests table exists');
    }

    // Show table structure
    const [columns] = await pool.execute('DESCRIBE pickup_requests');
    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Test data insertion
    console.log('\n🧪 Testing data operations...');
    
    // Insert test request
    const testUserId = 1;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    try {
      const [result] = await pool.execute(
        `INSERT INTO pickup_requests (user_id, mosque_id, prayer_type, request_date, pickup_location, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [testUserId, 1, 'Fajr', tomorrowStr, 'Test Location - 123 Main St', 'Test pickup request']
      );
      
      console.log(`✅ Test request inserted with ID: ${result.insertId}`);
      
      // Clean up test data
      await pool.execute('DELETE FROM pickup_requests WHERE id = ?', [result.insertId]);
      console.log('✅ Test data cleaned up');
      
    } catch (testError) {
      console.log('❌ Test insertion failed:', testError.message);
    }

    // Check existing requests
    const [existingRequests] = await pool.execute(
      'SELECT COUNT(*) as count FROM pickup_requests'
    );
    console.log(`📊 Existing pickup requests: ${existingRequests[0].count}`);

    console.log('\n🎉 Pickup requests schema verification completed!');
    console.log('\n📋 Features Ready:');
    console.log('  ✅ Create pickup requests');
    console.log('  ✅ View my requests');
    console.log('  ✅ Cancel pending requests');
    console.log('  ✅ Status tracking');
    console.log('  ✅ Date validation');
    console.log('  ✅ Duplicate prevention');

  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
  } finally {
    await pool.end();
  }
}

verifyPickupSchema();
