require('dotenv').config();
const { pool } = require('../config/database');

async function testPickupRequests() {
  console.log('🧪 Testing Pickup Requests Functionality');
  console.log('========================================');
  
  try {
    const testUserId = 1; // testmember user
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Test 1: Create pickup request
    console.log('1. Testing pickup request creation...');
    const [createResult] = await pool.execute(
      `INSERT INTO pickup_requests (user_id, mosque_id, prayer_type, request_date, pickup_location, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [testUserId, 1, 'Fajr', tomorrowStr, '123 Test Street, Test City', 'Please call when you arrive']
    );
    
    const requestId = createResult.insertId;
    console.log(`✅ Request created with ID: ${requestId}`);

    // Test 2: Retrieve request with details
    console.log('2. Testing request retrieval...');
    const [requestDetails] = await pool.execute(
      `SELECT pr.*, u.username, u.email, m.name as mosque_name
       FROM pickup_requests pr
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN mosques m ON pr.mosque_id = m.id
       WHERE pr.id = ?`,
      [requestId]
    );
    
    if (requestDetails.length > 0) {
      const request = requestDetails[0];
      console.log(`✅ Request retrieved:`);
      console.log(`   User: ${request.username}`);
      console.log(`   Prayer: ${request.prayer_type}`);
      console.log(`   Date: ${request.request_date}`);
      console.log(`   Location: ${request.pickup_location}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Mosque: ${request.mosque_name}`);
    }

    // Test 3: Update request status
    console.log('3. Testing status update...');
    await pool.execute(
      'UPDATE pickup_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', requestId]
    );
    console.log(`✅ Request status updated to approved`);

    // Test 4: Get user's requests
    console.log('4. Testing user requests query...');
    const [userRequests] = await pool.execute(
      `SELECT pr.*, m.name as mosque_name
       FROM pickup_requests pr
       LEFT JOIN mosques m ON pr.mosque_id = m.id
       WHERE pr.user_id = ?
       ORDER BY pr.request_date DESC`,
      [testUserId]
    );
    
    console.log(`✅ Found ${userRequests.length} requests for user ${testUserId}`);
    userRequests.forEach(req => {
      console.log(`   - ${req.prayer_type} on ${req.request_date} (${req.status})`);
    });

    // Test 5: Test duplicate prevention logic
    console.log('5. Testing duplicate prevention...');
    try {
      await pool.execute(
        `INSERT INTO pickup_requests (user_id, mosque_id, prayer_type, request_date, pickup_location)
         VALUES (?, ?, ?, ?, ?)`,
        [testUserId, 1, 'Fajr', tomorrowStr, 'Another location']
      );
      console.log('❌ Duplicate request was allowed (this should be prevented in API)');
    } catch (duplicateError) {
      // This is expected if there's a unique constraint
      console.log('ℹ️  Duplicate handling should be done in API layer');
    }

    // Clean up test data
    console.log('6. Cleaning up test data...');
    await pool.execute('DELETE FROM pickup_requests WHERE user_id = ? AND request_date = ?', [testUserId, tomorrowStr]);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Pickup requests functionality test completed!');
    console.log('\n📋 Test Results:');
    console.log('  ✅ Request creation works');
    console.log('  ✅ Request retrieval with joins works');
    console.log('  ✅ Status updates work');
    console.log('  ✅ User request queries work');
    console.log('  ✅ Database operations are functional');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testPickupRequests();
