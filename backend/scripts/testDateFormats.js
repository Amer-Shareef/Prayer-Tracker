require('dotenv').config();
const { pool } = require('../config/database');

async function testDateFormats() {
  console.log('🗓️ Testing Date Format Issues - FIXED VERSION');
  console.log('===============================================');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('Frontend today date:', today);
    
    // Test the new API query with formatted dates
    console.log('\n🔧 Testing new API query format:');
    const [prayers] = await pool.execute(
      `SELECT prayer_type, prayer_date, status,
              DATE_FORMAT(prayer_date, '%Y-%m-%d') as formatted_date
       FROM prayers WHERE user_id = 1 AND DATE(prayer_date) = ?
       LIMIT 5`,
      [today]
    );
    
    console.log(`Found ${prayers.length} prayers for today (${today}):`);
    prayers.forEach(p => {
      console.log(`- ${p.prayer_type}: ${p.status} (DB: ${p.prayer_date}, Formatted: ${p.formatted_date})`);
    });

    // Test without date filter to see all dates
    console.log('\n📅 All recent prayer dates:');
    const [allPrayers] = await pool.execute(
      `SELECT prayer_type, prayer_date,
              DATE_FORMAT(prayer_date, '%Y-%m-%d') as formatted_date
       FROM prayers WHERE user_id = 1 
       ORDER BY prayer_date DESC LIMIT 10`
    );
    
    allPrayers.forEach(p => {
      const matchesToday = p.formatted_date === today;
      console.log(`- ${p.prayer_type} on ${p.formatted_date} (matches today: ${matchesToday})`);
    });

    console.log('\n✅ Date format test completed!');
    console.log('📝 Solution: Use DATE_FORMAT() in SQL and direct string comparison in frontend');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDateFormats();
