const { pool } = require("../config/database");

async function restructureAreasTable() {
  try {
    console.log("🔄 Starting areas table restructure...");

    // Step 1: Backup existing data
    console.log("📋 Backing up existing data...");
    const [existingData] = await pool.execute("SELECT * FROM areas");
    console.log(`Found ${existingData.length} existing records`);

    // Step 2: Drop the old table
    console.log("🗑️ Dropping old areas table...");
    await pool.execute("DROP TABLE IF EXISTS areas");

    // Step 3: Create new table with your requirements
    console.log("🏗️ Creating new areas table structure...");
    await pool.execute(`
      CREATE TABLE areas (
        area_id INT AUTO_INCREMENT PRIMARY KEY,
        area_name VARCHAR(255) NOT NULL UNIQUE,
        address TEXT NOT NULL,
        coordinates VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Step 4: Restore data with new structure
    console.log("📊 Restoring data to new structure...");
    for (const row of existingData) {
      const areaName = row.area_name || row.name || `Area ${row.id}`;
      const address = row.address || "Address not specified";

      try {
        await pool.execute(
          `
          INSERT INTO areas (area_name, address, coordinates, description) 
          VALUES (?, ?, ?, ?)
        `,
          [areaName, address, row.coordinates || null, row.description || null]
        );
        console.log(`✅ Restored: ${areaName}`);
      } catch (err) {
        console.log(`⚠️ Skipped duplicate: ${areaName}`);
      }
    }

    // Step 5: Show final structure
    console.log("📋 New table structure:");
    const [structure] = await pool.execute("DESCRIBE areas");
    structure.forEach((col) => {
      console.log(
        `  ${col.Field} - ${col.Type} ${
          col.Null === "NO" ? "(NOT NULL)" : ""
        } ${col.Key ? `[${col.Key}]` : ""}`
      );
    });

    // Step 6: Show current data
    console.log("📊 Current data:");
    const [newData] = await pool.execute("SELECT * FROM areas LIMIT 5");
    console.table(newData);

    console.log("🎉 Areas table restructure completed successfully!");
  } catch (error) {
    console.error("❌ Error restructuring areas table:", error);
    throw error;
  }
}

// Run the restructure
if (require.main === module) {
  restructureAreasTable()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = restructureAreasTable;
