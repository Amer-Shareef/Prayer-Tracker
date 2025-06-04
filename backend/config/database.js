const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prayer_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Export both the promise interface and the callback interface
module.exports = pool.promise(); // For promise-based code
module.exports.query = pool.query.bind(pool); // For callback-based code
