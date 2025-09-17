const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const { dbHealthCheck } = require("../middleware/dbHealthCheck");
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting middleware
const attendanceLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each user to 20 attendance requests per 15 minutes
  message: {
    success: false,
    message: 'Too many attendance requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const meetingCreationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit to 5 meeting creations per hour
  message: {
    success: false,
    message: 'Too many meeting creation requests, please try again later.'
  }
});

// Validation middleware
const validateMeetingCreation = [
  body('meeting_date').isISO8601().toDate().withMessage('Valid date required (YYYY-MM-DD)'),
  body('meeting_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time required (HH:MM)'),
  body('location').optional().isLength({ min: 1, max: 255 }).trim(),
  body('agenda').optional().isLength({ min: 1, max: 1000 }).trim(),
  body('area_id').optional().isInt({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    next();
  }
];

const validateAttendance = [
  body('status').isIn(['present', 'absent', 'excused']).withMessage('Status must be present, absent, or excused'),
  body('reason').optional().isLength({ max: 500 }).trim(),
  body('user_id').optional().isInt({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    next();
  }
];

// Helper functions
function isAuthorized(user, requiredRoles = ["Founder", "Admin", "SuperAdmin"]) {
  return requiredRoles.includes(user.role);
}

function getUTCDateString(date) {
  const d = new Date(date);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toISOString().split('T')[0];
}

function addWeeksToDate(dateString, weeks) {
  const date = new Date(dateString + 'T00:00:00.000Z');
  date.setUTCDate(date.getUTCDate() + (weeks * 7));
  return date.toISOString().split('T')[0];
}

// Enhanced future meeting creation with transaction safety
async function ensureFutureMeetingsSafe(connection, meeting, minFuture = 2) {
  try {
    const actualParentId = meeting.parent_id || meeting.id;
    const today = getUTCDateString(new Date());
    
    // Get template meeting (parent) details
    const [templateQuery] = await connection.execute(
      `SELECT * FROM weekly_meetings WHERE id = ?`, [actualParentId]
    );
    
    if (templateQuery.length === 0) {
      throw new Error("Template meeting not found");
    }
    
    const template = templateQuery[0];
    
    // Check existing future meetings with lock to prevent race conditions
    const [futureCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM weekly_meetings 
       WHERE (id = ? OR parent_id = ?)
         AND meeting_date > ?
         AND status = 'scheduled'
       FOR UPDATE`,
      [actualParentId, actualParentId, today]
    );

    const meetingsToCreate = minFuture - futureCount[0].count;
    
    if (meetingsToCreate <= 0) {
      return { 
        created: 0, 
        existing: futureCount[0].count, 
        message: `${futureCount[0].count} future meetings already exist` 
      };
    }

    // Find the latest meeting date in the series
    const [lastMeetingQuery] = await connection.execute(
      `SELECT meeting_date FROM weekly_meetings 
       WHERE (id = ? OR parent_id = ?)
       ORDER BY meeting_date DESC LIMIT 1`,
      [actualParentId, actualParentId]
    );

    let lastMeetingDate = lastMeetingQuery[0].meeting_date;
    
    // Ensure we don't create meetings in the past
    if (lastMeetingDate <= today) {
      lastMeetingDate = today;
    }

    // Prepare bulk insert data
    const meetingsToInsert = [];
    const createdMeetings = [];
    
    for (let i = 1; i <= meetingsToCreate; i++) {
      const nextDate = addWeeksToDate(lastMeetingDate, i);
      
      // Double-check this date doesn't already exist
      const [existingCheck] = await connection.execute(
        `SELECT id FROM weekly_meetings 
         WHERE area_id = ? AND meeting_date = ? AND meeting_time = ?`,
        [template.area_id, nextDate, template.meeting_time]
      );
      
      if (existingCheck.length === 0) {
        meetingsToInsert.push([
          template.area_id,
          nextDate,
          template.meeting_time,
          template.location || 'Community Center',
          template.agenda || 'Weekly Committee Meeting',
          'scheduled',
          template.created_by,
          actualParentId
        ]);
        
        createdMeetings.push({
          date: nextDate,
          time: template.meeting_time,
          parent_id: actualParentId
        });
      }
    }

    // Bulk insert meetings
    if (meetingsToInsert.length > 0) {
      const placeholders = meetingsToInsert.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const values = meetingsToInsert.flat();
      
      const [insertResult] = await connection.execute(
        `INSERT INTO weekly_meetings 
         (area_id, meeting_date, meeting_time, location, agenda, status, created_by, parent_id)
         VALUES ${placeholders}`,
        values
      );
      
      console.log(`✅ Created ${insertResult.affectedRows} future meetings for parent ${actualParentId}`);
    }

    return { 
      created: meetingsToInsert.length, 
      meetings: createdMeetings,
      existing: futureCount[0].count,
      message: `Created ${meetingsToInsert.length} new meetings`
    };

  } catch (error) {
    console.error("Error ensuring future meetings:", error);
    throw error;
  }
}

// Create initial weekly meeting (parent meeting)
router.post("/weekly-meetings", 
  meetingCreationLimit,
  authenticateToken, 
  dbHealthCheck, 
  validateMeetingCreation,
  async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { meeting_date, meeting_time, location, agenda, area_id } = req.body;
      const { user } = req;

      const meetingAreaId = area_id || user.area_id;

      if (!meetingAreaId) {
        throw new Error("Area ID is required");
      }

      // Check user permissions for this area
      if (!isAuthorized(user) && user.area_id !== meetingAreaId) {
        throw new Error("Access denied. You can only create meetings in your area.");
      }

      const meetingDateStr = getUTCDateString(meeting_date);

      // Check for duplicates with lock
      const [existing] = await connection.execute(
        `SELECT id FROM weekly_meetings 
         WHERE area_id = ? AND meeting_date = ? AND meeting_time = ?
         FOR UPDATE`,
        [meetingAreaId, meetingDateStr, meeting_time]
      );

      if (existing.length > 0) {
        throw new Error("Meeting already exists at this time and date");
      }

      // Create parent meeting
      const [result] = await connection.execute(
        `INSERT INTO weekly_meetings (
          area_id, meeting_date, meeting_time, location, agenda,
          status, created_by, created_at, parent_id
        ) VALUES (?, ?, ?, ?, ?, 'scheduled', ?, NOW(), NULL)`,
        [meetingAreaId, meetingDateStr, meeting_time, 
         location || "Community Center", 
         agenda || "Weekly Committee Meeting", 
         user.id]
      );

      const parentMeetingId = result.insertId;

      // Create future meetings immediately
      const futureResult = await ensureFutureMeetingsSafe(
        connection, 
        { 
          id: parentMeetingId, 
          area_id: meetingAreaId, 
          meeting_date: meetingDateStr,
          meeting_time,
          location: location || "Community Center",
          agenda: agenda || "Weekly Committee Meeting",
          created_by: user.id,
          parent_id: null
        }, 
        2
      );

      await connection.commit();

      // Get created meeting with details
      const [createdMeeting] = await pool.execute(
        `SELECT wm.*, a.area_name,
          (SELECT COUNT(*) FROM weekly_meetings WHERE parent_id = wm.id) as child_meetings_count
         FROM weekly_meetings wm
         LEFT JOIN areas a ON wm.area_id = a.area_id
         WHERE wm.id = ?`,
        [parentMeetingId]
      );

      res.status(201).json({
        success: true,
        message: "Weekly meeting series created successfully",
        data: createdMeeting[0],
        future_meetings: futureResult
      });

    } catch (error) {
      await connection.rollback();
      console.error("Error creating meeting:", error);
      
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create meeting"
      });
    } finally {
      connection.release();
    }
  }
);

// Mark attendance with automatic future meeting creation
router.put("/weekly-meetings/:id/attendance", 
  attendanceLimit,
  authenticateToken, 
  dbHealthCheck, 
  validateAttendance,
  async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      const { status, reason, user_id } = req.body;
      const { user } = req;

      // Get meeting details with lock
      const [meetingDetails] = await connection.execute(
        `SELECT wm.*, a.area_name FROM weekly_meetings wm
         LEFT JOIN areas a ON wm.area_id = a.area_id
         WHERE wm.id = ? FOR UPDATE`, 
        [id]
      );

      if (meetingDetails.length === 0) {
        throw new Error("Meeting not found");
      }

      const meeting = meetingDetails[0];
      
      // Determine target user
      const targetUserId = user_id && isAuthorized(user) ? user_id : user.id;

      // Check if user belongs to the meeting's area (unless admin/founder)
      if (!isAuthorized(user) && user.area_id !== meeting.area_id) {
        throw new Error("Access denied. You can only mark attendance for meetings in your area.");
      }

      // Mark attendance using UPSERT to handle duplicates safely
      await connection.execute(
        `INSERT INTO weekly_meeting_attendance 
         (weekly_meeting_id, user_id, status, reason, marked_at, marked_by) 
         VALUES (?, ?, ?, ?, NOW(), ?)
         ON DUPLICATE KEY UPDATE 
         status = VALUES(status), 
         reason = VALUES(reason), 
         marked_at = NOW(), 
         marked_by = VALUES(marked_by)`,
        [id, targetUserId, status, reason || null, user.id]
      );

      // Ensure future meetings exist
      const futureResult = await ensureFutureMeetingsSafe(connection, meeting, 2);

      await connection.commit();

      // Get updated attendance information
      const [updatedAttendance] = await pool.execute(
        `SELECT wma.*, u.full_name, u.email, marker.full_name as marked_by_name
         FROM weekly_meeting_attendance wma
         LEFT JOIN users u ON wma.user_id = u.id
         LEFT JOIN users marker ON wma.marked_by = marker.id
         WHERE wma.weekly_meeting_id = ? AND wma.user_id = ?`,
        [id, targetUserId]
      );

      // Get next upcoming meeting in series
      const actualParentId = meeting.parent_id || meeting.id;
      const today = getUTCDateString(new Date());
      
      const [nextMeeting] = await pool.execute(
        `SELECT * FROM weekly_meetings 
         WHERE (id = ? OR parent_id = ?)
           AND meeting_date > ?
           AND status = 'scheduled'
         ORDER BY meeting_date ASC LIMIT 1`,
        [actualParentId, actualParentId, today]
      );

      res.json({
        success: true,
        message: "Attendance marked successfully",
        data: updatedAttendance[0],
        future_meetings: futureResult,
        next_meeting: nextMeeting[0] || null,
        series_parent_id: actualParentId
      });

    } catch (error) {
      await connection.rollback();
      console.error("Error marking attendance:", error);
      
      res.status(500).json({
        success: false,
        message: error.message || "Failed to mark attendance"
      });
    } finally {
      connection.release();
    }
  }
);

// Get upcoming meetings for user's area (mobile app endpoint)
router.get("/weekly-meetings/my-area/upcoming", authenticateToken, dbHealthCheck, async (req, res) => {
  try {
    const { user } = req;
    const today = getUTCDateString(new Date());

    // Get next meeting
    const [nextMeeting] = await pool.execute(
      `SELECT wm.*, 
        COALESCE(wma.status, 'not_marked') as my_attendance_status,
        (SELECT COUNT(*) FROM weekly_meeting_attendance WHERE weekly_meeting_id = wm.id) as total_marked,
        (SELECT COUNT(*) FROM weekly_meeting_attendance WHERE weekly_meeting_id = wm.id AND status = 'present') as present_count,
        CASE WHEN wm.parent_id IS NULL THEN 'parent' ELSE 'child' END as meeting_type
       FROM weekly_meetings wm
       LEFT JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id AND wma.user_id = ?
       WHERE wm.area_id = ? 
         AND wm.meeting_date >= ?
         AND wm.status = 'scheduled'
       ORDER BY wm.meeting_date ASC, wm.meeting_time ASC
       LIMIT 1`,
      [user.id, user.area_id, today]
    );

    // Get recent past meetings (last 5)
    const [recentMeetings] = await pool.execute(
      `SELECT wm.*, 
        COALESCE(wma.status, 'not_marked') as my_attendance_status,
        (SELECT COUNT(*) FROM weekly_meeting_attendance WHERE weekly_meeting_id = wm.id AND status = 'present') as present_count,
        (SELECT COUNT(*) FROM weekly_meeting_attendance WHERE weekly_meeting_id = wm.id) as total_marked,
        CASE WHEN wm.parent_id IS NULL THEN 'parent' ELSE 'child' END as meeting_type
       FROM weekly_meetings wm
       LEFT JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id AND wma.user_id = ?
       WHERE wm.area_id = ? 
         AND wm.meeting_date < ?
       ORDER BY wm.meeting_date DESC, wm.meeting_time DESC
       LIMIT 5`,
      [user.id, user.area_id, today]
    );

    // Get upcoming meetings after the next one
    const [upcomingMeetings] = await pool.execute(
      `SELECT wm.id, wm.meeting_date, wm.meeting_time, wm.location, wm.parent_id,
        CASE WHEN wm.parent_id IS NULL THEN 'parent' ELSE 'child' END as meeting_type
       FROM weekly_meetings wm
       WHERE wm.area_id = ? 
         AND wm.meeting_date > ?
         AND wm.status = 'scheduled'
       ORDER BY wm.meeting_date ASC, wm.meeting_time ASC
       LIMIT 3 OFFSET 1`,
      [user.area_id, today]
    );

    // If no next meeting found but we have recent meetings, try to create future meetings
    if (nextMeeting.length === 0 && recentMeetings.length > 0) {
      console.log(`🔄 No upcoming meetings found for area ${user.area_id}, attempting to create from recent meeting`);
      
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const futureResult = await ensureFutureMeetingsSafe(connection, recentMeetings[0], 2);
        await connection.commit();
        
        // Retry getting next meeting
        const [newNextMeeting] = await pool.execute(
          `SELECT wm.*, 
            'not_marked' as my_attendance_status,
            0 as total_marked,
            0 as present_count,
            CASE WHEN wm.parent_id IS NULL THEN 'parent' ELSE 'child' END as meeting_type
           FROM weekly_meetings wm
           WHERE wm.area_id = ? 
             AND wm.meeting_date >= ?
             AND wm.status = 'scheduled'
           ORDER BY wm.meeting_date ASC, wm.meeting_time ASC
           LIMIT 1`,
          [user.area_id, today]
        );
        
        res.json({
          success: true,
          data: {
            next_meeting: newNextMeeting[0] || null,
            recent_meetings: recentMeetings,
            upcoming_meetings: [],
            auto_created: futureResult
          }
        });
        return;
        
      } catch (error) {
        await connection.rollback();
        console.error("Error auto-creating meetings:", error);
      } finally {
        connection.release();
      }
    }

    res.json({
      success: true,
      data: {
        next_meeting: nextMeeting[0] || null,
        recent_meetings: recentMeetings,
        upcoming_meetings: upcomingMeetings
      }
    });

  } catch (error) {
    console.error("Error getting upcoming meetings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get upcoming meetings",
      error: error.message
    });
  }
});

// Get detailed attendance report for a specific meeting
router.get("/weekly-meetings/:id/attendance-report", authenticateToken, dbHealthCheck, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // Get meeting details first to check permissions
    const [meetingCheck] = await pool.execute(
      `SELECT area_id FROM weekly_meetings WHERE id = ?`, [id]
    );

    if (meetingCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found"
      });
    }

    // Check permissions
    if (!isAuthorized(user) && user.area_id !== meetingCheck[0].area_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const [report] = await pool.execute(
      `SELECT 
        wm.id as meeting_id,
        wm.meeting_date,
        wm.meeting_time,
        wm.location,
        wm.agenda,
        wm.parent_id,
        CASE WHEN wm.parent_id IS NULL THEN 'parent' ELSE 'child' END as meeting_type,
        a.area_name,
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        COALESCE(wma.status, 'not_marked') as status,
        wma.reason,
        wma.marked_at,
        marker.full_name as marked_by
       FROM weekly_meetings wm
       LEFT JOIN areas a ON wm.area_id = a.area_id
       CROSS JOIN users u ON u.area_id = wm.area_id AND u.status = 'active'
       LEFT JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id AND u.id = wma.user_id
       LEFT JOIN users marker ON wma.marked_by = marker.id
       WHERE wm.id = ?
       ORDER BY u.full_name`,
      [id]
    );

    if (report.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found or no users in this area"
      });
    }

    const summary = {
      total_users: report.length,
      present: report.filter(r => r.status === 'present').length,
      absent: report.filter(r => r.status === 'absent').length,
      excused: report.filter(r => r.status === 'excused').length,
      not_marked: report.filter(r => r.status === 'not_marked').length,
      attendance_rate: report.length > 0 ? 
        ((report.filter(r => r.status === 'present').length / report.length) * 100).toFixed(1) : 0
    };

    res.json({
      success: true,
      data: {
        meeting_info: {
          meeting_id: report[0].meeting_id,
          meeting_date: report[0].meeting_date,
          meeting_time: report[0].meeting_time,
          location: report[0].location,
          agenda: report[0].agenda,
          parent_id: report[0].parent_id,
          meeting_type: report[0].meeting_type,
          area_name: report[0].area_name
        },
        attendance: report,
        summary: summary
      }
    });

  } catch (error) {
    console.error("Error getting attendance report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get attendance report",
      error: error.message
    });
  }
});

// Organizer dashboard - comprehensive area overview
router.get("/weekly-meetings/area/:areaId/dashboard", authenticateToken, dbHealthCheck, async (req, res) => {
  try {
    const { areaId } = req.params;
    const { user } = req;

    // Check permissions
    if (!isAuthorized(user) && user.area_id != areaId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const today = getUTCDateString(new Date());

    // Get recent meetings with comprehensive stats
    const [recentMeetings] = await pool.execute(
      `SELECT 
        wm.*,
        CASE WHEN wm.parent_id IS NULL THEN 'parent' ELSE 'child' END as meeting_type,
        COUNT(wma.id) as total_marked,
        COUNT(CASE WHEN wma.status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN wma.status = 'absent' THEN 1 END) as absent_count,
        COUNT(CASE WHEN wma.status = 'excused' THEN 1 END) as excused_count,
        (SELECT COUNT(*) FROM users WHERE area_id = wm.area_id AND status = 'active') as total_area_users,
        ROUND((COUNT(CASE WHEN wma.status = 'present' THEN 1 END) / 
               (SELECT COUNT(*) FROM users WHERE area_id = wm.area_id AND status = 'active')) * 100, 1) as attendance_rate
       FROM weekly_meetings wm
       LEFT JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id
       WHERE wm.area_id = ? AND wm.meeting_date <= ?
       GROUP BY wm.id
       ORDER BY wm.meeting_date DESC, wm.meeting_time DESC
       LIMIT 5`,
      [areaId, today]
    );

    // Get upcoming meetings
    const [upcomingMeetings] = await pool.execute(
      `SELECT wm.*, 
        CASE WHEN wm.parent_id IS NULL THEN 'parent' ELSE 'child' END as meeting_type,
        COUNT(wma.id) as early_marked
       FROM weekly_meetings wm
       LEFT JOIN weekly_meeting_attendance wma ON wm.id = wma.weekly_meeting_id
       WHERE wm.area_id = ? AND wm.meeting_date > ?
       GROUP BY wm.id
       ORDER BY wm.meeting_date ASC, wm.meeting_time ASC
       LIMIT 5`,
      [areaId, today]
    );

    // Get meeting series statistics
    const [seriesStats] = await pool.execute(
      `SELECT 
        CASE WHEN parent_id IS NULL THEN id ELSE parent_id END as series_id,
        COUNT(*) as total_meetings,
        MIN(meeting_date) as series_start,
        MAX(meeting_date) as series_end,
        COUNT(CASE WHEN meeting_date <= ? THEN 1 END) as completed_meetings,
        COUNT(CASE WHEN meeting_date > ? THEN 1 END) as upcoming_meetings
       FROM weekly_meetings 
       WHERE area_id = ?
       GROUP BY CASE WHEN parent_id IS NULL THEN id ELSE parent_id END
       ORDER BY series_start DESC`,
      [today, today, areaId]
    );

    // Calculate overall statistics
    const totalMeetings = recentMeetings.length;
    const avgAttendance = totalMeetings > 0 
      ? recentMeetings.reduce((sum, m) => sum + parseFloat(m.attendance_rate || 0), 0) / totalMeetings 
      : 0;

    const stats = {
      total_recent_meetings: totalMeetings,
      avg_attendance_rate: Math.round(avgAttendance * 10) / 10,
      total_upcoming: upcomingMeetings.length,
      active_series: seriesStats.length,
      total_series_meetings: seriesStats.reduce((sum, s) => sum + s.total_meetings, 0)
    };

    res.json({
      success: true,
      data: {
        recent_meetings: recentMeetings,
        upcoming_meetings: upcomingMeetings,
        meeting_series: seriesStats,
        area_stats: stats
      }
    });

  } catch (error) {
    console.error("Error getting dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard data",
      error: error.message
    });
  }
});

// Update meeting with series consideration
router.put("/weekly-meetings/:id", 
  authenticateToken, 
  dbHealthCheck, 
  [
    body('meeting_date').optional().isISO8601().toDate(),
    body('meeting_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('location').optional().isLength({ min: 1, max: 255 }).trim(),
    body('agenda').optional().isLength({ min: 1, max: 1000 }).trim(),
    body('status').optional().isIn(['scheduled', 'completed', 'cancelled']),
    body('update_series').optional().isBoolean(),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { id } = req.params;
      const { meeting_date, meeting_time, location, agenda, status, update_series = false } = req.body;
      const { user } = req;

      // Get current meeting with lock
      const [currentMeeting] = await connection.execute(
        `SELECT * FROM weekly_meetings WHERE id = ? FOR UPDATE`, [id]
      );

      if (currentMeeting.length === 0) {
        throw new Error("Meeting not found");
      }

      const meeting = currentMeeting[0];

      // Check permissions
      if (!isAuthorized(user) && user.area_id !== meeting.area_id) {
        throw new Error("Access denied. You can only update meetings in your area.");
      }

      const updateFields = [];
      const updateValues = [];

      if (meeting_date && getUTCDateString(meeting_date) !== meeting.meeting_date) {
        updateFields.push("meeting_date = ?");
        updateValues.push(getUTCDateString(meeting_date));
      }

      if (meeting_time && meeting_time !== meeting.meeting_time) {
        updateFields.push("meeting_time = ?");
        updateValues.push(meeting_time);
      }

      if (location !== undefined && location !== meeting.location) {
        updateFields.push("location = ?");
        updateValues.push(location);
      }

      if (agenda !== undefined && agenda !== meeting.agenda) {
        updateFields.push("agenda = ?");
        updateValues.push(agenda);
      }

      if (status && status !== meeting.status) {
        updateFields.push("status = ?");
        updateValues.push(status);
      }

      if (updateFields.length === 0) {
        throw new Error("No valid fields provided for update");
      }

      updateFields.push("updated_at = NOW()");
      updateValues.push(id);

      // Update current meeting
      const sql = `UPDATE weekly_meetings SET ${updateFields.join(", ")} WHERE id = ?`;
      await connection.execute(sql, updateValues);

      let seriesUpdateCount = 0;

      // If update_series is true and this is a parent meeting, update future meetings in series
      if (update_series && !meeting.parent_id) {
        console.log(`🔄 Updating series template for parent meeting ${id}`);
        
        const futureUpdateFields = [];
        const futureUpdateValues = [];

        if (meeting_time && meeting_time !== meeting.meeting_time) {
          futureUpdateFields.push("meeting_time = ?");
          futureUpdateValues.push(meeting_time);
        }

        if (location !== undefined && location !== meeting.location) {
          futureUpdateFields.push("location = ?");
          futureUpdateValues.push(location);
        }

        if (agenda !== undefined && agenda !== meeting.agenda) {
          futureUpdateFields.push("agenda = ?");
          futureUpdateValues.push(agenda);
        }

        if (futureUpdateFields.length > 0) {
          futureUpdateFields.push("updated_at = NOW()");
          futureUpdateValues.push(meeting.id);
          futureUpdateValues.push(getUTCDateString(new Date()));

          const futureSql = `UPDATE weekly_meetings SET ${futureUpdateFields.join(", ")} 
                            WHERE parent_id = ? AND meeting_date > ?`;
          const [futureResult] = await connection.execute(futureSql, futureUpdateValues);
          seriesUpdateCount = futureResult.affectedRows;
          
          console.log(`✅ Updated ${seriesUpdateCount} future meetings in series`);
        }
      }

      await connection.commit();

      // Get updated meeting
      const [updatedMeeting] = await pool.execute(
        `SELECT wm.*, a.area_name,
          CASE WHEN wm.parent_id IS NULL THEN 'parent' ELSE 'child' END as meeting_type,
          (SELECT COUNT(*) FROM weekly_meetings WHERE parent_id = wm.id) as child_meetings_count
         FROM weekly_meetings wm
         LEFT JOIN areas a ON wm.area_id = a.area_id
         WHERE wm.id = ?`,
        [id]
      );

      res.json({
        success: true,
        message: "Meeting updated successfully",
        data: updatedMeeting[0],
        series_updated: update_series && !meeting.parent_id,
        future_meetings_updated: seriesUpdateCount
      });

    } catch (error) {
      await connection.rollback();
      console.error("Error updating meeting:", error);
      
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update meeting"
      });
    } finally {
      connection.release();
    }
  }
);

// Delete meeting with series consideration
router.delete("/weekly-meetings/:id", authenticateToken, dbHealthCheck, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { delete_series = false, reason } = req.body;
    const { user } = req;

    // Get meeting details with lock
    const [meetingDetails] = await connection.execute(
      `SELECT * FROM weekly_meetings WHERE id = ? FOR UPDATE`, [id]
    );

    if (meetingDetails.length === 0) {
      throw new Error("Meeting not found");
    }

    const meeting = meetingDetails[0];

    // Check permissions
    if (!isAuthorized(user) && user.area_id !== meeting.area_id) {
      throw new Error("Access denied. You can only delete meetings in your area.");
    }

    let deletedFutureCount = 0;
    const deletedMeetings = [meeting];

    // If delete_series is true, delete all future meetings with same parent
    if (delete_series) {
      const actualParentId = meeting.parent_id || meeting.id;
      const today = getUTCDateString(new Date());
      
      console.log(`🗑️ Deleting future meetings in series: ${actualParentId}`);

      // Find future meetings to delete
      const [futureMeetings] = await connection.execute(
        `SELECT * FROM weekly_meetings 
         WHERE (id = ? OR parent_id = ?) 
           AND meeting_date >= ?
           AND id != ?`,
        [actualParentId, actualParentId, today, id]
      );

      if (futureMeetings.length > 0) {
        const futureIds = futureMeetings.map(m => m.id);
        
        // Delete attendance for future meetings
        const attendancePlaceholders = futureIds.map(() => "?").join(",");
        await connection.execute(
          `DELETE FROM weekly_meeting_attendance WHERE weekly_meeting_id IN (${attendancePlaceholders})`,
          futureIds
        );

        // Delete future meetings
        const meetingPlaceholders = futureIds.map(() => "?").join(",");
        await connection.execute(
          `DELETE FROM weekly_meetings WHERE id IN (${meetingPlaceholders})`,
          futureIds
        );

        deletedFutureCount = futureMeetings.length;
        deletedMeetings.push(...futureMeetings);
        console.log(`✅ Deleted ${deletedFutureCount} future meetings`);
      }
    }

    // Delete attendance records for current meeting
    await connection.execute(
      `DELETE FROM weekly_meeting_attendance WHERE weekly_meeting_id = ?`, [id]
    );

    // Delete the current meeting
    const [deleteResult] = await connection.execute(
      `DELETE FROM weekly_meetings WHERE id = ?`, [id]
    );

    if (deleteResult.affectedRows === 0) {
      throw new Error("Meeting not found or already deleted");
    }

    await connection.commit();

    // Log the deletion for audit trail
    const logMessage = `Deleted meeting ${id} (${meeting.pattern_key || 'no-pattern'}) by user ${user.id}`;
    console.log(`✅ ${logMessage}${reason ? ` - Reason: ${reason}` : ""}`);

    res.json({
      success: true,
      message: delete_series ? "Meeting series deleted successfully" : "Meeting deleted successfully",
      deleted_meetings: deletedMeetings.map(m => ({
        id: m.id,
        meeting_date: m.meeting_date,
        meeting_time: m.meeting_time,
        parent_id: m.parent_id
      })),
      series_deleted: delete_series,
      total_deleted: deletedMeetings.length,
      reason: reason || null
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error deleting meeting:", error);
    
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete meeting"
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
