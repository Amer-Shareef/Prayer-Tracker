const { pool } = require("../config/database.js");

async function addWCMRole() {
  try {
    console.log("🔄 Starting WCM role addition...");

    // First, check the current role column type
    const [columnInfo] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `);

    if (columnInfo.length > 0) {
      console.log("Current role column type:", columnInfo[0].COLUMN_TYPE);
    }

    // Add WCM to the enum if it's not already there
    console.log("🔧 Adding WCM to role enum...");
    await pool.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('Member', 'WCM', 'Founder', 'SuperAdmin') 
      DEFAULT 'Member'
    `);

    // Verify the change
    const [newColumnInfo] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `);

    console.log("✅ Updated role column type:", newColumnInfo[0].COLUMN_TYPE);

    // Check if there are any existing users we might want to convert
    const [userCounts] = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    console.log("\n📊 Current user role distribution:");
    userCounts.forEach((r) => console.log(`- ${r.role}: ${r.count} users`));

    console.log("\n✅ WCM role has been successfully added to the database!");
    console.log("🔄 You can now assign users the WCM role in the system.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding WCM role:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

addWCMRole();
