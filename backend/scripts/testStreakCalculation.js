require("dotenv").config();
const { pool } = require("../config/database");

async function testStreakCalculation() {
  console.log("🧪 Testing Prayer Streak Calculation");
  console.log("====================================");

  try {
    const testUserId = 1; // testmember user ID

    // Test 1: Show all recent prayers
    console.log("1. Recent prayer data:");
    const [recentPrayers] = await pool.execute(
      `SELECT prayer_date, prayer_type, status 
       FROM prayers 
       WHERE user_id = ? 
       AND prayer_date >= DATE_SUB(CURDATE(), INTERVAL 10 DAY)
       ORDER BY prayer_date DESC, prayer_type`,
      [testUserId]
    );

    console.log("Recent prayers:");
    const groupedPrayers = {};
    recentPrayers.forEach((p) => {
      const date = p.prayer_date.toISOString().split("T")[0];
      if (!groupedPrayers[date]) groupedPrayers[date] = [];
      groupedPrayers[date].push(`${p.prayer_type}:${p.status}`);
    });

    Object.entries(groupedPrayers).forEach(([date, prayers]) => {
      console.log(`   ${date}: ${prayers.join(", ")}`);
    });

    // Test 2: Find last missed prayer
    console.log("\n2. Finding last missed prayer:");
    const [lastMissed] = await pool.execute(
      `SELECT COALESCE(MAX(prayer_date), '1970-01-01') as last_missed_date
       FROM prayers 
       WHERE user_id = ? 
       AND prayer_date <= CURDATE()
       AND status = 'missed'`,
      [testUserId]
    );

    const lastMissedDate = lastMissed[0]?.last_missed_date;
    console.log(`   Last missed prayer date: ${lastMissedDate}`);

    // Test 3: Find complete days since last missed
    console.log("\n3. Complete prayer days since last missed:");
    const [completeDays] = await pool.execute(
      `SELECT prayer_date, 
              COUNT(*) as total_prayers,
              COUNT(CASE WHEN status = 'prayed' THEN 1 END) as completed_prayers,
              GROUP_CONCAT(CONCAT(prayer_type, ':', status) ORDER BY prayer_type) as prayer_details
       FROM prayers 
       WHERE user_id = ? 
       AND prayer_date > ?
       AND prayer_date <= CURDATE()
       GROUP BY prayer_date
       ORDER BY prayer_date DESC`,
      [testUserId, lastMissedDate]
    );

    console.log("Days with prayer data:");
    completeDays.forEach((day) => {
      const isComplete = day.total_prayers === 5 && day.completed_prayers === 5;
      const date = day.prayer_date.toISOString().split("T")[0];
      console.log(
        `   ${date}: ${day.completed_prayers}/${day.total_prayers} prayers ${
          isComplete ? "✅" : "❌"
        }`
      );
      console.log(`      Details: ${day.prayer_details}`);
    });

    // Test 4: Calculate streak manually
    console.log("\n4. Manual streak calculation:");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    // Find complete days
    const completeDaysOnly = completeDays.filter(
      (day) => day.total_prayers === 5 && day.completed_prayers === 5
    );

    console.log(`   Found ${completeDaysOnly.length} complete days`);

    // Check consecutive days backwards from today
    for (let i = 0; i < completeDaysOnly.length; i++) {
      const dayDate = new Date(completeDaysOnly[i].prayer_date);
      dayDate.setHours(0, 0, 0, 0);

      console.log(
        `   Checking: ${dayDate.toISOString().split("T")[0]} vs ${
          currentDate.toISOString().split("T")[0]
        }`
      );

      if (
        dayDate.getTime() === currentDate.getTime() ||
        (i === 0 &&
          dayDate.getTime() === currentDate.getTime() - 24 * 60 * 60 * 1000)
      ) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
        console.log(`     ✅ Consecutive day found. Streak: ${streak}`);
      } else {
        console.log(`     ❌ Gap found. Breaking streak.`);
        break;
      }
    }

    console.log(`\n🎯 Final calculated streak: ${streak} days`);

    // Test 5: Test the API
    console.log("\n5. Testing stats API:");
    try {
      const response = await fetch(
        "http://13.60.193.171:5000/api/prayers/stats",
        {
          headers: {
            Authorization: "Bearer your_token_here", // You'll need to get this from login
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("   API Response:", JSON.stringify(data.data, null, 2));
      } else {
        console.log("   API call failed - test with Postman or frontend");
      }
    } catch (apiError) {
      console.log("   API test skipped - server might not be running");
    }

    console.log("\n🎉 Streak calculation test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await pool.end();
  }
}

testStreakCalculation();
