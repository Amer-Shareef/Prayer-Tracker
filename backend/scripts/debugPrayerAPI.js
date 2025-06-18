require('dotenv').config();
const { pool } = require('../config/database');

async function debugPrayerAPI() {
  console.log('🔍 Debugging Prayer API Issues');
  console.log('================================');
  
  try {
    const testUserId = 1; // testmember user ID
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🎯 Testing for:');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Date: ${today}`);
    console.log('');

    // Test 1: Check user exists
    console.log('1. Checking if user exists...');
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [testUserId]);
    console.log(`   ✅ User found: ${users[0]?.username} (${users[0]?.role})`);

    // Test 2: Check all prayers for user
    console.log('2. Checking all prayers for user...');
    const [allPrayers] = await pool.execute(
      'SELECT * FROM prayers WHERE user_id = ? ORDER BY prayer_date DESC LIMIT 10',
      [testUserId]
    );
    console.log(`   ✅ Total prayers found: ${allPrayers.length}`);
    allPrayers.forEach(p => {
      console.log(`   - ${p.prayer_type} on ${p.prayer_date}: ${p.status}`);
    });

    // Test 3: Check prayers for today specifically
    console.log('3. Checking prayers for today...');
    const [todayPrayers] = await pool.execute(
      'SELECT * FROM prayers WHERE user_id = ? AND DATE(prayer_date) = DATE(?)',
      [testUserId, today]
    );
    console.log(`   ✅ Today's prayers: ${todayPrayers.length}`);
    todayPrayers.forEach(p => {
      console.log(`   - ${p.prayer_type}: ${p.status} at ${p.location}`);
    });

    // Test 4: Test exact API query
    console.log('4. Testing exact API query...');
    const [apiResult] = await pool.execute(
      `SELECT p.*, m.name as mosque_name 
       FROM prayers p
       LEFT JOIN mosques m ON p.mosque_id = m.id
       WHERE p.user_id = ? AND DATE(p.prayer_date) = DATE(?)
       ORDER BY p.prayer_date DESC, FIELD(p.prayer_type, "Fajr", "Dhuhr", "Asr", "Maghrib", "Isha")`,
      [testUserId, today]
    );
    console.log(`   ✅ API query result: ${apiResult.length} prayers`);
    apiResult.forEach(p => {
      console.log(`   - ${p.prayer_type}: ${p.status} (${p.mosque_name})`);
    });

    // Test 5: Check date formats
    console.log('5. Checking date formats in database...');
    const [dateFormats] = await pool.execute(
      'SELECT DISTINCT prayer_date, DATE(prayer_date) as date_only FROM prayers WHERE user_id = ? LIMIT 5',
      [testUserId]
    );
    console.log('   Date formats in DB:');
    dateFormats.forEach(d => {
      console.log(`   - Original: ${d.prayer_date}, Date only: ${d.date_only}`);
    });

    console.log('');
    console.log('🎉 Debug completed!');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugPrayerAPI();
