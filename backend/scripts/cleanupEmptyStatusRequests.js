require('dotenv').config();
const { pool } = require('../config/database');

async function cleanupEmptyStatusRequests() {
  console.log('🧹 Cleaning Up Empty Status Pickup Requests');
  console.log('===========================================');
  
  try {
    // Find requests with empty status
    console.log('🔍 Finding requests with empty or invalid status...');
    const [emptyStatusRequests] = await pool.execute(
      `SELECT id, user_id, prayer_type, request_date, pickup_location, status 
       FROM pickup_requests 
       WHERE status = '' OR status IS NULL OR status NOT IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')`
    );

    console.log(`📋 Found ${emptyStatusRequests.length} requests with empty/invalid status:`);
    
    if (emptyStatusRequests.length > 0) {
      emptyStatusRequests.forEach(req => {
        console.log(`   - ID: ${req.id}, User: ${req.user_id}, Status: "${req.status}", Date: ${req.request_date}`);
      });

      // Delete these empty status requests
      console.log('\n🗑️  Deleting requests with empty/invalid status...');
      const [deleteResult] = await pool.execute(
        `DELETE FROM pickup_requests 
         WHERE status = '' OR status IS NULL OR status NOT IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')`
      );

      console.log(`✅ Deleted ${deleteResult.affectedRows} requests with empty/invalid status`);
    } else {
      console.log('✅ No requests with empty status found');
    }

    // Show remaining requests
    console.log('\n📊 Remaining pickup requests:');
    const [remainingRequests] = await pool.execute(
      'SELECT id, user_id, prayer_type, request_date, status FROM pickup_requests ORDER BY created_at DESC'
    );

    if (remainingRequests.length > 0) {
      remainingRequests.forEach(req => {
        console.log(`   - ID: ${req.id}, User: ${req.user_id}, Status: ${req.status}, Date: ${req.request_date}`);
      });
    } else {
      console.log('   No pickup requests found');
    }

    console.log(`\n📈 Total remaining requests: ${remainingRequests.length}`);

    console.log('\n🎉 Cleanup completed!');
    console.log('\n📋 Changes made:');
    console.log('  ✅ Removed requests with empty status');
    console.log('  ✅ Database is now clean');
    console.log('  ✅ Cancel now properly deletes records');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupEmptyStatusRequests();
