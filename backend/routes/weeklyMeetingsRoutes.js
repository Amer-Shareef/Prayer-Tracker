const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const { dbHealthCheck } = require("../middleware/dbHealthCheck");

// Import the weekly meeting scheduler for recurring meetings
const WeeklyMeetingScheduler = require("../jobs/weeklyMeetingScheduler");

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
        COUNT(CASE WHEN wma.status = 'pending' THEN 1 END) as pending_count,
        MAX(CASE WHEN wma.user_id = ? THEN wma.status END) as user_attendance_status,
        MAX(CASE WHEN wma.user_id = ? THEN wma.reason END) as user_attendance_reason
      FROM weekly_meetings wm
      LEFT JOIN areas a ON wm.area_id = a.area_id
      LEFT JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id
      ${areaFilter}
      GROUP BY wm.id
      ORDER BY wm.meeting_date DESC
    `,
        [user.id, user.id, ...queryParams]
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

// Get meetings for current user/area (mobile app endpoint - works for both members and founders)
router.get(
  "/weekly-meetings/my-meetings",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const { limit = 10, offset = 0, sort = "desc" } = req.query;

      let query, params;

      if (user.role === "Member") {
        // For regular members: show meetings where they are a committee member
        query = `
          SELECT 
            wm.*,
            a.area_name,
            wma.status as user_attendance_status,
            wma.reason as user_attendance_reason,
            wma.marked_at as user_marked_at,
            COUNT(all_wma.id) as total_members,
            COUNT(CASE WHEN all_wma.status = 'present' THEN 1 END) as present_count,
            COUNT(CASE WHEN all_wma.status = 'absent' THEN 1 END) as absent_count,
            COUNT(CASE WHEN all_wma.status = 'pending' THEN 1 END) as pending_count
          FROM weekly_meetings wm
          LEFT JOIN areas a ON wm.area_id = a.area_id
          INNER JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id AND wma.user_id = ?
          LEFT JOIN weekly_meeting_attendance all_wma ON wm.id = all_wma.weekly_meeting_id
          WHERE wm.meeting_date >= CURDATE()
          GROUP BY wm.id, wma.id
          ORDER BY wm.meeting_date ${sort === "asc" ? "ASC" : "DESC"}
          LIMIT ? OFFSET ?
        `;
        params = [user.id, parseInt(limit), parseInt(offset)];
      } else {
        // For founders/admins: show all meetings in their area with all committee members
        query = `
          SELECT 
            wm.*,
            a.area_name,
            COUNT(wma.id) as total_members,
            COUNT(CASE WHEN wma.status = 'present' THEN 1 END) as present_count,
            COUNT(CASE WHEN wma.status = 'absent' THEN 1 END) as absent_count,
            COUNT(CASE WHEN wma.status = 'excused' THEN 1 END) as excused_count,
            COUNT(CASE WHEN wma.status IS NULL THEN 1 END) as pending_count
          FROM weekly_meetings wm
          LEFT JOIN areas a ON wm.area_id = a.area_id
          LEFT JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id
          WHERE wm.area_id = ?
          GROUP BY wm.id
          ORDER BY wm.meeting_date ${sort === "asc" ? "ASC" : "DESC"}
          LIMIT ? OFFSET ?
        `;
        params = [user.area_id, parseInt(limit), parseInt(offset)];
      }

      const [meetings] = await pool.execute(query, params);

      res.json({
        success: true,
        data: meetings,
        message: `Found ${meetings.length} meetings where you are a committee member`,
      });
    } catch (error) {
      console.error("Error fetching user meetings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch your meetings",
        error: error.message,
      });
    }
  }
);

router.get(
  "/weekly-meetings/current/my-meeting",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;

      // Get start and end of current week (Sunday to Saturday)
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - currentDay);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      let query, params;

      if (user.role === "Member") {
        // For regular members: get meeting where they are a committee member
        query = `
          SELECT 
            wm.*,
            a.area_name,
            wma.status as user_attendance_status,
            wma.reason as user_attendance_reason,
            wma.marked_at as user_marked_at,
            COUNT(all_wma.id) as total_members,
            COUNT(CASE WHEN all_wma.status = 'present' THEN 1 END) as present_count,
            COUNT(CASE WHEN all_wma.status = 'absent' THEN 1 END) as absent_count,
            COUNT(CASE WHEN all_wma.status = 'excused' THEN 1 END) as excused_count,
            COUNT(CASE WHEN all_wma.status IS NULL THEN 1 END) as pending_count
          FROM weekly_meetings wm
          LEFT JOIN areas a ON wm.area_id = a.area_id
          INNER JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id AND wma.user_id = ?
          LEFT JOIN weekly_meeting_attendance all_wma ON wm.id = all_wma.weekly_meeting_id
          WHERE wm.meeting_date BETWEEN ? AND ?
          GROUP BY wm.id, wma.id
          ORDER BY wm.meeting_date DESC
          LIMIT 1
        `;
        params = [user.id, startOfWeek, endOfWeek];
      } else {
        // For founders/admins: get meeting in their area with all committee members data
        query = `
          SELECT 
            wm.*,
            a.area_name,
            COUNT(wma.id) as total_members,
            COUNT(CASE WHEN wma.status = 'present' THEN 1 END) as present_count,
            COUNT(CASE WHEN wma.status = 'absent' THEN 1 END) as absent_count,
            COUNT(CASE WHEN wma.status = 'excused' THEN 1 END) as excused_count,
            COUNT(CASE WHEN wma.status IS NULL THEN 1 END) as pending_count
          FROM weekly_meetings wm
          LEFT JOIN areas a ON wm.area_id = a.area_id
          LEFT JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id
          WHERE wm.area_id = ? AND wm.meeting_date BETWEEN ? AND ?
          GROUP BY wm.id
          ORDER BY wm.meeting_date DESC
          LIMIT 1
        `;
        params = [user.area_id, startOfWeek, endOfWeek];
      }

      const [meetings] = await pool.execute(query, params);

      res.json({
        success: true,
        data: meetings[0] || null,
        message: meetings[0]
          ? "Current week meeting found"
          : "No meeting this week",
      });
    } catch (error) {
      console.error("Error fetching current week user meeting:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch current week meeting",
        error: error.message,
      });
    }
  }
);

// Get current week's meeting (admin endpoint)
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
      let queryParams = [user.id, user.id, startOfWeek, endOfWeek];

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
        COUNT(CASE WHEN wma.status = 'pending' THEN 1 END) as pending_count,
        MAX(CASE WHEN wma.user_id = ? THEN wma.status END) as user_attendance_status,
        MAX(CASE WHEN wma.user_id = ? THEN wma.reason END) as user_attendance_reason
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

// Get committee members for a specific meeting (for founders to mark attendance)
router.get(
  "/weekly-meetings/:meetingId/members",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const { meetingId } = req.params;

      // Only founders and admins can access this endpoint
      if (
        user.role !== "Founder" &&
        user.role !== "Admin" &&
        user.role !== "SuperAdmin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied. Only founders and admins can view committee members.",
        });
      }

      // Get meeting details first to verify it belongs to user's area
      const [meetingDetails] = await pool.execute(
        `SELECT wm.*, a.area_name FROM weekly_meetings wm 
         LEFT JOIN areas a ON wm.area_id = a.area_id 
         WHERE wm.id = ? AND wm.area_id = ?`,
        [meetingId, user.area_id]
      );

      if (meetingDetails.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Meeting not found or access denied",
        });
      }

      // Get all committee members in this area with their attendance status
      const [members] = await pool.execute(
        `
        SELECT 
          u.id,
          u.username,
          u.full_name,
          u.phone,
          u.email,
          wma.status as attendance_status,
          wma.reason as attendance_reason,
          wma.marked_at,
          wma.marked_by_user_id,
          marker.full_name as marked_by_name
        FROM users u
        LEFT JOIN weekly_meeting_attendance wma ON u.id = wma.user_id AND wma.weekly_meeting_id = ?
        LEFT JOIN users marker ON wma.marked_by_user_id = marker.id
        WHERE u.area_id = ? AND u.status = 'active'
        ORDER BY u.full_name ASC
        `,
        [meetingId, user.area_id]
      );

      res.json({
        success: true,
        data: {
          meeting: meetingDetails[0],
          members: members,
        },
      });
    } catch (error) {
      console.error("Error fetching meeting members:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch meeting members",
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
      const {
        meeting_date,
        meeting_time,
        location,
        agenda,
        area_id, // Required: Area ID to create meetings for specific area
        weeks_ahead = 8,
      } = req.body;
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
          message: "Area ID is required - please provide area_id in request body or ensure your account has an assigned area",
        });
      }

      // Validate that the area exists
      const [areaCheck] = await pool.execute(
        "SELECT area_id, area_name FROM areas WHERE area_id = ?",
        [meetingAreaId]
      );

      if (areaCheck.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Area with ID ${meetingAreaId} does not exist`,
        });
      }

      console.log(`🎯 Request to create meetings for area ${meetingAreaId}`);
      console.log(`📅 Start date: ${meeting_date}`);
      console.log(`⏰ Time: ${meeting_time}`);
      console.log(`📍 Location: ${location || "Not provided"}`);
      console.log(`📋 Agenda: ${agenda || "Not provided"}`);

      // Smart duplicate check - allow meetings with different details
      const [existingMeetings] = await pool.execute(
        `SELECT id, location, agenda, meeting_time FROM weekly_meetings
         WHERE DATE(meeting_date) = DATE(?) AND area_id = ?`,
        [meeting_date, meetingAreaId]
      );

      // Allow creating new meeting sequence if force flag is set
      const forceCreate = req.body.force_create === true;

      if (existingMeetings.length > 0 && !forceCreate) {
        // Check if any existing meeting has the same details
        const duplicateFound = existingMeetings.some(
          (meeting) =>
            meeting.location === location &&
            meeting.agenda === agenda &&
            meeting.meeting_time === meeting_time
        );

        if (duplicateFound) {
          const existingMeeting = existingMeetings.find(
            (meeting) =>
              meeting.location === location &&
              meeting.agenda === agenda &&
              meeting.meeting_time === meeting_time
          );
          console.log(`⚠️ Identical meeting already exists:`, existingMeeting);
          return res.status(400).json({
            success: false,
            message:
              "An identical meeting already exists for this date, time, location, and agenda in this area. Set force_create=true to override.",
            existing: existingMeeting,
          });
        } else {
          console.log(`🔄 Different meeting details found, allowing creation`);
        }
      }

      console.log(`✅ Proceeding with meeting creation`);

      // Validate the meeting date is a proper date to prevent any bad data
      const meetingDateObj = new Date(meeting_date);
      if (isNaN(meetingDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid meeting date format provided",
        });
      }

      // Create ALL meetings using the generator (no manual initial meeting creation)
      const scheduler = new WeeklyMeetingScheduler();
      try {
        console.log(
          `⏺️ Creating weekly meetings with scheduler.createRecurringMeetingsWithInitial()`
        );
        console.log(`📅 Start date: ${meeting_date}`);
        console.log(`⏰ Time: ${meeting_time}`);
        console.log(`📍 Location: ${location || "Default will be used"}`);
        console.log(`📋 Agenda: ${agenda || "Default will be used"}`);

        // Pass the force_create flag to the scheduler
        const forceCreate = req.body.force_create === true;
        if (forceCreate) {
          console.log(
            `⚠️ Force create flag set, will override duplicate checks for initial meeting`
          );
        }

        const results = await scheduler.createRecurringMeetingsWithInitial(
          meetingAreaId,
          meeting_date,
          meeting_time,
          location,
          agenda,
          user.id,
          weeks_ahead,
          forceCreate // Pass the force flag to the scheduler
        );

        if (!results || results.length === 0) {
          return res.status(500).json({
            success: false,
            message: "Failed to create any meetings",
          });
        }

        // Get the first created meeting (the initial one)
        const firstNewMeeting = results.find((r) => !r.exists);
        const meetingId = firstNewMeeting
          ? firstNewMeeting.meetingId
          : results[0].meetingId;

        console.log(
          `🔄 Created ${results.length} meetings for area ${meetingAreaId}`
        );

        // Fetch the created meeting
        const [createdMeeting] = await pool.execute(
          `
        SELECT
          wm.*,
          a.area_name,
          0 as total_members,
          0 as present_count,
          0 as absent_count,
          0 as pending_count,
          NULL as user_attendance_status,
          NULL as user_attendance_reason
        FROM weekly_meetings wm
        LEFT JOIN areas a ON wm.area_id = a.area_id
        WHERE wm.id = ?
      `,
          [meetingId]
        );

        res.status(201).json({
          success: true,
          message: "Weekly meetings created successfully",
          data: createdMeeting[0],
          total_meetings: results.length,
          new_meetings: results.filter((r) => !r.exists).length,
        });
      } catch (error) {
        console.error("❌ Failed to create meetings:", error);
        res.status(500).json({
          success: false,
          message: "Failed to create meetings",
          error: error.message,
        });
      }
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

