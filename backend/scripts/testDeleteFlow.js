require('dotenv').config();
const { pool } = require('../config/database');

async function testDeleteFlow() {
  console.log('🧪 Testing Pickup Request Delete Flow');
  console.log('====================================');
  
  try {
    const testUserId = 16; // abdullah's user ID
    
    // Step 1: Create a test request
    console.log('1. Creating test pickup request...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const [createResult] = await pool.execute(
      `INSERT INTO pickup_requests 
       (user_id, mosque_id, prayer_type, request_date, pickup_location, status)
       VALUES (?, ?, 'Fajr', ?, ?, 'pending')`,
      [testUserId, 1, tomorrowStr, 'Test Delete Location']
    );
    
    const requestId = createResult.insertId;
    console.log(`✅ Test request created with ID: ${requestId}`);
    
    // Step 2: Verify request exists and is pending
    console.log('2. Verifying request exists...');
    const [beforeDelete] = await pool.execute(
      'SELECT COUNT(*) as count FROM pickup_requests WHERE id = ?',
      [requestId]
    );
    
    console.log(`   Request exists: ${beforeDelete[0].count === 1 ? 'YES' : 'NO'}`);
    
    // Step 3: Delete the request (simulate API call)
    console.log('3. Deleting request...');
    const [deleteResult] = await pool.execute(
      'DELETE FROM pickup_requests WHERE id = ? AND user_id = ?',
      [requestId, testUserId]
    );
    
    console.log(`✅ Delete operation completed. Affected rows: ${deleteResult.affectedRows}`);
    
    // Step 4: Verify request is completely removed
    console.log('4. Verifying deletion...');
    const [afterDelete] = await pool.execute(
      'SELECT COUNT(*) as count FROM pickup_requests WHERE id = ?',
      [requestId]
    );
    
    console.log(`   Request exists after delete: ${afterDelete[0].count === 1 ? 'YES (BAD)' : 'NO (GOOD)'}`);
    
    // Step 5: Test API query (what frontend sees)
    console.log('5. Testing frontend query...');
    const [userRequests] = await pool.execute(
      `SELECT pr.*, m.name as mosque_name
       FROM pickup_requests pr
       LEFT JOIN mosques m ON pr.mosque_id = m.id
       WHERE pr.user_id = ?
       ORDER BY pr.request_date DESC, pr.created_at DESC`,
      [testUserId]
    );
    
    console.log(`   Frontend will see ${userRequests.length} requests`);
    const deletedRequestStillVisible = userRequests.some(req => req.id === requestId);
    console.log(`   Deleted request still visible: ${deletedRequestStillVisible ? 'YES (BAD)' : 'NO (GOOD)'}`);
    
    console.log('\n🎉 Delete flow test completed!');
    console.log('\n📋 Expected Behavior:');
    console.log('  ✅ Pending requests can be completely deleted');
    console.log('  ✅ Record is removed from database');
    console.log('  ✅ Frontend list updates immediately');
    console.log('  ✅ No trace of cancelled request remains');
    console.log('  ✅ Only approved/completed requests are preserved');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDeleteFlow();
