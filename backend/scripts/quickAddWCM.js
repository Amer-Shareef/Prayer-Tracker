const { pool } = require("../config/database.js");

async function quickAddWCM() {
  try {
    console.log("🔄 Quick WCM role addition...");

    // Add WCM to the enum
    await pool.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('Member', 'WCM', 'Founder', 'SuperAdmin') 
      DEFAULT 'Member'
    `);

    console.log("✅ WCM role added successfully!");
    process.exit(0);
  } catch (error) {
    if (error.message.includes("Duplicate")) {
      console.log("✅ WCM role already exists!");
      process.exit(0);
    }
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

quickAddWCM();
