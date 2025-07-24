const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:5000";
const JWT_TOKEN = "YOUR_JWT_TOKEN_HERE"; // Replace with actual token

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${JWT_TOKEN}`,
};

async function testAPIs() {
  console.log("🧪 Testing Prayer Tracker APIs");
  console.log("===============================\n");

  try {
    // Test 1: Record daily prayers (complete day)
    console.log("📝 Test 1: Recording complete daily prayers...");
    const dailyPrayersResponse = await axios.post(
      `${BASE_URL}/prayers`,
      {
        prayer_date: "2025-01-20",
        fajr: true,
        dhuhr: true,
        asr: true,
        maghrib: true,
        isha: true,
        notes: "Alhamdulillah for this blessed day",
        zikr_count: 100,
        quran_minutes: 30,
      },
      { headers }
    );

    console.log("✅ Daily prayers recorded:", dailyPrayersResponse.data);
    console.log("");

    // Test 2: Update individual prayer
    console.log("🔄 Test 2: Updating individual prayer...");
    const individualPrayerResponse = await axios.patch(
      `${BASE_URL}/prayers/individual`,
      {
        prayer_date: "2025-01-20",
        prayer_type: "asr",
        prayed: false,
      },
      { headers }
    );

    console.log("✅ Individual prayer updated:", individualPrayerResponse.data);
    console.log("");

    // Test 3: Partial day update
    console.log("📅 Test 3: Recording partial day prayers...");
    const partialDayResponse = await axios.post(
      `${BASE_URL}/prayers`,
      {
        prayer_date: "2025-01-21",
        fajr: true,
        dhuhr: false,
        notes: "Missed Dhuhr due to meeting",
      },
      { headers }
    );

    console.log("✅ Partial day recorded:", partialDayResponse.data);
    console.log("");

    // Test 4: Get prayers for specific date
    console.log("📖 Test 4: Fetching prayers for specific date...");
    const specificDateResponse = await axios.get(
      `${BASE_URL}/prayers?date=2025-01-20`,
      { headers }
    );

    console.log("✅ Prayers fetched:", specificDateResponse.data);
    console.log("");

    // Test 5: Get prayer statistics
    console.log("📊 Test 5: Fetching prayer statistics...");
    const statsResponse = await axios.get(
      `${BASE_URL}/prayers/stats?period=7`,
      { headers }
    );

    console.log(
      "✅ Statistics fetched:",
      JSON.stringify(statsResponse.data, null, 2)
    );
    console.log("");

    // Test 6: Get monthly prayers
    console.log("📅 Test 6: Fetching monthly prayers...");
    const monthlyResponse = await axios.get(
      `${BASE_URL}/prayers?month=1&year=2025`,
      { headers }
    );

    console.log("✅ Monthly prayers fetched:", monthlyResponse.data);
    console.log("");

    console.log("🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

// Individual test functions for specific scenarios
async function testScenarios() {
  console.log("\n🔬 Testing Specific Scenarios");
  console.log("===============================\n");

  try {
    // Scenario 1: User starts the day and marks Fajr
    console.log("🌅 Scenario 1: Starting day with Fajr...");
    await axios.patch(
      `${BASE_URL}/prayers/individual`,
      {
        prayer_date: "2025-01-22",
        prayer_type: "fajr",
        prayed: true,
      },
      { headers }
    );
    console.log("✅ Fajr marked");

    // Scenario 2: Add Dhuhr later
    console.log("☀️ Scenario 2: Adding Dhuhr...");
    await axios.patch(
      `${BASE_URL}/prayers/individual`,
      {
        prayer_date: "2025-01-22",
        prayer_type: "dhuhr",
        prayed: true,
      },
      { headers }
    );
    console.log("✅ Dhuhr marked");

    // Scenario 3: Complete the day in one go
    console.log("🌆 Scenario 3: Completing the rest of day...");
    const finalUpdate = await axios.post(
      `${BASE_URL}/prayers`,
      {
        prayer_date: "2025-01-22",
        asr: true,
        maghrib: true,
        isha: false,
        notes: "Missed Isha due to sleep",
        zikr_count: 75,
        quran_minutes: 20,
      },
      { headers }
    );
    console.log("✅ Day completed:", finalUpdate.data);

    // Scenario 4: Check final state
    console.log("📋 Scenario 4: Checking final state...");
    const finalState = await axios.get(`${BASE_URL}/prayers?date=2025-01-22`, {
      headers,
    });
    console.log("✅ Final state:", finalState.data);
  } catch (error) {
    console.error(
      "❌ Scenario test failed:",
      error.response?.data || error.message
    );
  }
}

// Run tests if called directly
if (require.main === module) {
  console.log("⚠️  Make sure to:");
  console.log("1. Replace JWT_TOKEN with a valid token");
  console.log("2. Ensure the server is running on localhost:5000");
  console.log("3. Run the migration script first\n");

  testAPIs()
    .then(() => testScenarios())
    .then(() => {
      console.log("\n🏁 All tests completed!");
    })
    .catch((error) => {
      console.error("❌ Test suite failed:", error);
    });
}

module.exports = { testAPIs, testScenarios };
