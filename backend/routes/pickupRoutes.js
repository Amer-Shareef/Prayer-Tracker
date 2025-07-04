const express = require("express");
const { pool } = require("../config/database"); // Fixed import - use database.js
const { authenticateToken, authorizeRole } = require("../middleware/auth");
const { dbHealthCheck } = require("../middleware/dbHealthCheck"); // Added dbHealthCheck middleware

const router = express.Router();

// Get pickup requests for user - ENHANCED to support founder/admin view
router.get(
  "/pickup-requests",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const { status, start_date, end_date, limit = 50, all } = req.query;

      console.log("🔍 Pickup requests query:", {
        user: user.username,
        role: user.role,
        status,
        start_date,
        end_date,
        limit,
        all,
        requestAll: all === "true",
      });

      // Build query based on user role and 'all' parameter
      let query;
      let queryParams = [];

      if (
        all === "true" &&
        (user.role === "Founder" || user.role === "SuperAdmin")
      ) {
        // Founders and SuperAdmins can see all pickup requests
        query = `
          SELECT pr.*, 
                 u.username as member_username,
                 u.phone as member_phone,
                 u.email as member_email,
                 u.full_name as member_name,
                 CONCAT(UPPER(LEFT(COALESCE(u.area, 'GEN'), 2)), LPAD(u.id, 4, '0')) as member_id,
                 m.name as mosque_name
          FROM pickup_requests pr
          LEFT JOIN users u ON pr.user_id = u.id
          LEFT JOIN mosques m ON pr.mosque_id = m.id
          WHERE pr.mosque_id = ?
        `;

        // Get user's mosque_id or use 1 as default
        const userMosqueId = user.mosque_id || 1;
        queryParams.push(userMosqueId);

        console.log(
          `👑 Admin/Founder getting all requests for mosque ${userMosqueId}`
        );
      } else {
        // Regular members see only their own requests
        query = `
          SELECT pr.*, 
                 u.username as member_username,
                 u.phone as member_phone,
                 u.email as member_email,
                 u.full_name as member_name,
                 CONCAT(UPPER(LEFT(COALESCE(u.area, 'GEN'), 2)), LPAD(u.id, 4, '0')) as member_id,
                 m.name as mosque_name
          FROM pickup_requests pr
          LEFT JOIN users u ON pr.user_id = u.id
          LEFT JOIN mosques m ON pr.mosque_id = m.id
          WHERE pr.user_id = ?
        `;
        queryParams.push(user.id);

        console.log(`👤 Member getting own requests for user ${user.id}`);
      }

      // Add status filter
      if (status) {
        query += " AND pr.status = ?";
        queryParams.push(status);
      }

      // Add date range filter
      if (start_date) {
        query += " AND pr.created_at >= ?";
        queryParams.push(start_date);
      }

      if (end_date) {
        query += " AND pr.created_at <= ?";
        queryParams.push(end_date);
      }

      query += " ORDER BY pr.created_at DESC, pr.id DESC";

      console.log("🔍 Final query:", query);
      console.log("📋 Query params:", queryParams);

      // Execute query WITHOUT LIMIT in SQL
      const [allResults] = await pool.execute(query, queryParams);

      // Apply LIMIT in JavaScript
      const limitValue = parseInt(limit, 10);
      const results =
        isNaN(limitValue) || limitValue <= 0
          ? allResults
          : allResults.slice(0, limitValue);

      console.log(
        `✅ Found ${allResults.length} total requests, returning ${results.length} with limit ${limitValue}`
      );

      // Log sample data for debugging
      if (results.length > 0) {
        console.log("📋 Sample request data:", {
          id: results[0].id,
          user_id: results[0].user_id,
          member_name: results[0].member_name || results[0].member_username,
          pickup_location: results[0].pickup_location,
          status: results[0].status,
          created_at: results[0].created_at,
        });
      }

      res.json({
        success: true,
        data: results,
        count: results.length,
        total: allResults.length,
        userRole: user.role,
        viewingAll:
          all === "true" &&
          (user.role === "Founder" || user.role === "SuperAdmin"),
      });
    } catch (error) {
      console.error("❌ Error fetching pickup requests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch pickup requests",
        error: error.message,
      });
    }
  }
);

