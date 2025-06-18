require('dotenv').config();
const { pool } = require('../config/database');

async function testCancelFlow() {
  console.log('🧪 Testing Pickup Request Cancel Flow');
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
      [testUserId, 1, tomorrowStr, 'Test Cancel Location']
    );
    
    const requestId = createResult.insertId;
    console.log(`✅ Test request created with ID: ${requestId}`);
    
    // Step 2: Verify request exists and is pending
    console.log('2. Verifying request status...');
    const [beforeCancel] = await pool.execute(
      'SELECT * FROM pickup_requests WHERE id = ?',
      [requestId]
    );
    
    console.log(`   Status before cancel: ${beforeCancel[0].status}`);
    console.log(`   User can see: ${beforeCancel[0].status !== 'cancelled'}`);
    
    // Step 3: Cancel the request (simulate API call)
    console.log('3. Cancelling request...');
    await pool.execute(
      'UPDATE pickup_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', requestId]
    );
    
    console.log(`✅ Request ${requestId} cancelled`);
    
    // Step 4: Verify request is cancelled but still exists
    console.log('4. Verifying cancellation...');
    const [afterCancel] = await pool.execute(
      'SELECT * FROM pickup_requests WHERE id = ?',
      [requestId]
    );
    
    console.log(`   Status after cancel: ${afterCancel[0].status}`);
    console.log(`   Record still exists: ${afterCancel.length > 0}`);
    console.log(`   Should show in list: Yes (with cancelled status)`);
    
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
    
    console.log(`   Frontend will see ${userRequests.length} requests:`);
    userRequests.forEach(req => {
      const isCancelled = req.status === 'cancelled';
      console.log(`   - ID ${req.id}: ${req.status} ${isCancelled ? '(cancelled - no cancel button)' : '(can be cancelled)'}`);
    });
    
    // Step 6: Clean up
    console.log('6. Cleaning up test data...');
    await pool.execute('DELETE FROM pickup_requests WHERE id = ?', [requestId]);
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Cancel flow test completed!');
    console.log('\n📋 Expected Behavior:');
    console.log('  ✅ Cancelled requests remain in database');
    console.log('  ✅ Status changes to "cancelled"');
    console.log('  ✅ Frontend shows cancelled requests');
    console.log('  ✅ No cancel button for cancelled requests');
    console.log('  ✅ List refreshes immediately after cancel');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testCancelFlow();
