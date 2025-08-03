const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { dbHealthCheck } = require("../middleware/dbHealthCheck");
const {
  getPrayers,
  recordDailyPrayers,
  updateIndividualPrayer,
  getPrayerStats,
} = require("../controllers/prayerController");

const router = express.Router();

// Add health check middleware to critical routes
router.use(dbHealthCheck);

// Get user's prayers
router.get("/prayers", authenticateToken, getPrayers);

// Get ALL prayer records for the logged-in user
router.get("/prayers/all", authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { pool } = require("../config/database");

    console.log("📥 Fetching ALL prayer records for user:", user.id);

    // Get all prayer records for the user
    const [prayers] = await pool.execute(
      `SELECT 
        prayer_date,
        fajr,
        dhuhr,
        asr,
        maghrib,
        isha,
        zikr_count,
        quran_minutes
       FROM prayers 
       WHERE user_id = ? 
       ORDER BY prayer_date DESC`,
      [user.id]
    );

    console.log("📤 Found prayer records:", prayers.length);

    res.json({
      success: true,
      count: prayers.length,
      data: prayers.map(prayer => ({
        prayer_date: prayer.prayer_date,
        fajr: prayer.fajr,
        dhuhr: prayer.dhuhr,
        asr: prayer.asr,
        maghrib: prayer.maghrib,
        isha: prayer.isha,
        zikr_count: prayer.zikr_count,
        quran_minutes: prayer.quran_minutes
      }))
    });
  } catch (error) {
    console.error("❌ Error fetching all prayers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all prayer records",
      error: error.message
    });
  }
});

// Record daily prayers (complete or partial update)
router.post("/prayers", authenticateToken, recordDailyPrayers);

// Update individual prayer
router.patch("/prayers/individual", authenticateToken, updateIndividualPrayer);

// Get prayer statistics
router.get("/prayers/stats", authenticateToken, getPrayerStats);

module.exports = router;
