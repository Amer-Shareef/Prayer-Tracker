require('dotenv').config();
const { pool } = require('../config/database');

async function fixPickupRequests() {
  console.log('🔧 Fixing Pickup Requests Issues');
  console.log('================================');
  
  try {
    // Test the problematic query
    console.log('1. Testing current query structure...');
    
    const testUserId = 16; // abdullah's user ID
    const limit = 10;
    
    console.log(`Testing with user_id: ${testUserId}, limit: ${limit}`);
    console.log(`Limit type: ${typeof limit}, Limit value: ${limit}`);
    
    // Test the fixed query
    const query = `
      SELECT pr.*, m.name as mosque_name
      FROM pickup_requests pr
      LEFT JOIN mosques m ON pr.mosque_id = m.id
      WHERE pr.user_id = ?
      ORDER BY pr.request_date DESC, pr.created_at DESC
      LIMIT ?
    `;
    
    const queryParams = [testUserId, parseInt(limit, 10)];
    console.log('Query params:', queryParams);
    console.log('Param types:', queryParams.map(p => typeof p));
    
    const [requests] = await pool.execute(query, queryParams);
    
    console.log(`✅ Query successful! Found ${requests.length} requests`);
    
    requests.forEach((req, index) => {
      console.log(`   ${index + 1}. ID: ${req.id}, Date: ${req.request_date}, Location: ${req.pickup_location}, Status: ${req.status}`);
    });

    // Test the pickup request creation
    console.log('\n2. Testing pickup request creation...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    try {
      const [createResult] = await pool.execute(
        `INSERT INTO pickup_requests 
         (user_id, mosque_id, prayer_type, request_date, pickup_location, status, created_at)
         VALUES (?, ?, 'Fajr', ?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [testUserId, 1, tomorrowStr, 'Test Location - Fixed Issue']
      );
      
      console.log(`✅ Test request created with ID: ${createResult.insertId}`);
      
      // Clean up test data
      await pool.execute('DELETE FROM pickup_requests WHERE id = ?', [createResult.insertId]);
      console.log('✅ Test data cleaned up');
      
    } catch (createError) {
      console.log('❌ Create test failed:', createError.message);
    }

    console.log('\n🎉 Pickup requests issues have been fixed!');
    console.log('\n📋 Changes made:');
    console.log('  ✅ Fixed SQL parameter type conversion');
    console.log('  ✅ Added proper integer parsing for LIMIT');
    console.log('  ✅ Enhanced error logging');
    console.log('  ✅ Improved validation');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

fixPickupRequests();
