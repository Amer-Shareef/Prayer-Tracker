require('dotenv').config();
const { pool } = require('../config/database');

async function cleanupPickupData() {
  console.log('🧹 Cleaning Up Pickup Requests Data');
  console.log('===================================');
  
  try {
    // Show current data
    console.log('📊 Current pickup requests data:');
    const [currentData] = await pool.execute(
      'SELECT id, user_id, request_date, pickup_location, status, created_at FROM pickup_requests ORDER BY id'
    );
    
    currentData.forEach(req => {
      console.log(`   ID: ${req.id}, User: ${req.user_id}, Date: ${req.request_date}, Location: ${req.pickup_location}, Created: ${req.created_at}`);
    });

    // Delete the "keels kalubowila" request (ID: 1)
    console.log('\n🗑️  Deleting "keels kalubowila" request...');
    const [deleteResult] = await pool.execute(
      'DELETE FROM pickup_requests WHERE id = 1 AND pickup_location = ?',
      ['keels kalubowila']
    );
    
    if (deleteResult.affectedRows > 0) {
      console.log('✅ "keels kalubowila" request deleted successfully');
    } else {
      console.log('⚠️  "keels kalubowila" request not found or already deleted');
    }

    // Show remaining data
    console.log('\n📊 Remaining pickup requests:');
    const [remainingData] = await pool.execute(
      'SELECT id, user_id, request_date, pickup_location, status, created_at FROM pickup_requests ORDER BY id'
    );
    
    if (remainingData.length > 0) {
      remainingData.forEach(req => {
        console.log(`   ID: ${req.id}, User: ${req.user_id}, Date: ${req.request_date}, Location: ${req.pickup_location}, Created: ${req.created_at}`);
      });
    } else {
      console.log('   No pickup requests remaining');
    }

    console.log('\n🎉 Cleanup completed!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await pool.end();
  }
}

cleanupPickupData();
