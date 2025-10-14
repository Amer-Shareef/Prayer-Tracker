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
        CONCAT(UPPER(LEFT(COALESCE(a.area_name, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId,
        COUNT(p.id) as totalPrayers,
        COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) as prayedCount,
        CASE 
          WHEN COUNT(p.id) > 0 THEN ROUND((COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) / (COUNT(p.id) * 5)) * 100, 2)
          ELSE 0 
        END as attendanceRate,
        MAX(p.prayer_date) as lastAttendance
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.area_id
      LEFT JOIN prayers p ON u.id = p.user_id AND p.prayer_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      WHERE u.role = 'Member' 
        AND u.area_id IS NOT NULL 
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
             u1.phone as member_phone,
             u2.username as counsellor_username,
             u2.full_name as counsellor_full_name,
             a.area_name
      FROM counselling_sessions cs
      LEFT JOIN users u1 ON cs.member_id = u1.id
      LEFT JOIN users u2 ON cs.counsellor_id = u2.id
      LEFT JOIN areas a ON u2.area_id = a.area_id
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
  console.log("📦 Request body:", req.body);

  try {
    const { memberId, counsellorId, scheduledDate, scheduledTime } = req.body;

    console.log("🔍 Extracted data:", {
      memberId,
      counsellorId,
      scheduledDate,
      scheduledTime,
    });

    if (!memberId || !counsellorId || !scheduledDate || !scheduledTime) {
      console.log("❌ Missing required fields:", {
        memberId: !!memberId,
        counsellorId: !!counsellorId,
        scheduledDate: !!scheduledDate,
        scheduledTime: !!scheduledTime,
      });
      return res.status(400).json({
        success: false,
        message:
          "Member ID, counsellor ID, scheduled date, and time are required",
      });
    }

    const connection = await pool.getConnection();
    console.log("🔗 Database connection established");

    // Get member details including area_id
    console.log("🔍 Looking up member:", memberId);
    const [memberDetails] = await connection.query(
      `
      SELECT u.id, u.username, u.full_name, u.phone, u.email, u.area_id
      FROM users u WHERE u.id = ?
    `,
      [memberId]
    );

    console.log("👤 Member details:", memberDetails);

    if (memberDetails.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const member = memberDetails[0];

    // Verify counsellor exists and is from the same area
    console.log("🔍 Looking up counsellor:", counsellorId);
    const [counsellorDetails] = await connection.query(
      `
      SELECT u.id, u.username, u.full_name, u.area_id
      FROM users u WHERE u.id = ? AND u.role = 'Founder' AND u.status = 'active'
    `,
      [counsellorId]
    );

    console.log("👨‍🏫 Counsellor details:", counsellorDetails);

    if (counsellorDetails.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Counsellor not found or not authorized",
      });
    }

    const counsellor = counsellorDetails[0];

    // Check if counsellor is from the same area as the member
    console.log("🏛️ Area check:", {
      memberAreaId: member.area_id,
      counsellorAreaId: counsellor.area_id,
      match: counsellor.area_id === member.area_id,
    });

    // if (counsellor.area_id !== member.area_id) {
    //   connection.release();
    //   return res.status(403).json({
    //     success: false,
    //     message: "Counsellor must be from the same area as the member",
    //   });
    // }

    // Create counselling session
    console.log("💾 Creating counselling session with data:", {
      memberId: member.id,
      counsellorId,
      areaId: member.area_id,
      memberName: member.full_name || member.username,
      memberPhone: member.phone,
      memberEmail: member.email,
      scheduledDate,
      scheduledTime,
    });

    const [result] = await connection.query(
      `
      INSERT INTO counselling_sessions 
      (member_id, counsellor_id, area_id, member_name, member_phone, member_email,
       scheduled_date, scheduled_time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `,
      [
        member.id,
        counsellorId,
        member.area_id,
        member.full_name || member.username,
        member.phone,
        member.email,
        scheduledDate,
        scheduledTime,
      ]
    );

    console.log("💾 Database insert result:", result);
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
    const { status, sessionNotes, scheduledDate, scheduledTime, counsellorId } =
      req.body;

    const connection = await pool.getConnection();

    // Build dynamic query based on what fields are provided
    let updateFields = [];
    let values = [];

    if (status) {
      updateFields.push("status = ?");
      values.push(status);
    }

    if (sessionNotes) {
      updateFields.push("session_notes = ?");
      values.push(sessionNotes);
    }

    if (scheduledDate) {
      updateFields.push("scheduled_date = ?");
      values.push(scheduledDate);
    }

    if (scheduledTime) {
      updateFields.push("scheduled_time = ?");
      values.push(scheduledTime);
    }

    if (counsellorId) {
      updateFields.push("counsellor_id = ?");
      values.push(counsellorId);
    }

    // Always update the timestamp
    updateFields.push("updated_at = NOW()");
    values.push(id); // Add ID for WHERE clause

    const query = `
      UPDATE counselling_sessions 
      SET ${updateFields.join(", ")} 
      WHERE id = ?
    `;

    console.log("🔄 Update query:", query);
    console.log("🔄 Update values:", values);

    const [result] = await connection.query(query, values);

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
        CONCAT(UPPER(LEFT(COALESCE(a.area_name, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId,
        COUNT(p.id) as totalPrayers,
        COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) as prayedCount,
        CASE 
          WHEN COUNT(p.id) > 0 THEN ROUND((COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) / (COUNT(p.id) * 5)) * 100, 2)
          ELSE 0 
        END as attendanceRate,
        MAX(p.prayer_date) as lastAttendance
      FROM users u
      LEFT JOIN areas a ON u.area_id = a.area_id
      LEFT JOIN prayers p ON u.id = p.user_id AND p.prayer_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      WHERE u.role = 'Member' 
        AND u.area_id IS NOT NULL 
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
