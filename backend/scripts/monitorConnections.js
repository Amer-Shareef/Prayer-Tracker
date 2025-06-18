require('dotenv').config();
const { pool, healthCheck } = require('../config/database');

async function monitorConnections() {
  console.log('🔍 Starting Connection Monitor');
  console.log('=============================');
  
  let checkCount = 0;
  let failureCount = 0;
  
  const monitor = async () => {
    checkCount++;
    const timestamp = new Date().toISOString();
    
    try {
      const startTime = Date.now();
      const isHealthy = await healthCheck();
      const responseTime = Date.now() - startTime;
      
      if (isHealthy) {
        console.log(`✅ [${timestamp}] Check #${checkCount} - Healthy (${responseTime}ms)`);
        
        // Reset failure count on success
        if (failureCount > 0) {
          console.log(`🎉 Recovered after ${failureCount} failures`);
          failureCount = 0;
        }
      } else {
        failureCount++;
        console.log(`❌ [${timestamp}] Check #${checkCount} - FAILED (Failure #${failureCount})`);
        
        if (failureCount >= 3) {
          console.log('🚨 ALERT: Multiple consecutive failures detected!');
        }
      }
      
      // Show pool stats every 10 checks
      if (checkCount % 10 === 0) {
        try {
          const poolStats = {
            total: pool.pool._allConnections.length,
            free: pool.pool._freeConnections.length,
            queued: pool.pool._connectionQueue.length
          };
          console.log(`📊 Pool Stats: ${JSON.stringify(poolStats)}`);
        } catch (e) {
          console.log('📊 Pool Stats: Unable to retrieve');
        }
      }
      
    } catch (error) {
      failureCount++;
      console.log(`💥 [${timestamp}] Check #${checkCount} - ERROR: ${error.message}`);
    }
  };
  
  // Run initial check
  await monitor();
  
  // Check every 10 seconds
  const interval = setInterval(monitor, 10000);
  
  // Stop monitoring after 5 minutes (for testing)
  setTimeout(() => {
    clearInterval(interval);
    console.log(`\n📋 Monitoring completed. Total checks: ${checkCount}, Total failures: ${failureCount}`);
    process.exit(0);
  }, 300000); // 5 minutes
  
  console.log('⏰ Monitoring every 10 seconds... (will run for 5 minutes)');
}

monitorConnections().catch(console.error);
