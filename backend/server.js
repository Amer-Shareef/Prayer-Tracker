const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const MySQLStore = require("connect-mysql")(session);
const cookieParser = require("cookie-parser");
const { testConnection, pool } = require("./db");
require("dotenv").config({ path: "../.env" });

// Import routes
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");
const { loadUser } = require("./middleware/auth");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Debug server startup
console.log(`Starting server on port ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log(
  `Session secret: ${
    process.env.SESSION_SECRET ? "******" : "Not set (using default)"
  }`
);

// Session configuration
const sessionStore = new MySQLStore({
  pool: pool,
  options: {
    createDatabaseTable: true,
    schema: {
      tableName: "sessions",
      columnNames: {
        session_id: "session_id",
        expires: "expires",
        data: "data",
      },
    },
  },
});

// Middleware
app.use(
  cors({
    origin: true, // Allow requests from any origin in development
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    key: "prayer_tracker_sid",
    secret: process.env.SESSION_SECRET || "prayer-tracker-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Load user middleware (adds user to request if authenticated)
app.use(loadUser);

// Static files for frontend
app.use(express.static("../frontend"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

// Initialize server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (dbConnected) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(
          `Access the application at: http://localhost:${PORT}/Login/login.html`
        );
      });
    } else {
      console.error("Server not started due to database connection failure");
    }
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

startServer();