// Create pickup request - ENHANCED for mobile workflow
router.post(
  "/pickup-requests",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const {
        pickup_location,
        contact_number,
        special_instructions,
        device_info,
        app_version,
        location_coordinates,
        days, // REQUIRED: Array of selected days ['monday', 'tuesday', etc.]
        prayers, // REQUIRED: Array of selected prayers ['fajr', 'dhuhr', etc.]
      } = req.body;

      // Enhanced validation - REMOVED request_date requirement
      if (!pickup_location || !days || !prayers) {
        return res.status(400).json({
          success: false,
          message: "Pickup location, days, and prayers are required",
        });
      }

      // Validate days array
      const validDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      if (!Array.isArray(days) || days.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one day",
        });
      }

      const invalidDays = days.filter(
        (day) => !validDays.includes(day.toLowerCase())
      );
      if (invalidDays.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid days: ${invalidDays.join(", ")}`,
        });
      }

      // Validate prayers array
      const validPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
      if (!Array.isArray(prayers) || prayers.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one prayer",
        });
      }

      const invalidPrayers = prayers.filter(
        (prayer) => !validPrayers.includes(prayer.toLowerCase())
      );
      if (invalidPrayers.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid prayers: ${invalidPrayers.join(", ")}`,
        });
      }

      // Check for duplicate requests - UPDATED to check by days/prayers combination
      const [existingRequests] = await pool.execute(
        `SELECT id FROM pickup_requests 
       WHERE user_id = ? AND status NOT IN ('cancelled', 'completed', 'rejected')`,
        [user.id]
      );

      if (existingRequests.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "You already have a pending pickup request. Please cancel it first to create a new one.",
        });
      }

      // Get user's mosque
      const [userInfo] = await pool.execute(
        "SELECT mosque_id FROM users WHERE id = ?",
        [user.id]
      );

      const mosqueId = userInfo[0]?.mosque_id;
      if (!mosqueId) {
        return res.status(400).json({
          success: false,
          message: "User is not assigned to any mosque",
        });
      }

      // Create the pickup request with enhanced data - REMOVED request_date
      const [result] = await pool.execute(
        `INSERT INTO pickup_requests 
       (user_id, mosque_id, prayer_type, pickup_location, 
        special_instructions, contact_number,
        device_info, app_version, location_coordinates, days, prayers, status, created_at)
       VALUES (?, ?, 'Fajr', ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [
          user.id,
          mosqueId,
          pickup_location,
          special_instructions || null,
          contact_number || null,
          device_info ? JSON.stringify(device_info) : null,
          app_version || null,
          location_coordinates ? JSON.stringify(location_coordinates) : null,
          JSON.stringify(days.map((d) => d.toLowerCase())),
          JSON.stringify(prayers.map((p) => p.toLowerCase())),
        ]
      );

      // Log the history
      await pool.execute(
        `INSERT INTO pickup_request_history 
       (pickup_request_id, changed_by, change_type, new_value, notes)
       VALUES (?, ?, 'created', ?, 'Request created via mobile app')`,
        [
          result.insertId,
          user.id,
          JSON.stringify({
            status: "pending",
            pickup_location,
            days: days,
            prayers: prayers,
          }),
        ]
      );

      // Get the created request with full details
      const [createdRequest] = await pool.execute(
        `SELECT pr.*, u.username, u.email, u.phone, m.name as mosque_name
       FROM pickup_requests pr
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN mosques m ON pr.mosque_id = m.id
       WHERE pr.id = ?`,
        [result.insertId]
      );

      console.log(
        `✅ Mobile pickup request created: ID ${result.insertId} for ${user.username}`,
        {
          days: days,
          prayers: prayers,
        }
      );

      res.status(201).json({
        success: true,
        message: "Pickup request submitted successfully",
        data: createdRequest[0],
      });
    } catch (error) {
      console.error("Error creating pickup request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create pickup request",
        error: error.message,
      });
    }
  }
);

// Update pickup request - SIMPLIFIED for Fajr only
router.put(
  "/pickup-requests/:id",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const { id } = req.params;
      const { pickup_location, status, days, prayers } = req.body;

      // Get existing request
      const [existingRequest] = await pool.execute(
        "SELECT * FROM pickup_requests WHERE id = ? AND user_id = ?",
        [id, user.id]
      );

      if (existingRequest.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Pickup request not found",
        });
      }

      const request = existingRequest[0];

      // Check if request can be modified
      if (request.status === "completed" || request.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: `Cannot modify ${request.status} request`,
        });
      }

      // Validate status change (users can only cancel)
      if (status && status !== "cancelled") {
        return res.status(403).json({
          success: false,
          message: "Users can only cancel their requests",
        });
      }

      // Validate optional days array
      const validDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      if (days && Array.isArray(days)) {
        const invalidDays = days.filter(
          (day) => !validDays.includes(day.toLowerCase())
        );
        if (invalidDays.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid days: ${invalidDays.join(", ")}`,
          });
        }
      }

      // Validate optional prayers array
      const validPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
      if (prayers && Array.isArray(prayers)) {
        const invalidPrayers = prayers.filter(
          (prayer) => !validPrayers.includes(prayer.toLowerCase())
        );
        if (invalidPrayers.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid prayers: ${invalidPrayers.join(", ")}`,
          });
        }
      }

      // Build update query
      const updateFields = [];
      const updateValues = [];

      if (pickup_location !== undefined) {
        updateFields.push("pickup_location = ?");
        updateValues.push(pickup_location);
      }

      if (status) {
        updateFields.push("status = ?");
        updateValues.push(status);
      }

      if (days !== undefined) {
        updateFields.push("days = ?");
        updateValues.push(
          days && days.length > 0
            ? JSON.stringify(days.map((d) => d.toLowerCase()))
            : null
        );
      }

      if (prayers !== undefined) {
        updateFields.push("prayers = ?");
        updateValues.push(
          prayers && prayers.length > 0
            ? JSON.stringify(prayers.map((p) => p.toLowerCase()))
            : null
        );
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No fields to update",
        });
      }

      updateFields.push("updated_at = CURRENT_TIMESTAMP");
      updateValues.push(id, user.id);

      await pool.execute(
        `UPDATE pickup_requests SET ${updateFields.join(
          ", "
        )} WHERE id = ? AND user_id = ?`,
        updateValues
      );

      // Get updated request
      const [updatedRequest] = await pool.execute(
        `SELECT pr.*, m.name as mosque_name
       FROM pickup_requests pr
       LEFT JOIN mosques m ON pr.mosque_id = m.id
       WHERE pr.id = ?`,
        [id]
      );

      console.log(
        `✅ Pickup request updated: ID ${id} - ${status || "modified"}`,
        {
          days: days || "unchanged",
          prayers: prayers || "unchanged",
        }
      );

      res.json({
        success: true,
        message: "Pickup request updated successfully",
        data: updatedRequest[0],
      });
    } catch (error) {
      console.error("Error updating pickup request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update pickup request",
        error: error.message,
      });
    }
  }
);

// Delete/Cancel pickup request - FIXED to actually delete from database
router.delete(
  "/pickup-requests/:id",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const { id } = req.params;

      console.log(`🗑️ Deleting pickup request ID: ${id} for user: ${user.id}`);

      // Get existing request
      const [existingRequest] = await pool.execute(
        "SELECT * FROM pickup_requests WHERE id = ? AND user_id = ?",
        [id, user.id]
      );

      if (existingRequest.length === 0) {
        console.log(`❌ Request ${id} not found for user ${user.id}`);
        return res.status(404).json({
          success: false,
          message: "Pickup request not found",
        });
      }

      const request = existingRequest[0];
      console.log(
        `📋 Found request: ${request.prayer_type} on ${request.request_date}, status: ${request.status}`
      );

      // Check if request can be deleted (only pending requests can be cancelled/deleted)
      if (request.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel completed request",
        });
      }

      if (request.status === "approved") {
        return res.status(400).json({
          success: false,
          message:
            "Cannot cancel approved request. Please contact the founder.",
        });
      }

      // FIXED: Actually DELETE the record from database (not just update status)
      console.log(`🗑️ Permanently deleting request ${id} from database`);

      await pool.execute(
        "DELETE FROM pickup_requests WHERE id = ? AND user_id = ?",
        [id, user.id]
      );

      console.log(`✅ Request ${id} permanently deleted from database`);

      res.json({
        success: true,
        message: "Pickup request cancelled and removed successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting pickup request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel pickup request",
        error: error.message,
      });
    }
  }
);

// PUT /api/pickup-requests/:id/approve - Approve pickup request and assign driver
router.put("/:id/approve", async (req, res) => {
  const requestId = req.params.id;
  const { assignedDriverId, assignedDriverName } = req.body;

  console.log(
    "🟢 Approving pickup request:",
    requestId,
    "with driver:",
    assignedDriverName
  );

  try {
    const connection = await pool.getConnection();

    // Update the pickup request with approval and driver assignment
    const [result] = await connection.query(
      `
      UPDATE pickup_requests 
      SET 
        status = 'approved',
        assigned_driver_id = ?,
        assigned_driver_name = ?,
        approved_at = NOW()
      WHERE id = ?
    `,
      [assignedDriverId, assignedDriverName, requestId]
    );

    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Pickup request not found",
      });
    }

    connection.release();

    console.log("✅ Pickup request approved successfully");
    res.json({
      success: true,
      message: "Pickup request approved successfully",
    });
  } catch (error) {
    console.error("❌ Error approving pickup request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve pickup request",
      error: error.message,
    });
  }
});

// PUT /api/pickup-requests/:id/reject - Reject pickup request
router.put("/:id/reject", async (req, res) => {
  const requestId = req.params.id;
  const { rejectionReason } = req.body;

  console.log(
    "🔴 Rejecting pickup request:",
    requestId,
    "reason:",
    rejectionReason
  );

  try {
    const connection = await pool.getConnection();

    // Update the pickup request with rejection
    const [result] = await connection.query(
      `
      UPDATE pickup_requests 
      SET 
        status = 'rejected',
        rejection_reason = ?,
        rejected_at = NOW()
      WHERE id = ?
    `,
      [rejectionReason, requestId]
    );

    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Pickup request not found",
      });
    }

    connection.release();

    console.log("✅ Pickup request rejected successfully");
    res.json({
      success: true,
      message: "Pickup request rejected successfully",
    });
  } catch (error) {
    console.error("❌ Error rejecting pickup request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject pickup request",
      error: error.message,
    });
  }
});

module.exports = router;
