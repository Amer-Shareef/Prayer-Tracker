const express = require("express");
const { pool } = require("../config/database"); // Fixed import - use database.js
const { authenticateToken, authorizeRole } = require("../middleware/auth");
const { dbHealthCheck } = require("../middleware/dbHealthCheck"); // Added dbHealthCheck middleware

const router = express.Router();

// Get pickup requests for user - COMPLETELY REWRITTEN APPROACH
router.get(
  "/pickup-requests",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const { status, start_date, end_date, limit = 50 } = req.query;

      console.log("🔍 Raw query params:", {
        status,
        start_date,
        end_date,
        limit,
        limitType: typeof limit,
        userId: user.id,
      });

      // Build query dynamically WITHOUT using LIMIT in prepared statement
      let query = `
      SELECT pr.*, m.name as mosque_name
      FROM pickup_requests pr
      LEFT JOIN mosques m ON pr.mosque_id = m.id
      WHERE pr.user_id = ?
    `;
      const queryParams = [user.id];

      // Add status filter
      if (status) {
        query += " AND pr.status = ?";
        queryParams.push(status);
      }

      // Add date range filter using created_at instead of request_date
      if (start_date) {
        query += " AND DATE(pr.created_at) >= ?";
        queryParams.push(start_date);
      }

      if (end_date) {
        query += " AND DATE(pr.created_at) <= ?";
        queryParams.push(end_date);
      }

      query += " ORDER BY pr.created_at DESC";

      console.log("🔍 Query without LIMIT:", query);
      console.log("📋 Query params:", queryParams);

      // Execute query first WITHOUT LIMIT
      const [allResults] = await pool.execute(query, queryParams);

      // Apply LIMIT in JavaScript instead of SQL
      const limitValue = parseInt(limit, 10);
      const results =
        isNaN(limitValue) || limitValue <= 0
          ? allResults
          : allResults.slice(0, limitValue);

      console.log(
        `✅ Found ${allResults.length} total requests, returning ${results.length} with limit ${limitValue}`
      );

      res.json({
        success: true,
        data: results,
        count: results.length,
        total: allResults.length,
      });
    } catch (error) {
      console.error("❌ Error fetching pickup requests:", error);
      console.error("Full error details:", {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sql: error.sql,
      });

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
        mosque_id,
        pickup_location,
        contact_number,
        special_instructions,
        location_coordinates,
        days, // Array of selected days ['monday', 'tuesday', etc.]
        prayers, // Array of selected prayers ['fajr', 'dhuhr', etc.]
      } = req.body;

      // Simplified validation - only pickup_location and mosque_id are mandatory
      if (!pickup_location || !mosque_id) {
        return res.status(400).json({
          success: false,
          message: "Pickup location and mosque_id are required",
        });
      }

      // Optional validation for days and prayers (if provided)
      if (days && Array.isArray(days) && days.length > 0) {
        const validDays = [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ];
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

      if (prayers && Array.isArray(prayers) && prayers.length > 0) {
        const validPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
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

      // Get user's mosque if not provided
      let mosqueId = mosque_id;
      if (!mosqueId) {
        const [userInfo] = await pool.execute(
          "SELECT mosque_id FROM users WHERE id = ?",
          [user.id]
        );
        mosqueId = userInfo[0]?.mosque_id;
      }

      if (!mosqueId) {
        return res.status(400).json({
          success: false,
          message:
            "User is not assigned to any mosque and mosque_id not provided",
        });
      }

      // Create the pickup request with simplified data
      const [result] = await pool.execute(
        `INSERT INTO pickup_requests 
       (user_id, mosque_id, pickup_location, special_instructions, contact_number,
        location_coordinates, days, prayers, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [
          user.id,
          mosqueId,
          pickup_location,
          special_instructions || null,
          contact_number || null,
          location_coordinates ? JSON.stringify(location_coordinates) : null,
          days
            ? JSON.stringify(days.map((d) => d.toLowerCase()))
            : JSON.stringify(["daily"]),
          prayers
            ? JSON.stringify(prayers.map((p) => p.toLowerCase()))
            : JSON.stringify(["fajr"]),
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
        `📋 Found request: ${request.pickup_location} created ${request.created_at}, status: ${request.status}`
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
router.put(
  "/pickup-requests/:id/approve",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  dbHealthCheck,
  async (req, res) => {
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
  }
);

// PUT /api/pickup-requests/:id/reject - Reject pickup request
router.put(
  "/pickup-requests/:id/reject",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  dbHealthCheck,
  async (req, res) => {
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

      // Update the pickup request with rejection - FIXED column name
      const [result] = await connection.query(
        `
      UPDATE pickup_requests 
      SET 
        status = 'rejected',
        rejected_reason = ?,
        rejected_at = NOW(),
        rejected_by = ?
      WHERE id = ?
    `,
        [rejectionReason, req.user.id, requestId]
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
  }
);

// GET /api/pickup-requests/all - Get all pickup requests for founders/superadmin
router.get(
  "/pickup-requests/all",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin", "founder", "superadmin"]),
  async (req, res) => {
    try {
      const { user } = req;
      const { status, mosque_id } = req.query;

      console.log("📋 Founder getting pickup requests:", {
        userId: user.id,
        userRole: user.role,
        requestedMosqueId: mosque_id,
      });

      let query = `
        SELECT pr.*, 
               m.name as mosque_name,
               u.username as member_username,
               u.phone as member_phone,
               u.email as member_email,
               u.full_name as member_name,
               du.username as driver_username,
               du.phone as driver_phone
        FROM pickup_requests pr
        LEFT JOIN mosques m ON pr.mosque_id = m.id
        LEFT JOIN users u ON pr.user_id = u.id
        LEFT JOIN users du ON pr.assigned_driver_id = du.id
        WHERE 1=1
      `;
      const queryParams = [];

      // Filter by mosque for founders - CHECK MULTIPLE ROLE FORMATS
      if (user.role === "Founder" || user.role === "founder") {
        console.log("👑 User is founder, filtering by their mosque");
        query +=
          " AND pr.mosque_id = (SELECT mosque_id FROM users WHERE id = ?)";
        queryParams.push(user.id);
      } else if (mosque_id) {
        console.log("🔧 SuperAdmin specifying mosque_id:", mosque_id);
        // SuperAdmin can specify mosque_id
        query += " AND pr.mosque_id = ?";
        queryParams.push(mosque_id);
      } else {
        console.log("🌍 No mosque filter applied (SuperAdmin seeing all)");
      }

      // Filter by status if provided
      if (status) {
        query += " AND pr.status = ?";
        queryParams.push(status);
      }

      query += " ORDER BY pr.created_at DESC";

      console.log("🔍 Founder query:", query);
      console.log("📋 Founder query params:", queryParams);

      const [requests] = await pool.execute(query, queryParams);

      console.log(
        `✅ Found ${requests.length} pickup requests for founder/admin`
      );

      res.json({
        success: true,
        data: requests,
        total: requests.length,
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

// GET /api/pickup-requests/available-drivers - Get members who can be assigned as drivers
router.get(
  "/pickup-requests/available-drivers",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { user } = req;
      const { mosque_id } = req.query;

      console.log("🚗 Getting available drivers");

      let query = `
        SELECT u.id, u.username, u.full_name, u.phone, u.email, u.mobility,
               m.name as mosque_name
        FROM users u
        LEFT JOIN mosques m ON u.mosque_id = m.id
        WHERE u.role = 'Member' 
        AND u.status = 'active'
        AND u.mobility IN ('Car', 'Motorbike', 'car', 'motorbike', 'Vehicle')
        AND u.mosque_id IS NOT NULL
      `;
      const queryParams = [];

      // Filter by mosque for founders
      if (user.role === "Founder") {
        query +=
          " AND u.mosque_id = (SELECT mosque_id FROM users WHERE id = ?)";
        queryParams.push(user.id);
      } else if (mosque_id) {
        // SuperAdmin can specify mosque_id
        query += " AND u.mosque_id = ?";
        queryParams.push(mosque_id);
      }

      query += " ORDER BY u.full_name, u.username";

      const [drivers] = await pool.execute(query, queryParams);

      console.log(`✅ Found ${drivers.length} available drivers`);

      res.json({
        success: true,
        data: drivers,
        total: drivers.length,
      });
    } catch (error) {
      console.error("❌ Error fetching available drivers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch available drivers",
        error: error.message,
      });
    }
  }
);

module.exports = router;
