require('dotenv').config();
const { pool } = require('../config/database');

async function testNewApproach() {
  console.log('🧪 Testing New Approach - No LIMIT in SQL');
  console.log('=========================================');
  
  try {
    const testUserId = 16;
    
    // Test the new approach - query without LIMIT, then slice
    console.log('1. Testing query without LIMIT...');
    
    const query = `
      SELECT pr.*, m.name as mosque_name
      FROM pickup_requests pr
      LEFT JOIN mosques m ON pr.mosque_id = m.id
      WHERE pr.user_id = ?
      ORDER BY pr.request_date DESC, pr.created_at DESC
    `;
    
    const queryParams = [testUserId];
    console.log('Query:', query);
    console.log('Params:', queryParams);
    
    const [allResults] = await pool.execute(query, queryParams);
    console.log(`✅ Query successful! Found ${allResults.length} total results`);
    
    // Apply limit in JavaScript
    const limit = 10;
    const limitedResults = allResults.slice(0, limit);
    console.log(`✅ Applied JS limit: ${limitedResults.length} results`);
    
    limitedResults.forEach((req, index) => {
      console.log(`   ${index + 1}. ID: ${req.id}, Date: ${req.request_date}, Status: ${req.status}`);
    });

    console.log('\n🎉 New approach test completed successfully!');
    console.log('\n📋 Benefits:');
    console.log('  ✅ No SQL LIMIT parameter issues');
    console.log('  ✅ Works with all MySQL versions');
    console.log('  ✅ Flexible limiting in JavaScript');
    console.log('  ✅ Can return total count for pagination');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testNewApproach();