// Mark attendance (for committee members and founders marking for others)
router.put(
  "/weekly-meetings/:id/attendance",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason, user_id } = req.body; // user_id for founders marking others
      const { user } = req;

      if (!["present", "absent", "excused"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be 'present', 'absent', or 'excused'",
        });
      }

      let targetUserId = user.id; // Default to current user

      // If founder/admin is marking for someone else
      if (
        user_id &&
        (user.role === "Founder" ||
          user.role === "Admin" ||
          user.role === "SuperAdmin")
      ) {
        targetUserId = user_id;

        // Verify the target user is in the same area
        const [targetUser] = await pool.execute(
          `SELECT id FROM users WHERE id = ? AND area_id = ? AND status = 'active'`,
          [user_id, user.area_id]
        );

        if (targetUser.length === 0) {
          return res.status(404).json({
            success: false,
            message: "User not found in your area or inactive",
          });
        }
      }

      // Check if attendance record exists
      const [attendance] = await pool.execute(
        `SELECT id FROM weekly_meeting_attendance 
         WHERE weekly_meeting_id = ? AND user_id = ?`,
        [id, targetUserId]
      );

      if (attendance.length === 0) {
        // Create new attendance record
        await pool.execute(
          `INSERT INTO weekly_meeting_attendance 
           (weekly_meeting_id, user_id, status, reason, marked_at, marked_by_user_id) 
           VALUES (?, ?, ?, ?, NOW(), ?)`,
          [id, targetUserId, status, reason || null, user.id]
        );
      } else {
        // Update existing attendance record
        await pool.execute(
          `UPDATE weekly_meeting_attendance 
           SET status = ?, reason = ?, marked_at = NOW(), marked_by_user_id = ?
           WHERE weekly_meeting_id = ? AND user_id = ?`,
          [status, reason || null, user.id, id, targetUserId]
        );
      }

      // Get updated attendance info
      const [updatedAttendance] = await pool.execute(
        `SELECT wma.*, u.full_name, marker.full_name as marked_by_name
         FROM weekly_meeting_attendance wma
         LEFT JOIN users u ON wma.user_id = u.id
         LEFT JOIN users marker ON wma.marked_by_user_id = marker.id
         WHERE wma.weekly_meeting_id = ? AND wma.user_id = ?`,
        [id, targetUserId]
      );

      res.json({
        success: true,
        message: "Attendance marked successfully",
        data: updatedAttendance[0],
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
