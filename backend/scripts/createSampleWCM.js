const { pool } = require("../config/database.js");

async function createSampleWCMUser() {
  try {
    console.log("🧪 Creating sample WCM user for testing...");

    // Check if sample user already exists
    const [existing] = await pool.query(
      "SELECT id, username, role FROM users WHERE username = ?",
      ["sample_wcm_test"]
    );

    if (existing.length > 0) {
      console.log("✅ Sample WCM user already exists:", existing[0]);
      return;
    }

    // Create sample WCM user
    const [result] = await pool.query(
      `
      INSERT INTO users (
        username, full_name, email, phone, password, role, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        "sample_wcm_test",
        "Sample WCM User",
        "wcm.test@example.com",
        "+94771234567",
        "$2b$10$dummyhashjustfortesting",
        "WCM",
        "active",
      ]
    );

    console.log("✅ Created sample WCM user with ID:", result.insertId);

    // Verify creation
    const [verify] = await pool.query(
      "SELECT id, username, full_name, role FROM users WHERE id = ?",
      [result.insertId]
    );

    console.log("✅ Verification:", verify[0]);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createSampleWCMUser();
