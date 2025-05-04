const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { isAuthenticated, hasRole } = require("../middleware/auth");

// GET: Root API endpoint
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Prayer Tracker API" });
});

// GET: Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Example prayer endpoint (to be expanded later) - Requires authentication
router.get("/prayers", isAuthenticated, async (req, res) => {
  try {
    // This is a placeholder that will be implemented with actual DB queries
    res.json({
      message: "Prayer endpoint placeholder",
      prayers: [],
    });
  } catch (error) {
    console.error("Error fetching prayers:", error);
    res.status(500).json({ error: "Failed to fetch prayers" });
  }
});

// Admin-only route example
router.get(
  "/admin/users",
  isAuthenticated,
  hasRole("SuperAdmin"),
  async (req, res) => {
    try {
      const [users] = await pool.execute(`
      SELECT u.id, u.username, r.name as role, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `);

      res.json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

// Route accessible by SuperAdmin and Founder
router.get(
  "/mosques",
  isAuthenticated,
  hasRole(["SuperAdmin", "Founder"]),
  async (req, res) => {
    try {
      const [mosques] = await pool.execute("SELECT * FROM mosques");
      res.json({ mosques });
    } catch (error) {
      console.error("Error fetching mosques:", error);
      res.status(500).json({ error: "Failed to fetch mosques" });
    }
  }
);

module.exports = router;
