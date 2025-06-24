require("dotenv").config();
const { pool } = require("../config/database");

async function cleanupCurrentPickupRequests() {
  console.log("🧹 Cleaning Up Current Pickup Requests");
  console.log("=====================================");

  try {
    // Show current requests
    console.log("📊 Current pickup requests:");
    const [currentRequests] = await pool.execute(
      "SELECT id, user_id, pickup_location, status, created_at FROM pickup_requests ORDER BY created_at DESC"
    );

    currentRequests.forEach((req) => {
      console.log(
        `   ID: ${req.id}, User: ${req.user_id}, Location: ${req.pickup_location}, Status: ${req.status}`
      );
    });

    // Delete all current requests to start fresh
    console.log("\n🗑️  Deleting all current pickup requests...");
    const [deleteResult] = await pool.execute("DELETE FROM pickup_requests");

    console.log(`✅ Deleted ${deleteResult.affectedRows} pickup requests`);
    console.log("\n🎉 Now you can create new pickup requests!");
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
  } finally {
    await pool.end();
  }
}

cleanupCurrentPickupRequests();
