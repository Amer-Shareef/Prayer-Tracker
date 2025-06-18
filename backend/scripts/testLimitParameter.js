require('dotenv').config();
const { pool } = require('../config/database');

async function testLimitParameter() {
  console.log('🧪 Testing LIMIT Parameter Issue');
  console.log('===============================');
  
  try {
    const testUserId = 16; // abdullah's user ID
    
    console.log('1. Testing different parameter types...');
    
    // Test with string limit (this fails)
    console.log('\n❌ Testing with string limit (should fail):');
    try {
      const stringLimit = "10";
      console.log(`   Limit: "${stringLimit}" (${typeof stringLimit})`);
      
      const [result1] = await pool.execute(
        'SELECT pr.*, m.name as mosque_name FROM pickup_requests pr LEFT JOIN mosques m ON pr.mosque_id = m.id WHERE pr.user_id = ? ORDER BY pr.request_date DESC LIMIT ?',
        [testUserId, stringLimit]
      );
      console.log(`   ✅ Unexpected success with string limit: ${result1.length} results`);
    } catch (error) {
      console.log(`   ❌ Expected failure: ${error.message}`);
    }
    
    // Test with integer limit (this should work)
    console.log('\n✅ Testing with integer limit (should work):');
    try {
      const intLimit = 10;
      console.log(`   Limit: ${intLimit} (${typeof intLimit})`);
      
      const [result2] = await pool.execute(
        'SELECT pr.*, m.name as mosque_name FROM pickup_requests pr LEFT JOIN mosques m ON pr.mosque_id = m.id WHERE pr.user_id = ? ORDER BY pr.request_date DESC LIMIT ?',
        [testUserId, intLimit]
      );
      console.log(`   ✅ Success with integer limit: ${result2.length} results`);
      
      result2.forEach((req, index) => {
        console.log(`     ${index + 1}. ID: ${req.id}, Date: ${req.request_date}, Status: ${req.status}`);
      });
    } catch (error) {
      console.log(`   ❌ Unexpected failure: ${error.message}`);
    }
    
    // Test with parsed string limit
    console.log('\n🔧 Testing with parseInt converted limit:');
    try {
      const stringLimit = "10";
      const parsedLimit = parseInt(stringLimit, 10);
      console.log(`   Original: "${stringLimit}" (${typeof stringLimit})`);
      console.log(`   Parsed: ${parsedLimit} (${typeof parsedLimit})`);
      
      const [result3] = await pool.execute(
        'SELECT pr.*, m.name as mosque_name FROM pickup_requests pr LEFT JOIN mosques m ON pr.mosque_id = m.id WHERE pr.user_id = ? ORDER BY pr.request_date DESC LIMIT ?',
        [testUserId, parsedLimit]
      );
      console.log(`   ✅ Success with parsed limit: ${result3.length} results`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
    
    // Test without LIMIT to ensure base query works
    console.log('\n🔍 Testing base query without LIMIT:');
    try {
      const [result4] = await pool.execute(
        'SELECT pr.*, m.name as mosque_name FROM pickup_requests pr LEFT JOIN mosques m ON pr.mosque_id = m.id WHERE pr.user_id = ? ORDER BY pr.request_date DESC',
        [testUserId]
      );
      console.log(`   ✅ Base query works: ${result4.length} total results`);
    } catch (error) {
      console.log(`   ❌ Base query failed: ${error.message}`);
    }

    console.log('\n🎉 Parameter testing completed!');
    console.log('\n📋 Solution:');
    console.log('  🔧 Always use parseInt(limit, 10) before passing to SQL');
    console.log('  🔧 Check query parameter types in Express routes');
    console.log('  🔧 Validate parameters before database calls');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testLimitParameter();
