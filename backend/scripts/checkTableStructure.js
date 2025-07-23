const { pool } = require("../config/database");

async function checkAreasTableStructure() {
  try {
    console.log("🔍 Checking areas table structure...");

    // Check table structure
    const [structure] = await pool.execute("DESCRIBE areas");
    console.log("📋 Current table structure:");
    structure.forEach((col) => {
      console.log(
        `  ${col.Field} - ${col.Type} (${
          col.Null === "YES" ? "NULL" : "NOT NULL"
        }) ${col.Key ? `[${col.Key}]` : ""} ${
          col.Default !== null ? `Default: ${col.Default}` : ""
        }`
      );
    });

    // Check constraints
    console.log("\n🔒 Checking constraints...");
    const [constraints] = await pool.execute(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, CONSTRAINT_TYPE 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      WHERE tc.TABLE_NAME = 'areas' AND tc.TABLE_SCHEMA = DATABASE()
    `);

    if (constraints.length > 0) {
      console.log("📊 Constraints found:");
      constraints.forEach((constraint) => {
        console.log(
          `  ${constraint.CONSTRAINT_NAME}: ${constraint.CONSTRAINT_TYPE} on ${constraint.COLUMN_NAME}`
        );
      });
    } else {
      console.log("No constraints found");
    }

    // Check current data
    console.log("\n📊 Current data in areas table:");
    const [data] = await pool.execute(
      "SELECT id, name, area_name, address, coordinates, description FROM areas"
    );
    console.table(data);
  } catch (error) {
    console.error("❌ Error checking table structure:", error);
  }
}

// Run the check
if (require.main === module) {
  checkAreasTableStructure()
    .then(() => {
      console.log("✅ Check completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Check failed:", error);
      process.exit(1);
    });
}

module.exports = checkAreasTableStructure;
