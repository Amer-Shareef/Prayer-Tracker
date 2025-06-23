const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// GET all feeds - FIXED version using direct query
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log("📋 Fetching all feeds");

    // Get mosque_id from the authenticated user
    const { user } = req;

    // Get mosque_id from query params or from the user
    let mosqueId;
    if (req.query.mosque_id) {
      mosqueId = parseInt(req.query.mosque_id);
    } else {
      const [userRows] = await pool.execute(
        "SELECT mosque_id FROM users WHERE id = ?",
        [user.id]
      );

      if (userRows.length === 0 || !userRows[0].mosque_id) {
        return res.status(400).json({
          success: false,
          message: "No mosque associated with this user",
        });
      }

      mosqueId = userRows[0].mosque_id;
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Use direct query
    const queryString = `
      SELECT f.*, 
             u.username as author_name,
             u.full_name as author_full_name,
             m.name as mosque_name
      FROM feeds f
      LEFT JOIN users u ON f.author_id = u.id
      LEFT JOIN mosques m ON f.mosque_id = m.id
      WHERE f.mosque_id = ${mosqueId} AND f.is_active = TRUE
      ORDER BY f.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [feeds] = await pool.query(queryString);

    const [countResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM feeds WHERE mosque_id = ? AND is_active = TRUE",
      [mosqueId]
    );

    const totalFeeds = countResult[0].total;
    const totalPages = Math.ceil(totalFeeds / limit);

    res.json({
      success: true,
      data: feeds,
      pagination: {
        total: totalFeeds,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching feeds:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feeds",
      error: error.message,
    });
  }
});

// GET single feed by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute("UPDATE feeds SET views = views + 1 WHERE id = ?", [id]);

    const [feeds] = await pool.execute(
      `
      SELECT f.*, u.username AS author_name, u.full_name AS author_full_name, m.name AS mosque_name
      FROM feeds f
      LEFT JOIN users u ON f.author_id = u.id
      LEFT JOIN mosques m ON f.mosque_id = m.id
      WHERE f.id = ?
    `,
      [id]
    );

    if (feeds.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Feed not found" });
    }

    res.json({ success: true, data: feeds[0] });
  } catch (error) {
    console.error("❌ Error fetching feed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch feed",
      error: error.message,
    });
  }
});

// CREATE new feed
router.post(
  "/",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const {
        title,
        content,
        priority,
        expires_at,
        send_notification,
        image_url,
      } = req.body;
      const { user } = req;

      if (!title || !content) {
        return res
          .status(400)
          .json({ success: false, message: "Title and content are required" });
      }

      const [userRows] = await pool.execute(
        "SELECT mosque_id FROM users WHERE id = ?",
        [user.id]
      );
      if (!userRows.length || !userRows[0].mosque_id) {
        return res.status(400).json({
          success: false,
          message: "No mosque associated with this user",
        });
      }

      const mosqueId = userRows[0].mosque_id;

      const [result] = await pool.execute(
        `
      INSERT INTO feeds (title, content, priority, author_id, mosque_id, image_url, expires_at, send_notification)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          title,
          content,
          priority || "normal",
          user.id,
          mosqueId,
          image_url || null,
          expires_at || null,
          send_notification ? 1 : 0,
        ]
      );

      const [newFeed] = await pool.execute(
        `
      SELECT f.*, u.username AS author_name, u.full_name AS author_full_name, m.name AS mosque_name
      FROM feeds f
      LEFT JOIN users u ON f.author_id = u.id
      LEFT JOIN mosques m ON f.mosque_id = m.id
      WHERE f.id = ?
    `,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: "Feed created successfully",
        data: newFeed[0],
      });
    } catch (error) {
      console.error("❌ Error creating feed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create feed",
        error: error.message,
      });
    }
  }
);

// UPDATE feed
router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        content,
        priority,
        expires_at,
        send_notification,
        image_url,
        is_active,
      } = req.body;
      const { user } = req;

      if (!title || !content) {
        return res
          .status(400)
          .json({ success: false, message: "Title and content are required" });
      }

      const [feeds] = await pool.execute(
        `
      SELECT f.* FROM feeds f
      JOIN users u ON f.mosque_id = u.mosque_id
      WHERE f.id = ? AND u.id = ?
    `,
        [id, user.id]
      );

      if (!feeds.length) {
        return res.status(404).json({
          success: false,
          message: "Feed not found or not authorized",
        });
      }

      await pool.execute(
        `
      UPDATE feeds SET title = ?, content = ?, priority = ?, image_url = ?, expires_at = ?, send_notification = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
        [
          title,
          content,
          priority || "normal",
          image_url || null,
          expires_at || null,
          send_notification ? 1 : 0,
          is_active !== undefined ? (is_active ? 1 : 0) : 1,
          id,
        ]
      );

      const [updatedFeed] = await pool.execute(
        `
      SELECT f.*, u.username AS author_name, u.full_name AS author_full_name, m.name AS mosque_name
      FROM feeds f
      LEFT JOIN users u ON f.author_id = u.id
      LEFT JOIN mosques m ON f.mosque_id = m.id
      WHERE f.id = ?
    `,
        [id]
      );

      res.json({
        success: true,
        message: "Feed updated successfully",
        data: updatedFeed[0],
      });
    } catch (error) {
      console.error("❌ Error updating feed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update feed",
        error: error.message,
      });
    }
  }
);

// DELETE feed (soft delete)
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user } = req;

      const [feeds] = await pool.execute(
        `
      SELECT f.* FROM feeds f
      JOIN users u ON f.mosque_id = u.mosque_id
      WHERE f.id = ? AND u.id = ?
    `,
        [id, user.id]
      );

      if (!feeds.length) {
        return res.status(404).json({
          success: false,
          message: "Feed not found or not authorized",
        });
      }

      await pool.execute(
        "UPDATE feeds SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );

      res.json({ success: true, message: "Feed deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting feed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete feed",
        error: error.message,
      });
    }
  }
);

module.exports = router;
