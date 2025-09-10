const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const { dbHealthCheck } = require("../middleware/dbHealthCheck");

const router = express.Router();

// Get all weekly meetings with attendance stats
router.get(
  "/weekly-meetings",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const { area_id } = req.query;

      // Filter by area_id if provided, otherwise use user's area for Founders
      let areaFilter = "";
      let queryParams = [];

      if (area_id) {
        areaFilter = "WHERE wm.area_id = ?";
        queryParams.push(area_id);
      } else if (user.role === "Founder" && user.area_id) {
        areaFilter = "WHERE wm.area_id = ?";
        queryParams.push(user.area_id);
      }

      const [meetings] = await pool.execute(
        `
      SELECT 
        wm.*,
        a.area_name,
        COUNT(wma.id) as total_members,
        COUNT(CASE WHEN wma.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN wma.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN wma.status = 'pending' THEN 1 END) as pending_count
      FROM weekly_meetings wm
      LEFT JOIN areas a ON wm.area_id = a.area_id
      LEFT JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id
      ${areaFilter}
      GROUP BY wm.id
      ORDER BY wm.meeting_date DESC
    `,
        queryParams
      );

      res.json({
        success: true,
        data: meetings,
      });
    } catch (error) {
      console.error("Error fetching weekly meetings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch weekly meetings",
        error: error.message,
      });
    }
  }
);

// Get current week's meeting
router.get(
  "/weekly-meetings/current",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const { area_id } = req.query;

      // Get start and end of current week (Sunday to Saturday)
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - currentDay);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Filter by area_id if provided, otherwise use user's area for Founders
      let areaFilter = "";
      let queryParams = [startOfWeek, endOfWeek];

      if (area_id) {
        areaFilter = "AND wm.area_id = ?";
        queryParams.push(area_id);
      } else if (user.role === "Founder" && user.area_id) {
        areaFilter = "AND wm.area_id = ?";
        queryParams.push(user.area_id);
      }

      const [meetings] = await pool.execute(
        `
      SELECT 
        wm.*,
        a.area_name,
        COUNT(wma.id) as total_members,
        COUNT(CASE WHEN wma.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN wma.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN wma.status = 'pending' THEN 1 END) as pending_count
      FROM weekly_meetings wm
      LEFT JOIN areas a ON wm.area_id = a.area_id
      LEFT JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id
      WHERE wm.meeting_date BETWEEN ? AND ? ${areaFilter}
      GROUP BY wm.id
      ORDER BY wm.meeting_date DESC
      LIMIT 1
    `,
        queryParams
      );

      res.json({
        success: true,
        data: meetings[0] || null,
      });
    } catch (error) {
      console.error("Error fetching current week meeting:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch current week meeting",
        error: error.message,
      });
    }
  }
);

// Create weekly meeting
router.post(
  "/weekly-meetings",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { meeting_date, meeting_time, location, agenda, area_id } =
        req.body;
      const { user } = req;

      if (!meeting_date || !meeting_time) {
        return res.status(400).json({
          success: false,
          message: "Meeting date and time are required",
        });
      }

      // Use provided area_id or user's area_id
      const meetingAreaId = area_id || user.area_id;

      if (!meetingAreaId) {
        return res.status(400).json({
          success: false,
          message: "Area ID is required",
        });
      }

      // Check if meeting already exists for this date and area
      const [existingMeeting] = await pool.execute(
        "SELECT id FROM weekly_meetings WHERE DATE(meeting_date) = DATE(?) AND area_id = ?",
        [meeting_date, meetingAreaId]
      );

      if (existingMeeting.length > 0) {
        return res.status(400).json({
          success: false,
          message: "A meeting already exists for this date in this area",
        });
      }

      // Create the meeting
      const [result] = await pool.execute(
        `
      INSERT INTO weekly_meetings (
        meeting_date, meeting_time, location, agenda, area_id, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?, NOW())
    `,
        [
          meeting_date,
          meeting_time,
          location || null,
          agenda || null,
          meetingAreaId,
          user.id,
        ]
      );

      const meetingId = result.insertId;

      // Get all committee members (users with role 'Founder' or 'SuperAdmin') in the same area
      const [committeeMembers] = await pool.execute(
        `
      SELECT id FROM users 
      WHERE role IN ('Founder', 'SuperAdmin') 
      AND status = 'active'
      AND (area_id = ? OR role = 'SuperAdmin')
    `,
        [meetingAreaId]
      );

      // Create attendance records for all committee members
      if (committeeMembers.length > 0) {
        const attendanceValues = committeeMembers
          .map((member) => `(${meetingId}, ${member.id}, 'pending', NOW())`)
          .join(", ");

        await pool.execute(`
        INSERT INTO weekly_meeting_attendance (weekly_meeting_id, user_id, status, created_at)
        VALUES ${attendanceValues}
      `);
      }

      // Fetch the created meeting with stats
      const [createdMeeting] = await pool.execute(
        `
      SELECT 
        wm.*,
        a.area_name,
        COUNT(wma.id) as total_members,
        COUNT(CASE WHEN wma.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN wma.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN wma.status = 'pending' THEN 1 END) as pending_count
      FROM weekly_meetings wm
      LEFT JOIN areas a ON wm.area_id = a.area_id
      LEFT JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id
      WHERE wm.id = ?
      GROUP BY wm.id
    `,
        [meetingId]
      );

      res.status(201).json({
        success: true,
        message: "Weekly meeting created successfully",
        data: createdMeeting[0],
      });
    } catch (error) {
      console.error("Error creating weekly meeting:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create weekly meeting",
        error: error.message,
      });
    }
  }
);

