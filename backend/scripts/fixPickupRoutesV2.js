require('dotenv').config();
const { pool } = require('../config/database');

async function fixPickupRoutesV2() {
  console.log('🔧 Testing Alternative Approach for Pickup Routes');
  console.log('=================================================');
  
  try {
    const testUserId = 16;
    
    // Test approach 1: Use raw query instead of prepared statement
    console.log('1. Testing raw query approach...');
    try {
      const limit = 10;
      const rawQuery = `
        SELECT pr.*, m.name as mosque_name
        FROM pickup_requests pr
        LEFT JOIN mosques m ON pr.mosque_id = m.id
        WHERE pr.user_id = ${testUserId}
        ORDER BY pr.request_date DESC, pr.created_at DESC
        LIMIT ${limit}
      `;
      
      const [rawResults] = await pool.execute(rawQuery);
      console.log(`✅ Raw query approach: ${rawResults.length} results`);
      
    } catch (rawError) {
      console.log(`❌ Raw query failed: ${rawError.message}`);
    }
    
    // Test approach 2: Split query and limit
    console.log('\n2. Testing split query approach...');
    try {
      const baseQuery = `
        SELECT pr.*, m.name as mosque_name
        FROM pickup_requests pr
        LEFT JOIN mosques m ON pr.mosque_id = m.id
        WHERE pr.user_id = ?
        ORDER BY pr.request_date DESC, pr.created_at DESC
      `;
      
      const [allResults] = await pool.execute(baseQuery, [testUserId]);
      const limitedResults = allResults.slice(0, 10);
      
      console.log(`✅ Split approach: ${allResults.length} total, ${limitedResults.length} limited`);
      
    } catch (splitError) {
      console.log(`❌ Split query failed: ${splitError.message}`);
    }
    
    // Test approach 3: Use query() instead of execute()
    console.log('\n3. Testing query() method instead of execute()...');
    try {
      const queryMethod = `
        SELECT pr.*, m.name as mosque_name
        FROM pickup_requests pr
        LEFT JOIN mosques m ON pr.mosque_id = m.id
        WHERE pr.user_id = ${testUserId}
        ORDER BY pr.request_date DESC, pr.created_at DESC
        LIMIT 10
      `;
      
      const [queryResults] = await pool.query(queryMethod);
      console.log(`✅ Query method approach: ${queryResults.length} results`);
      
    } catch (queryError) {
      console.log(`❌ Query method failed: ${queryError.message}`);
    }

    console.log('\n🎯 Recommended Solution:');
    console.log('  Use approach #2: Split query and JavaScript limiting');
    console.log('  - Avoids LIMIT parameter issues');
    console.log('  - Works reliably across MySQL versions');
    console.log('  - Provides better error handling');

  } catch (error) {
    console.error('❌ Fix test failed:', error.message);
  } finally {
    await pool.end();
  }
}

fixPickupRoutesV2();
