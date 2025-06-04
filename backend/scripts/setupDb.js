const mysql = require('mysql2');
require('dotenv').config();

// Database connection config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prayer_tracker',
  multipleStatements: true // Allow multiple SQL statements in one query
};

console.log('Connecting to MySQL database...');

// Create connection
const connection = mysql.createConnection(dbConfig);

// SQL to create tables
const createTablesSql = `
-- Create mosques table if it doesn't exist
CREATE TABLE IF NOT EXISTS mosques (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  founder_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create members table with correct fields
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  password VARCHAR(255) NOT NULL,
  mosque_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default mosque if none exists
INSERT IGNORE INTO mosques (id, name, address) 
VALUES (1, 'Default Mosque', '123 Main Street');
`;

// Execute the SQL
connection.query(createTablesSql, (err, results) => {
  if (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
  
  console.log('Database tables created successfully!');
  console.log('Tables created:', results);
  
  // Close connection
  connection.end();
  console.log('Database setup completed');
});
