const mysql = require("mysql2/promise");
require("dotenv").config();

async function checkRejectionColumns() {
  let connection;
  try {
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "3306"),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000,
    };

    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database");

    // Check column names in pickup_requests table
    console.log(
      "\n🔍 Checking rejection-related columns in pickup_requests table:"
    );
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM pickup_requests 
      WHERE Field LIKE '%reject%'
    `);

    columns.forEach((col) => {
      console.log(
        `- ${col.Field}: ${col.Type} ${
          col.Null === "YES" ? "NULL" : "NOT NULL"
        } ${col.Default ? `DEFAULT ${col.Default}` : ""}`
      );
    });

    // Get a sample record to see the actual data structure
    console.log("\n📋 Sample pickup request data:");
    const [sample] = await connection.execute(`
      SELECT id, status, rejection_reason, rejected_reason, rejected_at, rejected_by 
      FROM pickup_requests 
      LIMIT 1
    `);

    if (sample.length > 0) {
      console.log("Sample record structure:", Object.keys(sample[0]));
    } else {
      console.log("No records found in pickup_requests table");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log("Database connection closed");
    }
  }
}

checkRejectionColumns();
