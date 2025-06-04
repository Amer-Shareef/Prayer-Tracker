const mysql = require('mysql2');
require('dotenv').config({ path: '../.env' });

// Create connection without database specification first
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

// First connect without database to create it if it doesn't exist
const connection = mysql.createConnection(connectionConfig);

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  
  console.log('Connected to MySQL server');
  
  // Create database if it doesn't exist
  connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'prayer_tracker'}`, (err) => {
    if (err) {
      console.error('Error creating database:', err);
      connection.end();
      process.exit(1);
    }
    
    console.log(`Database '${process.env.DB_NAME || 'prayer_tracker'}' created or already exists`);
    
    // Reconnect with database selected
    connection.changeUser({
      database: process.env.DB_NAME || 'prayer_tracker'
    }, (err) => {
      if (err) {
        console.error('Error selecting database:', err);
        connection.end();
        process.exit(1);
      }
      
      console.log(`Connected to '${process.env.DB_NAME || 'prayer_tracker'}' database`);
      
      // Create tables
      const createTables = `
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
          password VARCHAR(255) NOT NULL DEFAULT '$2b$10$3euPcmQFCiblsZeEu5s7p.9wvwWq.xRuDcT4m2KitWYyXjbO3J5HK',
          mosque_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (mosque_id) REFERENCES mosques(id)
        );
      `;
      
      connection.query(createTables, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          connection.end();
          process.exit(1);
        }
        
        console.log('Tables created successfully');
        
        // Insert default mosque if none exists
        connection.query(`
          INSERT INTO mosques (name, address)
          SELECT 'Default Mosque', '123 Main St'
          FROM dual
          WHERE NOT EXISTS (SELECT 1 FROM mosques LIMIT 1);
        `, (err, results) => {
          if (err) {
            console.error('Error inserting default mosque:', err);
            connection.end();
            process.exit(1);
          }
          
          if (results.affectedRows > 0) {
            console.log('Default mosque inserted');
          } else {
            console.log('Default mosque already exists');
          }
          
          // Close connection
          connection.end();
          console.log('Database setup completed');
        });
      });
    });
  });
});
