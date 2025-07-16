const express = require("express");
const { pool } = require("../config/database"); // Fixed import - use database.js
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// Get announcements
router.get("/announcements", authenticateToken, async (req, res) => {
  try {
    const { user } = req;

    let query = `
      SELECT a.*, u.username as author_name, m.name as mosque_name
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      JOIN mosques m ON a.mosque_id = m.id
      WHERE a.is_active = 1
    `;
    let queryParams = [];

    // Filter by user's mosque unless SuperAdmin
    if (user.role !== "SuperAdmin") {
      query += " AND a.mosque_id = ?";
      queryParams.push(user.mosque_id);
    }

    query += " ORDER BY a.priority DESC, a.created_at DESC";

    const [announcements] = await pool.execute(query, queryParams);

    res.json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
      error: error.message,
    });
  }
});

// Create announcement
router.post(
  "/announcements",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { title, content, priority = "medium", expires_at } = req.body;
      const { user } = req;

      // Validation
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: "Title and content are required",
        });
      }

      // Get mosque_id
      let mosqueId = user.mosque_id;
      if (user.role === "SuperAdmin" && req.body.mosque_id) {
        mosqueId = req.body.mosque_id;
      }

      // Insert announcement
      const [result] = await pool.execute(
        `INSERT INTO announcements (mosque_id, title, content, author_id, priority, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [mosqueId, title, content, user.id, priority, expires_at || null]
      );

      // Fetch created announcement
      const [newAnnouncement] = await pool.execute(
        `SELECT a.*, u.username as author_name, m.name as mosque_name
       FROM announcements a
       JOIN users u ON a.author_id = u.id
       JOIN mosques m ON a.mosque_id = m.id
       WHERE a.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: "Announcement created successfully",
        data: newAnnouncement[0],
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create announcement",
        error: error.message,
      });
    }
  }
);

// Update announcement
router.put(
  "/announcements/:id",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, priority, is_active, expires_at } = req.body;
      const { user } = req;

      // Check if user can modify this announcement
      let checkQuery = "SELECT * FROM announcements WHERE id = ?";
      let checkParams = [id];

      if (user.role === "Founder") {
        // Founder can only edit announcements from their mosque that they authored
        checkQuery += " AND mosque_id = ? AND author_id = ?";
        checkParams.push(user.mosque_id, user.id);
      }
      // SuperAdmin can edit any announcement (no additional WHERE clause)

      const [announcement] = await pool.execute(checkQuery, checkParams);

      if (announcement.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Announcement not found or access denied",
        });
      }

      // Update announcement
      const [result] = await pool.execute(
        `UPDATE announcements SET title = ?, content = ?, priority = ?, is_active = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
        [title, content, priority, is_active, expires_at, id]
      );

      // Fetch updated announcement
      const [updatedAnnouncement] = await pool.execute(
        `SELECT a.*, u.username as author_name, m.name as mosque_name
       FROM announcements a
       JOIN users u ON a.author_id = u.id
       JOIN mosques m ON a.mosque_id = m.id
       WHERE a.id = ?`,
        [id]
      );

      res.json({
        success: true,
        message: "Announcement updated successfully",
        data: updatedAnnouncement[0],
      });
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update announcement",
        error: error.message,
      });
    }
  }
);

// Delete announcement
router.delete(
  "/announcements/:id",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user } = req;

      // Check if user can delete this announcement
      let checkQuery = "SELECT * FROM announcements WHERE id = ?";
      let checkParams = [id];

      if (user.role === "Founder") {
        // Founder can only delete announcements from their mosque that they authored
        checkQuery += " AND mosque_id = ? AND author_id = ?";
        checkParams.push(user.mosque_id, user.id);
      }
      // SuperAdmin can delete any announcement (no additional WHERE clause)

      const [announcement] = await pool.execute(checkQuery, checkParams);

      if (announcement.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Announcement not found or access denied",
        });
      }

      // Delete announcement
      await pool.execute("DELETE FROM announcements WHERE id = ?", [id]);

      res.json({
        success: true,
        message: "Announcement deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete announcement",
        error: error.message,
      });
    }
  }
);

module.exports = router;
