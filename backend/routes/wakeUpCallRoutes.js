const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, authorizeRole } = require("../middleware/auth");
const { dbHealthCheck } = require("../middleware/dbHealthCheck");

const router = express.Router();

// POST - Record wake-up call response from mobile app
router.post("/wake-up-calls", dbHealthCheck, async (req, res) => {
  try {
    const { username, call_response, response_time, call_date, call_time } =
      req.body;

    console.log("📞 Recording wake-up call response:", {
      username,
      call_response,
      response_time,
    });

    // Validation
    if (!username || !call_response || !response_time) {
      return res.status(400).json({
        success: false,
        message: "Username, call_response, and response_time are required",
      });
    }

    // Validate call_response
    const validResponses = ["accepted", "declined", "no_answer"];
    if (!validResponses.includes(call_response)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid call_response. Must be: accepted, declined, or no_answer",
      });
    }

    // Get user information
    const [userInfo] = await pool.execute(
      `
      SELECT u.id, u.username, u.phone, u.mosque_id,
             CONCAT(UPPER(LEFT(COALESCE(u.area, 'GEN'), 2)), LPAD(u.id, 4, '0')) as member_id
      FROM users u 
      WHERE u.username = ? AND u.status = 'active'
    `,
      [username]
    );

    if (userInfo.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or inactive",
      });
    }

    const user = userInfo[0];

    // Parse dates and times
    const parsedResponseTime = new Date(response_time);
    const parsedCallDate = call_date ? new Date(call_date) : new Date();
    const parsedCallTime = call_time || "04:30:00";

    // Check for duplicate entry (same user, same date, same prayer)
    const [existingCall] = await pool.execute(
      `
      SELECT id FROM wake_up_calls 
      WHERE user_id = ? AND call_date = ? AND prayer_type = 'Fajr'
    `,
      [user.id, parsedCallDate.toISOString().split("T")[0]]
    );

    if (existingCall.length > 0) {
      // Update existing record
      await pool.execute(
        `
        UPDATE wake_up_calls 
        SET call_response = ?, response_time = ?, call_time = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        [call_response, parsedResponseTime, parsedCallTime, existingCall[0].id]
      );

      console.log(`✅ Updated existing wake-up call record for ${username}`);
    } else {
      // Insert new record
      await pool.execute(
        `
        INSERT INTO wake_up_calls 
        (user_id, username, call_response, response_time, call_date, call_time, prayer_type, member_id, phone, mosque_id)
        VALUES (?, ?, ?, ?, ?, ?, 'Fajr', ?, ?, ?)
      `,
        [
          user.id,
          user.username,
          call_response,
          parsedResponseTime,
          parsedCallDate.toISOString().split("T")[0],
          parsedCallTime,
          user.member_id,
          user.phone,
          user.mosque_id,
        ]
      );

      console.log(`✅ Created new wake-up call record for ${username}`);
    }

    // Get the final record to return
    const [finalRecord] = await pool.execute(
      `
      SELECT wc.*, m.name as mosque_name
      FROM wake_up_calls wc
      LEFT JOIN mosques m ON wc.mosque_id = m.id
      WHERE wc.user_id = ? AND wc.call_date = ? AND wc.prayer_type = 'Fajr'
      ORDER BY wc.created_at DESC LIMIT 1
    `,
      [user.id, parsedCallDate.toISOString().split("T")[0]]
    );

    res.status(201).json({
      success: true,
      message: "Wake-up call response recorded successfully",
      data: finalRecord[0],
    });
  } catch (error) {
    console.error("❌ Error recording wake-up call:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record wake-up call response",
      error: error.message,
    });
  }
});

// GET - Retrieve all wake-up call records (for founder dashboard)
router.get(
  "/wake-up-calls",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { date, status, prayer_type, limit = 100, offset = 0 } = req.query;

      console.log("📞 Fetching wake-up calls with filters:", {
        date,
        status,
        prayer_type,
        limit,
        offset,
      });

      let query = `
      SELECT wc.*, m.name as mosque_name
      FROM wake_up_calls wc
      LEFT JOIN mosques m ON wc.mosque_id = m.id
      WHERE 1=1
    `;
      const queryParams = [];

      // Add filters
      if (date) {
        query += " AND wc.call_date = ?";
        queryParams.push(date);
      }

      if (status) {
        query += " AND wc.call_response = ?";
        queryParams.push(status);
      }

      if (prayer_type) {
        query += " AND wc.prayer_type = ?";
        queryParams.push(prayer_type);
      }

      query += " ORDER BY wc.call_date DESC, wc.response_time DESC";

      console.log("🔍 SQL Query:", query);
      console.log("📋 Query params before limit:", queryParams);

      // Execute query first WITHOUT LIMIT to avoid parameter binding issues
      const [allResults] = await pool.execute(query, queryParams);

      // Apply LIMIT and OFFSET in JavaScript instead of SQL
      const limitValue = parseInt(limit, 10) || 100;
      const offsetValue = parseInt(offset, 10) || 0;

      const results = allResults.slice(offsetValue, offsetValue + limitValue);

      console.log(
        `✅ Found ${allResults.length} total wake-up call records, returning ${results.length} with limit ${limitValue}, offset ${offsetValue}`
      );

      res.json({
        success: true,
        data: results,
        pagination: {
          total: allResults.length,
          limit: limitValue,
          offset: offsetValue,
          hasMore: offsetValue + results.length < allResults.length,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching wake-up calls:", error);
      console.error("Full error details:", {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sql: error.sql,
      });

      res.status(500).json({
        success: false,
        message: "Failed to fetch wake-up calls",
        error: error.message,
      });
    }
  }
);

// GET - Statistics endpoint
router.get(
  "/wake-up-calls/stats",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { date_from, date_to } = req.query;

      let whereClause = "";
      const queryParams = [];

      if (date_from && date_to) {
        whereClause = "WHERE call_date BETWEEN ? AND ?";
        queryParams.push(date_from, date_to);
      } else if (date_from) {
        whereClause = "WHERE call_date >= ?";
        queryParams.push(date_from);
      } else {
        // Default to last 30 days
        whereClause = "WHERE call_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
      }

      const [stats] = await pool.execute(
        `
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN call_response = 'accepted' THEN 1 END) as accepted_calls,
        COUNT(CASE WHEN call_response = 'declined' THEN 1 END) as declined_calls,
        COUNT(CASE WHEN call_response = 'no_answer' THEN 1 END) as no_answer_calls,
        ROUND(COUNT(CASE WHEN call_response = 'accepted' THEN 1 END) / COUNT(*) * 100, 2) as acceptance_rate
      FROM wake_up_calls ${whereClause}
    `,
        queryParams
      );

      res.json({
        success: true,
        data: stats[0],
      });
    } catch (error) {
      console.error("❌ Error fetching wake-up call stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch statistics",
        error: error.message,
      });
    }
  }
);

module.exports = router;
