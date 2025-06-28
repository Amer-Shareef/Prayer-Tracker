const { pool } = require("../config/database");

async function checkMeetingsTable() {
  console.log("🔍 Checking counselling_sessions table...");

  try {
    const connection = await pool.getConnection();

    // Check if table exists
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'counselling_sessions'
    `);

    if (tables.length === 0) {
      console.log("❌ counselling_sessions table does not exist!");
      console.log("🛠️ Run: node scripts/createMeetingsTable.js");
      return;
    }

    console.log("✅ counselling_sessions table exists");

    // Check table structure
    const [columns] = await connection.query(`
      DESCRIBE counselling_sessions
    `);

    console.log("📋 Table structure:");
    columns.forEach((col) => {
      console.log(
        `   ${col.Field}: ${col.Type} ${
          col.Null === "NO" ? "NOT NULL" : "NULL"
        }`
      );
    });

    // Check existing data
    const [data] = await connection.query("SELECT * FROM counselling_sessions");
    console.log(`📊 Found ${data.length} existing sessions`);

    if (data.length > 0) {
      console.log("📋 Sample data:");
      data.slice(0, 3).forEach((session) => {
        console.log(
          `   ID: ${session.id}, Member: ${session.member_name}, Date: ${session.scheduled_date}, Status: ${session.status}`
        );
      });
    }

    connection.release();
  } catch (error) {
    console.error("❌ Error checking table:", error.message);
  } finally {
    await pool.end();
  }
}

checkMeetingsTable();