// Get meeting details with attendance
router.get(
  "/weekly-meetings/:id",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get meeting details
      const [meeting] = await pool.execute(
        `
      SELECT 
        wm.*,
        u.full_name as created_by_name
      FROM weekly_meetings wm
      LEFT JOIN users u ON wm.created_by = u.id
      WHERE wm.id = ?
    `,
        [id]
      );

      if (meeting.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Meeting not found",
        });
      }

      // Get attendance details
      const [attendance] = await pool.execute(
        `
      SELECT 
        wma.*,
        u.full_name,
        u.email,
        u.phone,
        u.role
      FROM weekly_meeting_attendance wma
      JOIN users u ON wma.user_id = u.id
      WHERE wma.weekly_meeting_id = ?
      ORDER BY u.full_name
    `,
        [id]
      );

      res.json({
        success: true,
        data: {
          meeting: meeting[0],
          attendance: attendance,
        },
      });
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch meeting details",
        error: error.message,
      });
    }
  }
);

// Update meeting status
router.put(
  "/weekly-meetings/:id",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, meeting_date, meeting_time, location, agenda } = req.body;

      const updateFields = [];
      const updateValues = [];

      if (status) {
        updateFields.push("status = ?");
        updateValues.push(status);
      }

      if (meeting_date) {
        updateFields.push("meeting_date = ?");
        updateValues.push(meeting_date);
      }

      if (meeting_time) {
        updateFields.push("meeting_time = ?");
        updateValues.push(meeting_time);
      }

      if (location !== undefined) {
        updateFields.push("location = ?");
        updateValues.push(location);
      }

      if (agenda !== undefined) {
        updateFields.push("agenda = ?");
        updateValues.push(agenda);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid fields provided for update",
        });
      }

      updateFields.push("updated_at = NOW()");
      updateValues.push(id);

      const sql = `UPDATE weekly_meetings SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;
      await pool.execute(sql, updateValues);

      res.json({
        success: true,
        message: "Meeting updated successfully",
      });
    } catch (error) {
      console.error("Error updating meeting:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update meeting",
        error: error.message,
      });
    }
  }
);

// Mark attendance (for committee members)
router.put(
  "/weekly-meetings/:id/attendance",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const { user } = req;

      if (!["present", "absent"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be 'present' or 'absent'",
        });
      }

      // Check if user is a committee member for this meeting
      const [attendance] = await pool.execute(
        `
      SELECT id FROM weekly_meeting_attendance 
      WHERE weekly_meeting_id = ? AND user_id = ?
    `,
        [id, user.id]
      );

      if (attendance.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Attendance record not found",
        });
      }

      // Update attendance
      await pool.execute(
        `
      UPDATE weekly_meeting_attendance 
      SET status = ?, reason = ?, updated_at = NOW()
      WHERE weekly_meeting_id = ? AND user_id = ?
    `,
        [status, reason || null, id, user.id]
      );

      res.json({
        success: true,
        message: "Attendance marked successfully",
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark attendance",
        error: error.message,
      });
    }
  }
);

// Delete weekly meeting
router.delete(
  "/weekly-meetings/:id",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Delete attendance records first (foreign key constraint)
      await pool.execute(
        "DELETE FROM weekly_meeting_attendance WHERE weekly_meeting_id = ?",
        [id]
      );

      // Delete the meeting
      const [result] = await pool.execute(
        "DELETE FROM weekly_meetings WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Meeting not found",
        });
      }

      res.json({
        success: true,
        message: "Meeting deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting meeting:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete meeting",
        error: error.message,
      });
    }
  }
);

module.exports = router;
