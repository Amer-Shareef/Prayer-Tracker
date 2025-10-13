const mysql = require("mysql2/promise");
require("dotenv").config();

console.log(
  "🔧 Database config loaded - Password length:",
  process.env.DB_PASSWORD?.length || 0
);

// Check if we should use local database (for development)
const useLocalDB = process.env.USE_LOCAL_DB === "true";

const dbConfig = {
  host: useLocalDB ? process.env.LOCAL_DB_HOST : process.env.DB_HOST,
  user: useLocalDB ? process.env.LOCAL_DB_USER : process.env.DB_USER,
  password: useLocalDB
    ? process.env.LOCAL_DB_PASSWORD
    : process.env.DB_PASSWORD,
  port: parseInt(
    useLocalDB
      ? process.env.LOCAL_DB_PORT || "3306"
      : process.env.DB_PORT || "3306"
  ),
  ssl: useLocalDB ? false : { rejectUnauthorized: false }, // No SSL for local Docker
  connectTimeout: 60000,
};

// Create connection pool WITHOUT database first
const poolWithoutDB = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  idleTimeout: 300000, // 5 minutes
  maxIdle: 5,
});

// ENHANCED CONNECTION POOL for AWS RDS - FIXED CONFIGURATION
const pool = mysql.createPool({
  ...dbConfig,
  database: useLocalDB ? process.env.LOCAL_DB_NAME : process.env.DB_NAME,

  // Connection pool settings for continuous operation
  waitForConnections: true,
  connectionLimit: 20, // Increased limit
  queueLimit: 0, // No queue limit

  // Keepalive settings for AWS RDS
  idleTimeout: 180000, // 3 minutes (shorter than RDS timeout)
  maxIdle: 10, // Keep 10 idle connections

  // Additional MySQL-specific settings
  charset: "utf8mb4",
  timezone: "Z",
});

// Enhanced connection test with retry logic and validation
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(
        `🔄 Testing database connection... (attempt ${i + 1}/${retries})`
      );
      const connection = await pool.getConnection();

      // Test with a simple, safe query - FIXED
      await connection.execute("SELECT 1 as test");
      connection.release();

      console.log("✅ Connected to database successfully!");
      return true;
    } catch (error) {
      console.log(
        `❌ Database connection failed (attempt ${i + 1}/${retries}):`,
        error.message
      );

      if (i === retries - 1) {
        console.log("🚨 All connection attempts failed!");
        return false;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 2000 * Math.pow(2, i))
      );
    }
  }
  return false;
};

// Enhanced health check function (for on-demand use only)
const healthCheck = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.execute("SELECT 1 as health");
    connection.release();
    return true;
  } catch (error) {
    console.error("🏥 Health check failed:", error.message);
    return false;
  }
};

// REMOVED: Automatic monitoring intervals
// The /api/health endpoint provides on-demand health checking
// Hosting platforms typically handle connection keep-alive automatically

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  console.log("📋 SIGTERM received - cleaning up database connections...");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("📋 SIGINT received - cleaning up database connections...");
  await pool.end();
  process.exit(0);
});

module.exports = { pool, poolWithoutDB, testConnection, healthCheck };
