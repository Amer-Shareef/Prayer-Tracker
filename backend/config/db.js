const mysql = require("mysql2");
require("dotenv").config();

// Create pool instead of single connection for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "prayer_tracker",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("Database pool created");

// Test the connection
pool.query("SELECT 1", (err, results) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connected successfully");
  }
});

module.exports = pool;
