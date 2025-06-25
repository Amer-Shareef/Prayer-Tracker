const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// Enhanced CORS configuration using environment variables
const getAllowedOrigins = () => {
  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : ["http://localhost:3000", "http://13.60.193.171:3000"];

  console.log("🌐 Allowed CORS origins:", origins);
  return origins;
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import database config
const { testConnection } = require("./config/database");

// Import routes
const authRoutes = require("./routes/authRoutes");
const memberRoutes = require("./routes/memberRoutes");
const userRoutes = require("./routes/userRoutes");
const prayerRoutes = require("./routes/prayerRoutes");
const mosqueRoutes = require("./routes/mosqueRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const pickupRoutes = require("./routes/pickupRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dailyActivitiesRoutes = require("./routes/dailyActivitiesRoutes");
const feedsRoutes = require("./routes/feedsRoutes");
const wakeUpCallRoutes = require("./routes/wakeUpCallRoutes"); // Add this line

// Use routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", mosqueRoutes);
app.use("/api", prayerRoutes);
app.use("/api", announcementRoutes);
app.use("/api", pickupRoutes);
app.use("/api", memberRoutes);
app.use("/api", adminRoutes);
app.use("/api/daily-activities", dailyActivitiesRoutes);
app.use("/api/feeds", feedsRoutes);
app.use("/api", wakeUpCallRoutes); // Add this line

// Enhanced health endpoint
app.get("/api/health", async (req, res) => {
  try {
    const { healthCheck } = require("./config/database");
    const startTime = Date.now();

    const dbHealthy = await healthCheck();
    const responseTime = Date.now() - startTime;

    const { pool } = require("./config/database");
    let poolInfo = {
      totalConnections: "N/A",
      freeConnections: "N/A",
      queuedRequests: "N/A",
    };

    try {
      if (pool.pool && pool.pool._allConnections) {
        poolInfo = {
          totalConnections: pool.pool._allConnections.length,
          freeConnections: pool.pool._freeConnections.length,
          queuedRequests: pool.pool._connectionQueue.length,
        };
      }
    } catch (poolError) {
      console.log("Could not get pool info:", poolError.message);
    }

    const healthStatus = {
      status: dbHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealthy,
        responseTime: `${responseTime}ms`,
        pool: poolInfo,
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        host: process.env.HOST || "13.60.193.171",
        port: process.env.PORT || 5000,
      },
      environment: process.env.NODE_ENV || "development",
    };

    res.status(dbHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error.message,
      },
      server: "running",
    });
  }
});

// Connection monitoring endpoint
app.get("/api/monitor", async (req, res) => {
  try {
    const { pool } = require("./config/database");

    // Get detailed connection information
    const connection = await pool.getConnection();
    const [status] = await connection.execute(
      'SHOW STATUS WHERE Variable_name IN ("Threads_connected", "Uptime", "Questions")'
    );
    connection.release();

    const statusData = {};
    status.forEach((row) => {
      statusData[row.Variable_name] = row.Value;
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      connection_pool: {
        total: pool.pool?._allConnections?.length || 0,
        free: pool.pool?._freeConnections?.length || 0,
        queued: pool.pool?._connectionQueue?.length || 0,
      },
      mysql_status: statusData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Test connection on startup
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "13.60.193.171";

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/api/health`);
  console.log(`🔐 Login endpoint: http://${HOST}:${PORT}/api/login`);

  const connected = await testConnection();
  if (!connected) {
    console.log("⚠️  Server started but database connection failed");
    console.log(
      "   The server will continue running, but database operations will fail"
    );
    console.log("   Please check your database configuration");
  }
});

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  console.log("📋 SIGTERM received, shutting down gracefully");
  const { pool } = require("./config/database");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("📋 SIGINT received, shutting down gracefully");
  const { pool } = require("./config/database");
  await pool.end();
  process.exit(0);
});
