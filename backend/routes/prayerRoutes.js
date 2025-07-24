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

// Record daily prayers (complete or partial update)
router.post("/prayers", authenticateToken, recordDailyPrayers);

// Update individual prayer
router.patch("/prayers/individual", authenticateToken, updateIndividualPrayer);

// Get prayer statistics
router.get("/prayers/stats", authenticateToken, getPrayerStats);

module.exports = router;
