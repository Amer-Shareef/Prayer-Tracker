const express = require("express");
const { pool } = require("../config/database");

const router = express.Router();

// GET /api/members-for-counselling - Get members with low attendance (<70%)
router.get("/members-for-counselling", async (req, res) => {
  console.log("🔍 Getting members for counselling");
  try {
    const connection = await pool.getConnection();

    // Get members with their attendance data and counselling status
    const [members] = await connection.query(
      `
      SELECT 
        u.id,
        u.username,
        u.full_name as memberName,
        u.phone,
        u.email,
        CONCAT(UPPER(LEFT(COALESCE(u.area, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId,
        COUNT(p.id) as totalPrayers,
        COUNT(CASE WHEN p.status = 'prayed' THEN 1 END) as prayedCount,
        CASE 
          WHEN COUNT(p.id) > 0 THEN ROUND((COUNT(CASE WHEN p.status = 'prayed' THEN 1 END) / COUNT(p.id)) * 100, 2)
          ELSE 0 
        END as attendanceRate,
        MAX(p.prayer_date) as lastAttendance
      FROM users u
      LEFT JOIN prayers p ON u.id = p.user_id AND p.prayer_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      WHERE u.role = 'Member' 
        AND u.mosque_id IS NOT NULL 
        AND u.status = 'active'
      GROUP BY u.id
      HAVING attendanceRate < 70
      ORDER BY attendanceRate ASC, lastAttendance ASC
    `
    );

    console.log(`✅ Found ${members.length} members needing counselling`);
    connection.release();

    res.json({
      success: true,
      data: members.map((member) => ({
        ...member,
        selected: false, // Add selected field for frontend
        counsellor: null, // Add counsellor field for frontend
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching members for counselling:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch members for counselling",
      details: error.message,
    });
  }
});

// GET /api/counselling-sessions - Get all counselling sessions
router.get("/counselling-sessions", async (req, res) => {
  console.log("🔍 Getting counselling sessions");
  try {
    const connection = await pool.getConnection();
    const [sessions] = await connection.query(`
      SELECT cs.*, 
             u1.username as member_username,
             COALESCE(u1.full_name, u1.username, cs.member_name) as member_name,
             u2.username as counsellor_username,
             u2.full_name as counsellor_full_name
      FROM counselling_sessions cs
      LEFT JOIN users u1 ON cs.member_id = u1.id
      LEFT JOIN users u2 ON cs.counsellor_id = u2.id
      ORDER BY cs.scheduled_date DESC, cs.scheduled_time ASC
    `);

    console.log(`✅ Found ${sessions.length} counselling sessions`);
    connection.release();
    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error("❌ Error fetching counselling sessions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch counselling sessions",
      details: error.message,
    });
  }
});

// POST /api/counselling-sessions - Create new counselling session
router.post("/counselling-sessions", async (req, res) => {
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
      SELECT u.id, u.username, u.full_name, u.phone, u.email
      FROM users u WHERE u.id = ?
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
       scheduled_date, scheduled_time, priority, status, session_type, pre_session_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
    `,
      [
        member.id,
        counsellorId,
        mosqueId,
        member.full_name || member.username,
        member.phone,
        member.email,
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

// PUT /api/counselling-sessions/:id - Update counselling session
router.put("/counselling-sessions/:id", async (req, res) => {
  console.log("🔄 Updating counselling session");
  try {
    const { id } = req.params;
    const { status, sessionNotes } = req.body;

    const connection = await pool.getConnection();

    const [result] = await connection.query(
      `
      UPDATE counselling_sessions 
      SET status = ?, session_notes = ?, updated_at = NOW() 
      WHERE id = ?
    `,
      [status, sessionNotes, id]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Counselling session not found",
      });
    }

    console.log(`✅ Updated counselling session with ID: ${id}`);
    res.json({
      success: true,
      message: "Counselling session updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating counselling session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update counselling session",
      details: error.message,
    });
  }
});

// DELETE /api/counselling-sessions/:id - Delete counselling session
router.delete("/counselling-sessions/:id", async (req, res) => {
  console.log("🗑️ Deleting counselling session with ID:", req.params.id);
  try {
    const { id } = req.params;

    // Validate ID is a number
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    const connection = await pool.getConnection();

    // First check if the session exists
    const [existingSession] = await connection.query(
      "SELECT id FROM counselling_sessions WHERE id = ?",
      [id]
    );

    if (existingSession.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Counselling session not found",
      });
    }

    // Delete the session
    const [result] = await connection.query(
      "DELETE FROM counselling_sessions WHERE id = ?",
      [id]
    );

    connection.release();

    console.log(`✅ Deleted counselling session with ID: ${id}`);
    res.json({
      success: true,
      message: "Counselling session deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting counselling session:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete counselling session",
      details: error.message,
    });
  }
});

// GET /api/all-members - Get all members with attendance data
router.get("/all-members", async (req, res) => {
  console.log("👥 Getting all members");
  try {
    const connection = await pool.getConnection();

    const [members] = await connection.query(`
      SELECT 
        u.id,
        u.username,
        u.full_name as memberName,
        u.phone,
        u.email,
        CONCAT(UPPER(LEFT(COALESCE(u.area, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId,
        COUNT(p.id) as totalPrayers,
        COUNT(CASE WHEN p.status = 'prayed' THEN 1 END) as prayedCount,
        CASE 
          WHEN COUNT(p.id) > 0 THEN ROUND((COUNT(CASE WHEN p.status = 'prayed' THEN 1 END) / COUNT(p.id)) * 100, 2)
          ELSE 0 
        END as attendanceRate,
        MAX(p.prayer_date) as lastAttendance
      FROM users u
      LEFT JOIN prayers p ON u.id = p.user_id AND p.prayer_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      WHERE u.role = 'Member' 
        AND u.mosque_id IS NOT NULL 
        AND u.status = 'active'
      GROUP BY u.id
      ORDER BY u.full_name, u.username
    `);

    console.log(`✅ Found ${members.length} total members`);
    connection.release();

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("❌ Error fetching all members:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch all members",
      details: error.message,
    });
  }
});

module.exports = router;
