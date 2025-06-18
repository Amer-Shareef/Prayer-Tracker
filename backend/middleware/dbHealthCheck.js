const { pool } = require('../config/database');

const dbHealthCheck = async (req, res, next) => {
  let connection = null;
  
  try {
    // Get connection with timeout
    connection = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
    ]);
    
    // Quick health check
    await connection.execute('SELECT 1');
    connection.release();
    
    next();
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('❌ Error releasing connection:', releaseError.message);
      }
    }
    
    // Determine error type and response
    let statusCode = 503;
    let errorType = 'DATABASE_CONNECTION_FAILED';
    let message = 'Database temporarily unavailable. Please try again.';
    
    if (error.message.includes('timeout')) {
      errorType = 'CONNECTION_TIMEOUT';
      message = 'Database connection timeout. Please refresh and try again.';
    } else if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      errorType = 'CONNECTION_LOST';
      message = 'Database connection lost. Please refresh and try again.';
    }
    
    return res.status(statusCode).json({
      success: false,
      message: message,
      error: errorType,
      isRetryable: true,
      timestamp: new Date().toISOString()
    });
  }
};

// Enhanced health check for specific routes
const enhancedHealthCheck = async (req, res, next) => {
  let connection = null;
  
  try {
    connection = await pool.getConnection();
    
    // More comprehensive health check - SIMPLIFIED
    await connection.execute('SELECT 1 as test');
    
    // Check if we can access the specific database
    await connection.execute('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = ?', [process.env.DB_NAME]);
    
    connection.release();
    next();
  } catch (error) {
    console.error('❌ Enhanced health check failed:', error.message);
    
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error('❌ Error releasing connection:', releaseError.message);
      }
    }
    
    return res.status(503).json({
      success: false,
      message: 'Database system check failed. Please try again.',
      error: 'ENHANCED_HEALTH_CHECK_FAILED',
      isRetryable: true,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { dbHealthCheck, enhancedHealthCheck };
