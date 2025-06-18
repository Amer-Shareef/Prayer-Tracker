require('dotenv').config();
const { pool } = require('../config/database');

async function testPrayerRecording() {
  console.log('🧪 Testing Prayer Recording');
  console.log('============================');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const testUserId = 1; // testmember user ID
    
    // Test 1: Record a prayer
    console.log('1. Testing prayer recording...');
    
    const [result] = await pool.execute(
      `INSERT INTO prayers (user_id, mosque_id, prayer_type, prayer_date, status, location)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       location = VALUES(location),
       updated_at = CURRENT_TIMESTAMP`,
      [testUserId, 1, 'Fajr', today, 'prayed', 'mosque']
    );
    
    console.log(`   ✅ Prayer recorded with ID: ${result.insertId || 'updated existing'}`);

    // Test 2: Fetch prayers for today
    console.log('2. Testing prayer retrieval...');
    const [prayers] = await pool.execute(
      'SELECT * FROM prayers WHERE user_id = ? AND DATE(prayer_date) = DATE(?)',
      [testUserId, today]
    );
    
    console.log(`   ✅ Found ${prayers.length} prayers for today:`);
    prayers.forEach(p => {
      console.log(`   - ${p.prayer_type}: ${p.status} at ${p.location}`);
    });

    // Test 3: Get mosque with prayer times
    console.log('3. Testing mosque prayer times...');
    const [mosque] = await pool.execute(
      `SELECT m.*, pt.fajr_time, pt.dhuhr_time, pt.asr_time, pt.maghrib_time, pt.isha_time
       FROM mosques m
       LEFT JOIN prayer_times pt ON m.id = pt.mosque_id AND pt.prayer_date = ?
       WHERE m.id = 1`,
      [today]
    );
    
    if (mosque.length > 0) {
      console.log(`   ✅ Mosque: ${mosque[0].name}`);
      console.log(`   📅 Prayer times:`, {
        Fajr: mosque[0].fajr_time,
        Dhuhr: mosque[0].dhuhr_time,
        Asr: mosque[0].asr_time,
        Maghrib: mosque[0].maghrib_time,
        Isha: mosque[0].isha_time
      });
    }

    console.log('');
    console.log('🎉 Prayer recording tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testPrayerRecording();
