const { pool } = require("../config/database");

async function updateAreasTableStructure() {
  try {
    console.log("🔄 Starting areas table structure update...");

    // First, let's check the current table structure
    console.log("📋 Checking current table structure...");
    const [currentStructure] = await pool.execute("DESCRIBE areas");
    console.log(
      "Current columns:",
      currentStructure.map((col) => col.Field)
    );

    // Check which columns are missing
    const existingColumns = currentStructure.map((col) => col.Field);
    const requiredColumns = ["area_name", "address", "coordinates"];
    const missingColumns = requiredColumns.filter(
      (col) => !existingColumns.includes(col)
    );

    console.log("Missing columns:", missingColumns);

    if (missingColumns.length === 0) {
      console.log("✅ All required columns already exist!");
      return;
    }

    // Try to add missing columns one by one
    for (const columnName of missingColumns) {
      let query = "";
      switch (columnName) {
        case "area_name":
          query = "ALTER TABLE areas ADD COLUMN area_name VARCHAR(255)";
          break;
        case "address":
          query = "ALTER TABLE areas ADD COLUMN address TEXT";
          break;
        case "coordinates":
          query = "ALTER TABLE areas ADD COLUMN coordinates VARCHAR(100)";
          break;
      }

      try {
        console.log(`➕ Adding ${columnName} column...`);
        await pool.execute(query);
        console.log(`✅ Successfully added ${columnName} column`);
      } catch (error) {
        console.error(`❌ Error adding ${columnName}:`, error.message);

        if (error.code === "ER_ACCESS_DENIED_ERROR") {
          console.log(
            "🚨 ACCESS DENIED - Your database user doesn't have ALTER privileges"
          );
          console.log("💡 You need to contact your database administrator to:");
          console.log("   1. Grant ALTER privileges to your user, OR");
          console.log("   2. Manually run these SQL commands:");
          console.log(
            `      ALTER TABLE areas ADD COLUMN ${columnName} ${
              columnName === "area_name"
                ? "VARCHAR(255)"
                : columnName === "address"
                ? "TEXT"
                : "VARCHAR(100)"
            };`
          );
          return;
        }
      }
    }

    // Show final table structure
    console.log("📋 Final table structure:");
    const [finalStructure] = await pool.execute("DESCRIBE areas");
    finalStructure.forEach((col) => {
      console.log(
        `  ${col.Field} - ${col.Type} (${
          col.Null === "YES" ? "NULL" : "NOT NULL"
        })`
      );
    });

    console.log("🎉 Areas table structure update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating areas table structure:", error);
    throw error;
  }
}

// Run the update
if (require.main === module) {
  updateAreasTableStructure()
    .then(() => {
      console.log("✅ Script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

module.exports = updateAreasTableStructure;
