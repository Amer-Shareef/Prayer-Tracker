const { pool } = require("../config/database.js");

async function checkUserTable() {
  try {
    console.log("🔍 Checking users table structure...");

    // Check the users table structure
    const [describe] = await pool.query("DESCRIBE users");
    console.log("\nUsers table structure:");
    console.table(describe);

    // Check current roles
    const [roles] = await pool.query(
      "SELECT DISTINCT role FROM users WHERE role IS NOT NULL"
    );
    console.log("\nCurrent roles in database:");
    roles.forEach((r) => console.log(`- ${r.role}`));

    // Check if role column has enum constraint
    const [constraints] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `);

    if (constraints.length > 0) {
      console.log("\nRole column type:", constraints[0].COLUMN_TYPE);
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await pool.end();
    process.exit(1);
  }
}

checkUserTable();
