require('dotenv').config();
const { pool } = require('../config/database');

async function createStreakTestData() {
  console.log('🧪 Creating Test Data for Streak Calculation');
  console.log('===========================================');
  
  try {
    const testUserId = 1; // testmember user ID
    const prayerTypes = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    // Clear existing data for clean test
    await pool.execute('DELETE FROM prayers WHERE user_id = ?', [testUserId]);
    console.log('✅ Cleared existing prayer data');
    
    // Create a pattern:
    // Day -5: Complete (5/5) ✅
    // Day -4: Complete (5/5) ✅  
    // Day -3: Missed 1 prayer ❌ (breaks streak)
    // Day -2: Complete (5/5) ✅
    // Day -1: Complete (5/5) ✅ (streak = 2)
    // Today: Complete (5/5) ✅ (streak = 3)
    
    for (let dayOffset = -5; dayOffset <= 0; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      
      console.log(`📅 Creating data for ${dateStr} (day ${dayOffset})`);
      
      for (const prayerType of prayerTypes) {
        let status = 'prayed';
        
        // Day -3: Miss the Dhuhr prayer to break streak
        if (dayOffset === -3 && prayerType === 'Dhuhr') {
          status = 'missed';
          console.log(`   ❌ ${prayerType}: MISSED`);
        } else {
          console.log(`   ✅ ${prayerType}: prayed`);
        }
        
        await pool.execute(
          `INSERT INTO prayers (user_id, mosque_id, prayer_type, prayer_date, status, location)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [testUserId, 1, prayerType, dateStr, status, 'mosque']
        );
      }
    }
    
    console.log('\n✅ Test data created successfully!');
    console.log('\nExpected streak: 3 days (day -2, day -1, today)');
    console.log('The streak should NOT include day -3 due to missed Dhuhr');
    console.log('The streak should NOT include day -5 and day -4 due to gap at day -3');
    
    // Test the calculation
    console.log('\n🧪 Testing calculation with new data...');
    const { testConnection } = require('../config/database');
    await testConnection();
    
    console.log('\n📋 Now test the API:');
    console.log('1. Start the server: npm start');
    console.log('2. Login as testmember');
    console.log('3. Check dashboard or stats page');
    console.log('4. Should show streak = 3');

  } catch (error) {
    console.error('❌ Failed to create test data:', error.message);
  } finally {
    await pool.end();
  }
}

createStreakTestData();
