const mysql = require('mysql2');
require('dotenv').config();

// Create connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prayer_tracker'
});

// Connect to database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('MySQL connection established successfully!');
  
  // Test query
  connection.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return;
    }
    
    console.log('Available tables:');
    console.table(results);
    
    // Close connection
    connection.end();
  });
});
