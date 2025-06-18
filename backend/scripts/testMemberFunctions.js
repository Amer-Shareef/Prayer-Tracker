require('dotenv').config();
const { pool } = require('../config/database');

async function testMemberFunctions() {
  console.log('🧪 Testing Member Functions');
  console.log('============================');
  
  try {
    // Test 1: Get user's prayers
    console.log('1. Testing prayer retrieval...');
    const today = new Date().toISOString().split('T')[0];
    const [prayers] = await pool.execute(
      'SELECT * FROM prayers WHERE user_id = 1 AND prayer_date = ? ORDER BY prayer_type',
      [today]
    );
    console.log(`   ✅ Found ${prayers.length} prayer records for today`);

    // Test 2: Get mosque with prayer times
    console.log('2. Testing mosque data with prayer times...');
    const [mosques] = await pool.execute(
      `SELECT m.*, pt.fajr_time, pt.dhuhr_time, pt.asr_time, pt.maghrib_time, pt.isha_time
       FROM mosques m
       LEFT JOIN prayer_times pt ON m.id = pt.mosque_id AND pt.prayer_date = ?
       WHERE m.id = 1`,
      [today]
    );
    
    if (mosques.length > 0) {
      console.log(`   ✅ Mosque: ${mosques[0].name}`);
      console.log(`   📅 Today's Fajr time: ${mosques[0].fajr_time || 'Not set'}`);
    }

    // Test 3: Test prayer statistics
    console.log('3. Testing prayer statistics...');
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_prayers,
        COUNT(CASE WHEN status = 'prayed' THEN 1 END) as prayed_count,
        ROUND((COUNT(CASE WHEN status = 'prayed' THEN 1 END) / COUNT(*)) * 100, 2) as attendance_rate
       FROM prayers 
       WHERE user_id = 1 AND prayer_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`
    );
    console.log(`   ✅ Stats: ${stats[0].total_prayers} total, ${stats[0].prayed_count} prayed, ${stats[0].attendance_rate}% rate`);

    console.log('');
    console.log('🎉 Member function tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testMemberFunctions();
