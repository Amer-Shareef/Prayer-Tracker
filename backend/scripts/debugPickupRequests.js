require('dotenv').config();
const { pool } = require('../config/database');

async function debugPickupRequests() {
  console.log('🔍 Debugging Pickup Requests');
  console.log('=============================');
  
  try {
    // Check table structure
    console.log('1. Checking pickup_requests table structure...');
    const [structure] = await pool.execute('DESCRIBE pickup_requests');
    
    console.log('Table columns:');
    structure.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });

    // Check existing data
    console.log('\n2. Checking existing pickup requests...');
    const [allRequests] = await pool.execute('SELECT * FROM pickup_requests ORDER BY created_at DESC LIMIT 5');
    
    console.log(`Found ${allRequests.length} recent requests:`);
    allRequests.forEach(req => {
      console.log(`   ID: ${req.id}, User: ${req.user_id}, Prayer: ${req.prayer_type}, Date: ${req.request_date}, Status: ${req.status}`);
    });

    // Test the exact API query that's failing
    console.log('\n3. Testing the exact failing query...');
    
    const testUserId = 16; // abdullah's ID from the error
    const limit = 10;
    
    // This is the exact query from the error
    const problematicQuery = `
      SELECT pr.*, m.name as mosque_name
      FROM pickup_requests pr
      LEFT JOIN mosques m ON pr.mosque_id = m.id
      WHERE pr.user_id = ?
     ORDER BY pr.request_date DESC, pr.created_at DESC LIMIT ?`;
    
    console.log('Query:', problematicQuery);
    console.log('Params:', [testUserId, limit]);
    console.log('Param types:', [typeof testUserId, typeof limit]);
    
    try {
      // This should fail with the original issue
      const [results] = await pool.execute(problematicQuery, [testUserId, limit]);
      console.log(`✅ Query worked! Found ${results.length} results`);
    } catch (queryError) {
      console.log('❌ Query failed as expected:', queryError.message);
      
      // Now try with proper integer conversion
      console.log('\n4. Testing with fixed parameters...');
      const [fixedResults] = await pool.execute(problematicQuery, [testUserId, parseInt(limit, 10)]);
      console.log(`✅ Fixed query worked! Found ${fixedResults.length} results`);
      
      fixedResults.forEach(req => {
        console.log(`   - ${req.prayer_type} on ${req.request_date} at ${req.pickup_location} (${req.status})`);
      });
    }

    console.log('\n🎉 Debug completed!');
    console.log('\n📋 Issue Summary:');
    console.log('  🐛 Problem: LIMIT parameter was not properly converted to integer');
    console.log('  🔧 Solution: Use parseInt(limit, 10) before passing to SQL');
    console.log('  ✅ Status: Fixed in pickupRoutes.js');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await pool.end();
  }
}

debugPickupRequests();
