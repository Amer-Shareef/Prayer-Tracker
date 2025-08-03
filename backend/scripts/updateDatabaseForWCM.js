const { pool } = require("../config/database.js");

async function updateDatabaseForWCM() {
  try {
    console.log("🔄 Updating database to support all roles...");

    // Check current role column
    const [currentColumn] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `);

    console.log("📋 Current role column:", currentColumn[0].COLUMN_TYPE);

    // Update the role enum to include WCM
    console.log("🔧 Adding WCM role to database...");
    await pool.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('Member', 'WCM', 'Founder', 'SuperAdmin') 
      DEFAULT 'Member'
    `);

    // Verify the update
    const [updatedColumn] = await pool.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'role'
    `);

    console.log("✅ Updated role column:", updatedColumn[0].COLUMN_TYPE);

    // Check existing users
    const [users] = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY 
        CASE role 
          WHEN 'Member' THEN 1 
          WHEN 'WCM' THEN 2 
          WHEN 'Founder' THEN 3 
          WHEN 'SuperAdmin' THEN 4 
          ELSE 5 
        END
    `);

    console.log("\n📊 Current user distribution:");
    users.forEach((user) => {
      console.log(`   ${user.role}: ${user.count} users`);
    });

    console.log("\n🎉 Database update completed successfully!");
    console.log("📝 Role hierarchy: Member → WCM → Founder → SuperAdmin");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating database:", error.message);
    process.exit(1);
  }
}

updateDatabaseForWCM();
