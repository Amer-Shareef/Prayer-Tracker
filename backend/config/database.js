const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔧 Database config loaded - Password length:', process.env.DB_PASSWORD?.length || 0);

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: { rejectUnauthorized: false },
  connectTimeout: 60000
};

// Create connection pool WITHOUT database first
const poolWithoutDB = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  idleTimeout: 300000, // 5 minutes
  maxIdle: 5
});

// ENHANCED CONNECTION POOL for AWS RDS - FIXED CONFIGURATION
const pool = mysql.createPool({
  ...dbConfig,
  database: process.env.DB_NAME,
  
  // Connection pool settings for continuous operation
  waitForConnections: true,
  connectionLimit: 20,              // Increased limit
  queueLimit: 0,                    // No queue limit
  
  // Keepalive settings for AWS RDS
  idleTimeout: 180000,              // 3 minutes (shorter than RDS timeout)
  maxIdle: 10,                      // Keep 10 idle connections
  
  // Additional MySQL-specific settings
  charset: 'utf8mb4',
  timezone: 'Z'
});

// Enhanced connection test with retry logic and validation
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Testing database connection... (attempt ${i + 1}/${retries})`);
      const connection = await pool.getConnection();
      
      // Test with a simple, safe query - FIXED
      await connection.execute('SELECT 1 as test');
      connection.release();
      
      console.log('✅ Connected to database successfully!');
      return true;
    } catch (error) {
      console.log(`❌ Database connection failed (attempt ${i + 1}/${retries}):`, error.message);
      
      if (i === retries - 1) {
        console.log('🚨 All connection attempts failed!');
        return false;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, i)));
    }
  }
  return false;
};

// Enhanced health check function
const healthCheck = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1 as health');
    connection.release();
    return true;
  } catch (error) {
    console.error('🏥 Health check failed:', error.message);
    return false;
  }
};

// CONTINUOUS CONNECTION MONITORING - Every 2 minutes
let healthCheckInterval;

const startHealthMonitoring = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    console.log('🔍 Performing routine health check...');
    const isHealthy = await healthCheck();
    
    if (!isHealthy) {
      console.log('⚠️  Health check failed - attempting to refresh connections...');
      
      // Try to get a fresh connection
      try {
        const connection = await pool.getConnection();
        connection.release();
        console.log('✅ Connection refresh successful');
      } catch (error) {
        console.error('❌ Connection refresh failed:', error.message);
      }
    } else {
      console.log('✅ Health check passed');
    }
  }, 120000); // Every 2 minutes
};

// CONNECTION KEEPALIVE - Send ping every 30 seconds
let keepAliveInterval;

const startKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  keepAliveInterval = setInterval(async () => {
    try {
      const connection = await pool.getConnection();
      await connection.execute('SELECT 1');
      connection.release();
      console.log('💓 Keep-alive ping sent');
    } catch (error) {
      console.error('💔 Keep-alive ping failed:', error.message);
    }
  }, 30000); // Every 30 seconds
};

// Start monitoring when module is loaded
startHealthMonitoring();
startKeepAlive();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('📋 SIGTERM received - cleaning up database connections...');
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📋 SIGINT received - cleaning up database connections...');
  if (healthCheckInterval) clearInterval(healthCheckInterval);
  if (keepAliveInterval) clearInterval(keepAliveInterval);
  await pool.end();
  process.exit(0);
});

module.exports = { pool, poolWithoutDB, testConnection, healthCheck };
