const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

// GET /api/counselling-sessions - Get all counselling sessions
router.get("/", async (req, res) => {
  console.log("🔍 Getting counselling sessions");
  try {
    const connection = await pool.getConnection();
    const [sessions] = await connection.query(`
      SELECT cs.*, 
             u1.username as member_username,
             u1.full_name as member_full_name,
             u2.username as counsellor_username,
             u2.full_name as counsellor_full_name,
             m.name as mosque_name
      FROM counselling_sessions cs
      LEFT JOIN users u1 ON cs.member_id = u1.id
      LEFT JOIN users u2 ON cs.counsellor_id = u2.id
      LEFT JOIN mosques m ON cs.mosque_id = m.id
      ORDER BY cs.scheduled_date DESC, cs.scheduled_time ASC
    `);

    console.log(`✅ Found ${sessions.length} counselling sessions`);
    connection.release();
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error("❌ Error fetching counselling sessions:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch counselling sessions",
        details: error.message,
      });
  }
});

// POST /api/counselling-sessions - Create new counselling session
router.post("/", async (req, res) => {
  console.log("📝 Creating new counselling session");
  try {
    const {
      memberId,
      counsellorId = 2, // Default to user ID 2 if not provided
      mosqueId = 1, // Default to mosque ID 1 if not provided
      scheduledDate,
      scheduledTime,
      sessionType = "phone_call",
      priority = "medium",
      preSessionNotes,
    } = req.body;

    if (!memberId || !scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: "Member ID, scheduled date, and time are required",
      });
    }

    const connection = await pool.getConnection();

    // Get member details
    const [memberDetails] = await connection.query(
      `
      SELECT u.id, u.username, u.full_name, u.phone, u.email, u.mosque_id,
             COUNT(p.id) as total_prayers,
             COUNT(CASE WHEN p.status = 'prayed' THEN 1 END) as prayed_count,
             CASE 
               WHEN COUNT(p.id) > 0 THEN ROUND((COUNT(CASE WHEN p.status = 'prayed' THEN 1 END) / COUNT(p.id)) * 100, 2)
               ELSE 0 
             END as attendance_rate
      FROM users u
      LEFT JOIN prayers p ON u.id = p.user_id AND p.prayer_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      WHERE u.id = ?
      GROUP BY u.id
    `,
      [memberId]
    );

    if (memberDetails.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const member = memberDetails[0];

    // Create counselling session
    const [result] = await connection.query(
      `
      INSERT INTO counselling_sessions 
      (member_id, counsellor_id, mosque_id, member_name, member_phone, member_email,
       attendance_rate, total_prayers, prayed_count, scheduled_date, scheduled_time,
       priority, status, session_type, pre_session_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
    `,
      [
        member.id,
        counsellorId,
        mosqueId,
        member.full_name || member.username,
        member.phone,
        member.email,
        member.attendance_rate,
        member.total_prayers,
        member.prayed_count,
        scheduledDate,
        scheduledTime,
        priority,
        sessionType,
        preSessionNotes,
      ]
    );

    connection.release();

    console.log(`✅ Created counselling session with ID: ${result.insertId}`);
    res.status(201).json({
      success: true,
      message: "Counselling session scheduled successfully",
      data: { sessionId: result.insertId },
    });
  } catch (error) {
    console.error("❌ Error scheduling counselling session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule counselling session",
      error: error.message,
    });
  }
});

module.exports = router;
