const mysql = require("mysql2/promise");
require("dotenv").config();

async function createAreasTable() {
  console.log("🏗️ Creating areas table...");

  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "3306"),
      ssl: { rejectUnauthorized: false },
      connectTimeout: 60000,
    });

    console.log("✅ Database connection established");

    // Check if the table already exists
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'areas'
    `);

    if (tables.length === 0) {
      console.log("📋 Creating areas table...");

      await connection.query(`
        CREATE TABLE areas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          coordinates VARCHAR(100),
          status ENUM('active', 'inactive') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_name (name),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      console.log("✅ Areas table created successfully");

      // Insert default areas based on the existing hardcoded options
      console.log("📝 Inserting default areas...");

      const defaultAreas = [
        "ANGODA",
        "ATHURUGIRIYA",
        "AVISSAWELLA",
        "BATTARAMULLA",
        "BORALESGAMUWA",
        "COLOMBO 01",
        "COLOMBO 02",
        "COLOMBO 03",
        "COLOMBO 04",
        "COLOMBO 05",
        "COLOMBO 06",
        "COLOMBO 07",
        "COLOMBO 08",
        "COLOMBO 09",
        "COLOMBO 10",
        "COLOMBO 11",
        "COLOMBO 12",
        "COLOMBO 13",
        "COLOMBO 14",
        "COLOMBO 15",
        "DEHIWALA",
        "HOMAGAMA",
        "KADUWELA",
        "KESBEWA",
        "KOTTAWA",
        "MAHARAGAMA",
        "MORATUWA",
        "MOUNT LAVINIA",
        "NUGEGODA",
        "PADUKKA",
        "PANNIPITIYA",
        "PILIYANDALA",
        "RAJAGIRIYA",
        "RATMALANA",
        "SRI JAYAWARDENEPURA KOTTE",
        "TALAWATUGODA",
        "WELLAMPITIYA",
      ];

      for (const areaName of defaultAreas) {
        await connection.query(
          "INSERT INTO areas (name, description) VALUES (?, ?)",
          [areaName, `${areaName} area`]
        );
      }

      console.log(`✅ Inserted ${defaultAreas.length} default areas`);
    } else {
      console.log("✅ Areas table already exists");
    }

    // Show statistics
    const [stats] = await connection.execute(
      "SELECT COUNT(*) as total_areas FROM areas"
    );
    console.log(`📊 Total areas in database: ${stats[0].total_areas}`);

    console.log("✅ Areas table setup completed successfully");
  } catch (error) {
    console.error("❌ Areas table creation failed:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  createAreasTable()
    .then(() => {
      console.log("🎉 Areas table setup script completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

module.exports = { createAreasTable };
