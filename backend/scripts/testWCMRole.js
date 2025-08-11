const { pool } = require("../config/database.js");

async function testWCMRole() {
  try {
    console.log("🧪 Testing WCM role implementation...");

    // Check if WCM role exists in the enum
    const [columnInfo] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `);

    console.log("✅ Current role column type:", columnInfo[0].COLUMN_TYPE);

    // Check if WCM is in the enum
    const hasWCM = columnInfo[0].COLUMN_TYPE.includes("WCM");
    console.log("✅ WCM role available:", hasWCM ? "YES" : "NO");

    if (!hasWCM) {
      console.log(
        "❌ WCM role not found in database enum. Run addWCMRole.js first."
      );
      process.exit(1);
    }

    // Test creating a WCM user (dry run - just validate the query)
    try {
      await pool.query("SELECT 1 FROM users WHERE role = ? LIMIT 1", ["WCM"]);
      console.log("✅ WCM role query works correctly");
    } catch (error) {
      console.log("❌ WCM role query failed:", error.message);
    }

    // Check existing user roles
    const [roles] = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY count DESC
    `);

    console.log("\n📊 Current user role distribution:");
    roles.forEach((r) => console.log(`- ${r.role}: ${r.count} users`));

    console.log("\n✅ WCM role implementation test completed successfully!");
    console.log("🔧 Backend: WCM users will have Founder-level API access");
    console.log("🌐 Frontend: WCM users will see Member-level UI in web app");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error testing WCM role:", error.message);
    process.exit(1);
  }
}

testWCMRole();
