const { pool } = require("../config/database.js");

async function promoteToWCM() {
  const username = process.argv[2];

  if (!username) {
    console.log("Usage: node promoteToWCM.js <username>");
    console.log("Example: node promoteToWCM.js john_doe");
    process.exit(1);
  }

  try {
    console.log(`🔄 Promoting user "${username}" to WCM role...`);

    // Check if user exists
    const [users] = await pool.query(
      "SELECT id, username, role FROM users WHERE username = ?",
      [username]
    );

    if (users.length === 0) {
      console.log(`❌ User "${username}" not found.`);
      process.exit(1);
    }

    const user = users[0];
    console.log(`📋 Current user: ${user.username} (${user.role})`);

    if (user.role === "WCM") {
      console.log(`✅ User "${username}" is already a WCM.`);
      process.exit(0);
    }

    // Update user role to WCM
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [
      "WCM",
      user.id,
    ]);

    // Verify the update
    const [updatedUsers] = await pool.query(
      "SELECT username, role FROM users WHERE id = ?",
      [user.id]
    );

    console.log(
      `✅ Successfully promoted "${username}" from ${user.role} to ${updatedUsers[0].role}`
    );
    console.log("🔧 Backend: User now has Founder-level API access");
    console.log("🌐 Frontend: User will see Member-level UI in web app");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error promoting user:", error.message);
    process.exit(1);
  }
}

promoteToWCM();
