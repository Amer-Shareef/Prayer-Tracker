require('dotenv').config();
const { pool } = require('../config/database');

async function fixPickupDates() {
  console.log('🔧 Fixing Pickup Request Date Issues');
  console.log('====================================');
  
  try {
    // Show all pickup requests with date analysis
    console.log('📊 All pickup requests with date analysis:');
    const [allRequests] = await pool.execute(`
      SELECT id, user_id, request_date, pickup_location, status, created_at,
             DATE(request_date) as request_day,
             DATE(created_at) as created_day,
             DATEDIFF(DATE(request_date), DATE(created_at)) as day_difference
      FROM pickup_requests 
      ORDER BY created_at DESC
    `);
    
    console.log('\n📋 Request Analysis:');
    allRequests.forEach(req => {
      const status = req.day_difference >= 0 ? '✅ VALID' : '❌ INVALID';
      console.log(`   ID: ${req.id}`);
      console.log(`     Location: ${req.pickup_location}`);
      console.log(`     Request Day: ${req.request_day}`);
      console.log(`     Created Day: ${req.created_day}`);
      console.log(`     Difference: ${req.day_difference} days ${status}`);
      console.log(`     Status: ${req.status}`);
      console.log('');
    });

    // Check for any problematic dates
    const [problemRequests] = await pool.execute(`
      SELECT * FROM pickup_requests 
      WHERE DATE(request_date) < DATE(created_at)
    `);
    
    if (problemRequests.length > 0) {
      console.log('❌ Found requests with dates in the past:');
      problemRequests.forEach(req => {
        console.log(`   ID: ${req.id}, Location: ${req.pickup_location}`);
      });
      
      console.log('\n🔧 Would you like to fix these? (This script just analyzes)');
    } else {
      console.log('✅ All pickup request dates are valid!');
    }

    // Explain the kawdana road case
    console.log('\n💡 About the "kawdana road" request:');
    console.log('   📅 Created on: 2025-06-17 (when user submitted)');
    console.log('   🎯 Pickup for: 2025-06-18 (next day Fajr prayer)');
    console.log('   ✅ This is CORRECT behavior!');
    console.log('   📝 Users can book pickup for future dates');
    console.log('   🕌 Fajr prayer is early morning, so advance booking makes sense');

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixPickupDates();
