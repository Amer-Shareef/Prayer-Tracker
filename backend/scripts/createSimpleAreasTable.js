const mysql = require("mysql2/promise");
require("dotenv").config();

async function createAreasTable() {
  let connection;
  try {
    console.log("🔗 Connecting to database...");
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "3306"),
      ssl: { rejectUnauthorized: false },
    });

    console.log("✅ Connected to database");

    // Create areas table
    console.log("📋 Creating areas table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS areas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        coordinates VARCHAR(100),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log("✅ Areas table created");

    // Check if we have any areas
    const [existingAreas] = await connection.query(
      "SELECT COUNT(*) as count FROM areas"
    );

    if (existingAreas[0].count === 0) {
      console.log("📝 Adding default areas...");

      const areas = [
        "ANGODA",
        "ATHURUGIRIYA",
        "AVISSAWELLA",
        "BATTARAMULLA",
        "BORALESGAMUWA",
        "COLOMBO 01",
        "COLOMBO 02",
        "COLOMBO 03",
        "NUGEGODA",
        "MAHARAGAMA",
        "DEHIWALA",
        "MOUNT LAVINIA",
      ];

      for (const area of areas) {
        await connection.query(
          "INSERT INTO areas (name, description) VALUES (?, ?)",
          [area, `${area} area`]
        );
      }

      console.log(`✅ Added ${areas.length} areas`);
    } else {
      console.log("✅ Areas already exist");
    }

    const [count] = await connection.query(
      "SELECT COUNT(*) as total FROM areas"
    );
    console.log(`📊 Total areas: ${count[0].total}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createAreasTable();
