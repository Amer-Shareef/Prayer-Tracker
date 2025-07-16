const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// GET all feeds - FIXED version using direct query
router.get("/", authenticateToken, async (req, res) => {
  try {
    console.log("📋 Fetching all feeds"); // Get mosque_id from the authenticated user
    const { user } = req;

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let queryString;
    let queryParams = [];
    let countQuery;
    let countParams = [];

    if (user.role === "SuperAdmin") {
      // SuperAdmin can see all feeds or filter by mosque_id if provided
      if (req.query.mosque_id) {
        const mosqueId = parseInt(req.query.mosque_id);
        queryString = `
          SELECT f.*, 
                 u.username as author_name,
                 u.full_name as author_full_name,
                 m.name as mosque_name
          FROM feeds f
          LEFT JOIN users u ON f.author_id = u.id
          LEFT JOIN mosques m ON f.mosque_id = m.id
          WHERE f.mosque_id = ? AND f.is_active = TRUE
          ORDER BY f.created_at DESC
          LIMIT ? OFFSET ?
        `;
        queryParams = [mosqueId, limit, offset];
        countQuery =
          "SELECT COUNT(*) as total FROM feeds WHERE mosque_id = ? AND is_active = TRUE";
        countParams = [mosqueId];
      } else {
        // Show all feeds for SuperAdmin
        queryString = `
          SELECT f.*, 
                 u.username as author_name,
                 u.full_name as author_full_name,
                 m.name as mosque_name
          FROM feeds f
          LEFT JOIN users u ON f.author_id = u.id
          LEFT JOIN mosques m ON f.mosque_id = m.id
          WHERE f.is_active = TRUE
          ORDER BY f.created_at DESC
          LIMIT ? OFFSET ?
        `;
        queryParams = [limit, offset];
        countQuery =
          "SELECT COUNT(*) as total FROM feeds WHERE is_active = TRUE";
        countParams = [];
      }
    } else {
      // For Founder and Member, get mosque_id from user
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

      queryString = `
        SELECT f.*, 
               u.username as author_name,
               u.full_name as author_full_name,
               m.name as mosque_name
        FROM feeds f
        LEFT JOIN users u ON f.author_id = u.id
        LEFT JOIN mosques m ON f.mosque_id = m.id
        WHERE f.mosque_id = ? AND f.is_active = TRUE
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
      `;
      queryParams = [mosqueId, limit, offset];
      countQuery =
        "SELECT COUNT(*) as total FROM feeds WHERE mosque_id = ? AND is_active = TRUE";
      countParams = [mosqueId];
    }

    const [feeds] = await pool.query(queryString, queryParams);
    const [countResult] = await pool.execute(countQuery, countParams);

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

      let mosqueId;

      if (user.role === "SuperAdmin") {
        // SuperAdmin can specify mosque_id in request body or use their own
        if (req.body.mosque_id) {
          mosqueId = req.body.mosque_id;
        } else {
          const [userRows] = await pool.execute(
            "SELECT mosque_id FROM users WHERE id = ?",
            [user.id]
          );
          if (!userRows.length || !userRows[0].mosque_id) {
            return res.status(400).json({
              success: false,
              message:
                "SuperAdmin must specify mosque_id or have a default mosque associated",
            });
          }
          mosqueId = userRows[0].mosque_id;
        }
      } else {
        // Founder uses their mosque
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
        mosqueId = userRows[0].mosque_id;
      }

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

      // Check access permissions
      let accessQuery, accessParams;

      if (user.role === "SuperAdmin") {
        // SuperAdmin can edit any feed
        accessQuery = "SELECT f.* FROM feeds f WHERE f.id = ?";
        accessParams = [id];
      } else if (user.role === "Founder") {
        // Founder can only edit feeds from their mosque
        accessQuery = `
          SELECT f.* FROM feeds f
          JOIN users u ON f.mosque_id = u.mosque_id
          WHERE f.id = ? AND u.id = ?
        `;
        accessParams = [id, user.id];
      }

      const [feeds] = await pool.execute(accessQuery, accessParams);

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

      // Check access permissions
      let accessQuery, accessParams;

      if (user.role === "SuperAdmin") {
        // SuperAdmin can delete any feed
        accessQuery = "SELECT f.* FROM feeds f WHERE f.id = ?";
        accessParams = [id];
      } else if (user.role === "Founder") {
        // Founder can only delete feeds from their mosque
        accessQuery = `
          SELECT f.* FROM feeds f
          JOIN users u ON f.mosque_id = u.mosque_id
          WHERE f.id = ? AND u.id = ?
        `;
        accessParams = [id, user.id];
      }

      const [feeds] = await pool.execute(accessQuery, accessParams);

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
