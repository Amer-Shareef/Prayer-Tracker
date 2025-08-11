const { pool } = require("../config/database.js");

async function testDatabase() {
  try {
    console.log("🔍 Testing database role configuration...");

    // Check role column
    const [result] = await pool.query("DESCRIBE users");
    const roleRow = result.find((r) => r.Field === "role");
    console.log("✅ Role column type:", roleRow.Type);

    // Test if WCM is in the enum
    if (roleRow.Type.includes("WCM")) {
      console.log("✅ WCM role is available in database");
    } else {
      console.log("❌ WCM role is NOT available in database");
      console.log("🔧 Run the updateDatabaseForWCM.js script to add it");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testDatabase();
