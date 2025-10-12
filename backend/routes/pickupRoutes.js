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
        assigned_driver_id: user.assigned_driver_id,
      });

      // Build query dynamically WITHOUT using LIMIT in prepared statement
      let query = `
SELECT pr.*, a.area_name, u.full_name as member_name, u.phone as member_phone, du.full_name as driver_name, du.phone as driver_phone
FROM pickup_requests pr
LEFT JOIN areas a ON pr.area_id = a.area_id
LEFT JOIN users u ON pr.user_id = u.id
LEFT JOIN users du ON pr.assigned_driver_id = du.id
WHERE pr.user_id = ? OR pr.assigned_driver_id = ?
    `;
      const queryParams = [user.id, user.id];

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

      // Add role indicator for each request
      const resultsWithRole = results.map((request) => {
        let userRole = null;

        // Only set role if status is approved
        if (request.status === "approved") {
          if (request.user_id === user.id) {
            userRole = "member";
          } else if (request.assigned_driver_id === user.id) {
            userRole = "driver";
          }
        }

        return {
          ...request,
          user_role: userRole,
        };
      });

      res.json({
        success: true,
        data: resultsWithRole,
        count: resultsWithRole.length,
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

// GET /api/pickup-requests/all - Get all pickup requests (accessible to all authenticated users)
router.get("/pickup-requests/all", authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { status, area_id } = req.query;

    console.log("Getting pickup requests for user:", {
      userId: user.id,
      userRole: user.role,
      requestedAreaId: area_id,
    });

    let query = `
SELECT pr.*, 
a.area_name as area_name,
u.username as member_username,
               u.phone as member_phone,

               u.full_name as member_name,
               du.username as driver_username,
               du.phone as driver_phone,
               du.full_name as driver_name
        FROM pickup_requests pr
        LEFT JOIN areas a ON pr.area_id = a.area_id
        LEFT JOIN users u ON pr.user_id = u.id
        LEFT JOIN users du ON pr.assigned_driver_id = du.id
        WHERE 1=1
      `;
    const queryParams = [];

    // Apply role-based filtering
    // if (user.role === "Member") {
    //   console.log("Member accessing - showing only their area's requests");
    //   // Members can see all requests from their area but with limited personal info
    //   query += " AND pr.area_id = (SELECT area_id FROM users WHERE id = ?)";
    //   queryParams.push(user.id);

    //   // For members, remove sensitive personal information
    //   query = `
    //       SELECT pr.id, pr.pickup_location, pr.status, pr.created_at, pr.days, pr.prayers,
    //              pr.special_instructions, pr.approved_at, pr.rejected_at,
    //              a.name as area_name,
    //              CASE WHEN pr.user_id = ? THEN u.username ELSE 'Anonymous Member' END as member_username,
    //              CASE WHEN pr.user_id = ? THEN u.phone ELSE NULL END as member_phone,
    //              CASE WHEN pr.user_id = ? THEN u.email ELSE NULL END as member_email,
    //              CASE WHEN pr.user_id = ? THEN u.full_name ELSE 'Anonymous Member' END as member_name,
    //              du.username as driver_username,
    //              du.phone as driver_phone
    //       FROM pickup_requests pr
    //       LEFT JOIN areas m ON pr.area_id = a.id
    //       LEFT JOIN users u ON pr.user_id = u.id
    //       LEFT JOIN users du ON pr.assigned_driver_id = du.id
    //       WHERE pr.area_id = (SELECT area_id FROM users WHERE id = ?)
    //     `;
    //   queryParams.push(user.id, user.id, user.id, user.id, user.id);
    // } else
    if (
      user.role === "Founder" ||
      user.role === "WCM" ||
      user.role === "founder" ||
      user.role === "Member"
    ) {
      console.log("Founder/WCM accessing - showing their area's requests");
      query += " AND pr.area_id = (SELECT area_id FROM users WHERE id = ?)";
      queryParams.push(user.id);
    } else if (user.role === "SuperAdmin" || user.role === "superadmin") {
      if (area_id) {
        console.log("SuperAdmin specifying area_id:", area_id);
        query += " AND pr.area_id = ?";
        queryParams.push(area_id);
      } else {
        console.log("SuperAdmin seeing all requests");
      }
    }

    // Filter by status if provided
    if (status) {
      query += " AND pr.status = ?";
      queryParams.push(status);
    }

    query += " ORDER BY pr.created_at DESC";

    console.log("Query:", query);
    console.log("Query params:", queryParams);

    const [requests] = await pool.execute(query, queryParams);

    console.log(`✅ Found ${requests.length} pickup requests for ${user.role}`);

    // Add role indicator for each request
    const requestsWithRole = requests.map((request) => {
      let userRole = null;

      // Only set role if status is approved
      if (request.status === "approved") {
        if (request.user_id === user.id) {
          userRole = "member";
        } else if (request.assigned_driver_id === user.id) {
          userRole = "driver";
        }
      }

      return {
        ...request,
        user_role: userRole,
      };
    });

    res.json({
      success: true,
      data: requestsWithRole,
      total: requestsWithRole.length,
    });
  } catch (error) {
    console.error("❌ Error fetching pickup requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pickup requests",
      error: error.message,
    });
  }
});
// Create pickup request - ENHANCED for mobile workflow
router.post(
  "/pickup-requests",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const {
        area_id,
        pickup_location,
        contact_number,
        special_instructions,
        days,
        prayers,
      } = req.body;

      // Simplified validation - only area_id is mandatory
      if (!area_id) {
        return res.status(400).json({
          success: false,
          message: "Area ID is required",
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

      // Get user's area if not provided
      let areaId = area_id;
      if (!areaId) {
        const [userInfo] = await pool.execute(
          "SELECT area_id FROM users WHERE id = ?",
          [user.id]
        );
        areaId = userInfo[0]?.area_id;
      }

      if (!areaId) {
        return res.status(400).json({
          success: false,
          message: "User is not assigned to any area and area_id not provided",
        });
      }

      // Create the pickup request with simplified data
      const [result] = await pool.execute(
        `INSERT INTO pickup_requests 
       (user_id, area_id, pickup_location, special_instructions, contact_number,
        days, prayers, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [
          user.id,
          areaId,
          pickup_location,
          special_instructions || null,
          contact_number || null,
          days
            ? JSON.stringify(days.map((d) => d.toLowerCase()))
            : JSON.stringify(["daily"]),
          prayers
            ? JSON.stringify(prayers.map((p) => p.toLowerCase()))
            : JSON.stringify(["fajr"]),
        ]
      );

      // Log the history (commenting out since pickup_request_history table may not exist)
      // await pool.execute(
      //   `INSERT INTO pickup_request_history
      //  (pickup_request_id, changed_by, change_type, new_value, notes)
      //  VALUES (?, ?, 'created', ?, 'Request created via mobile app')`,
      //   [
      //     result.insertId,
      //     user.id,
      //     JSON.stringify({
      //       status: "pending",
      //       pickup_location,
      //       days: days,
      //       prayers: prayers,
      //     }),
      //   ]
      // );

      // Get the created request with full details
      const [createdRequest] = await pool.execute(
        `SELECT pr.*, u.username, u.email, u.phone, a.area_name
       FROM pickup_requests pr
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN areas a ON pr.area_id = a.area_id
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
        `SELECT pr.*, a.area_name
       FROM pickup_requests pr
       LEFT JOIN areas a ON pr.area_id = a.area_id
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
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  dbHealthCheck,
  async (req, res) => {
    const requestId = req.params.id;
    const { assigned_driver_id, assigned_driver_name } = req.body;

    console.log(
      "🟢 Approving pickup request:",
      requestId,
      "with driver:",
      assigned_driver_name
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
        [assigned_driver_id, assigned_driver_name, requestId]
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
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  dbHealthCheck,
  async (req, res) => {
    const requestId = req.params.id;
    const { rejectionReason } = req.body;

    console.log(
      "🔴 Rejecting pickup request:",
      requestId,
      "reason:",
      rejectionReason,
      "user:",
      req.user.id
    );

    // Validate input
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    try {
      const connection = await pool.getConnection();

      // First, check if the pickup request exists and get its current status
      const [existingRequest] = await connection.query(
        "SELECT id, status, user_id FROM pickup_requests WHERE id = ?",
        [requestId]
      );

      if (existingRequest.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: "Pickup request not found",
        });
      }

      console.log("📋 Found pickup request:", existingRequest[0]);

      // Check if rejected_reason column exists, if not try rejection_reason, if not use a different approach
      let rejectionReasonColumn = "rejected_reason";
      let includeRejectionReason = true;

      try {
        // Test the column by running a simple query
        await connection.query(
          "SELECT rejected_reason FROM pickup_requests LIMIT 1"
        );
        console.log("✅ rejected_reason column exists");
      } catch (error) {
        if (error.code === "ER_BAD_FIELD_ERROR") {
          console.log(
            "📝 rejected_reason column not found, trying rejection_reason..."
          );
          try {
            await connection.query(
              "SELECT rejection_reason FROM pickup_requests LIMIT 1"
            );
            rejectionReasonColumn = "rejection_reason";
            console.log("✅ rejection_reason column exists");
          } catch (error2) {
            if (error2.code === "ER_BAD_FIELD_ERROR") {
              console.log(
                "⚠️ No rejection reason column found, will only update status"
              );
              includeRejectionReason = false;
            }
          }
        }
      }

      // Update the pickup request with rejection - Handle missing columns gracefully
      let updateQuery, queryParams;

      if (includeRejectionReason) {
        updateQuery = `
        UPDATE pickup_requests 
        SET 
          status = 'rejected',
          ${rejectionReasonColumn} = ?,
          rejected_at = NOW()
        WHERE id = ?
        `;
        queryParams = [rejectionReason.trim(), requestId];
      } else {
        // Fallback: Only update status if rejection reason column doesn't exist
        updateQuery = `
        UPDATE pickup_requests 
        SET 
          status = 'rejected'
        WHERE id = ?
        `;
        queryParams = [requestId];
        console.log("⚠️ Rejection reason will not be saved (column missing)");
      }

      const [result] = await connection.query(updateQuery, queryParams);

      console.log("📊 Update result:", {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows,
        info: result.info,
      });

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

// DELETE /api/pickup-requests/:id/admin - Delete pickup request (Admin only)
router.delete(
  "/pickup-requests/:id/admin",
  authenticateToken,
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  dbHealthCheck,
  async (req, res) => {
    const requestId = req.params.id;

    console.log(
      "🗑️ Admin deleting pickup request:",
      requestId,
      "by user:",
      req.user.id
    );

    try {
      const connection = await pool.getConnection();

      // First, check if the pickup request exists
      const [existingRequest] = await connection.query(
        "SELECT id, status, user_id, pickup_location FROM pickup_requests WHERE id = ?",
        [requestId]
      );

      if (existingRequest.length === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: "Pickup request not found",
        });
      }

      const request = existingRequest[0];
      console.log("📋 Found pickup request to delete:", {
        id: request.id,
        status: request.status,
        user_id: request.user_id,
        pickup_location: request.pickup_location,
      });

      // Delete the pickup request from database
      const [result] = await connection.query(
        "DELETE FROM pickup_requests WHERE id = ?",
        [requestId]
      );

      console.log("📊 Delete result:", {
        affectedRows: result.affectedRows,
      });

      if (result.affectedRows === 0) {
        connection.release();
        return res.status(404).json({
          success: false,
          message: "Pickup request not found",
        });
      }

      connection.release();

      console.log("✅ Pickup request deleted successfully by admin");
      res.json({
        success: true,
        message: "Pickup request deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting pickup request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete pickup request",
        error: error.message,
      });
    }
  }
);

// POST /api/pickup-requests/admin - Create pickup request as admin (assign member and driver)
router.post(
  "/pickup-requests/admin",
  authenticateToken,
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  dbHealthCheck,
  async (req, res) => {
    try {
      const {
        user_id,
        area_id,
        pickup_location,
        contact_number,
        special_instructions,
        days,
        prayers,
        assigned_driver_id,
        assigned_driver_name,
        auto_approve,
      } = req.body;

      console.log("🔧 Admin creating pickup request:", {
        user_id,
        area_id,
        assigned_driver_id,
        auto_approve,
      });

      // Validate required fields
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "Member user ID is required",
        });
      }

      if (!area_id) {
        return res.status(400).json({
          success: false,
          message: "Area ID is required",
        });
      }

      // Validate days array if provided
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

      // Validate prayers array if provided
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

      // Verify user exists and belongs to the specified area
      const [userCheck] = await pool.execute(
        "SELECT id, area_id, full_name, phone FROM users WHERE id = ?",
        [user_id]
      );

      if (userCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Member not found",
        });
      }

      if (userCheck[0].area_id !== area_id) {
        return res.status(400).json({
          success: false,
          message: "Member does not belong to the specified area",
        });
      }

      // Check for duplicate active requests
      const [existingRequests] = await pool.execute(
        `SELECT id FROM pickup_requests 
         WHERE user_id = ? AND status NOT IN ('cancelled', 'completed', 'rejected')`,
        [user_id]
      );

      if (existingRequests.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "This member already has an active pickup request. Please cancel it first.",
        });
      }

      // Determine status based on auto_approve and driver assignment
      let status = "pending";
      let approvedAt = null;

      if (auto_approve && assigned_driver_id) {
        status = "approved";
        approvedAt = new Date();
      }

      // Create the pickup request
      const [result] = await pool.execute(
        `INSERT INTO pickup_requests 
         (user_id, area_id, sub_areas_id, pickup_location, special_instructions, contact_number,
          days, prayers, status, assigned_driver_id, assigned_driver_name, 
          approved_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          user_id,
          area_id,
          req.body.sub_areas_id || null,
          pickup_location ? pickup_location.trim() : null,
          special_instructions ? special_instructions.trim() : null,
          contact_number || userCheck[0].phone || null,
          days && days.length > 0
            ? JSON.stringify(days.map((d) => d.toLowerCase()))
            : JSON.stringify(["daily"]),
          prayers && prayers.length > 0
            ? JSON.stringify(prayers.map((p) => p.toLowerCase()))
            : JSON.stringify(["fajr"]),
          status,
          assigned_driver_id || null,
          assigned_driver_name || null,
          approvedAt,
        ]
      );

      // Get the created request with full details
      const [createdRequest] = await pool.execute(
        `SELECT pr.*, 
                u.username as member_username, 
                u.email as member_email, 
                u.phone as member_phone,
                u.full_name as member_name,
                a.area_name,
                du.username as driver_username,
                du.phone as driver_phone,
                du.full_name as driver_name
         FROM pickup_requests pr
         LEFT JOIN users u ON pr.user_id = u.id
         LEFT JOIN areas a ON pr.area_id = a.area_id
         LEFT JOIN users du ON pr.assigned_driver_id = du.id
         WHERE pr.id = ?`,
        [result.insertId]
      );

      console.log(
        `✅ Admin created pickup request: ID ${result.insertId}, status: ${status}`
      );

      res.status(201).json({
        success: true,
        message: `Pickup request created successfully${
          status === "approved" ? " and approved" : ""
        }`,
        data: createdRequest[0],
      });
    } catch (error) {
      console.error("❌ Error creating admin pickup request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create pickup request",
        error: error.message,
      });
    }
  }
);

// GET /api/pickup-requests/available-drivers - Get members who can be assigned as drivers
router.get(
  "/pickup-requests/available-drivers",
  authenticateToken,
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { user } = req;
      const { area_id } = req.query;

      console.log("Getting available drivers");

      let query = `
        SELECT u.id, u.username, u.full_name, u.phone, u.email, u.mobility,
               a.area_name
        FROM users u
        LEFT JOIN areas a ON u.area_id = a.area_id
        WHERE u.role = 'Member' 
        AND u.status = 'active'
        AND u.mobility IN ('Car', 'Motorbike', 'car', 'motorbike', 'Vehicle')
        AND u.area_id IS NOT NULL
      `;
      const queryParams = [];

      // Filter by area for founders and WCMs
      if (user.role === "Founder" || user.role === "WCM") {
        query += " AND u.area_id = (SELECT area_id FROM users WHERE id = ?)";
        queryParams.push(user.id);
      } else if (area_id) {
        // SuperAdmin can specify area_id
        query += " AND u.area_id = ?";
        queryParams.push(area_id);
      }

      query += " ORDER BY u.full_name, u.username";

      const [drivers] = await pool.execute(query, queryParams);

      console.log(`Found ${drivers.length} available drivers`);

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

// GET /api/pickup-requests/check-user/:userId - Get user's pickup requests with full details (for mobile view)
router.get(
  "/pickup-requests/check-user/:userId",
  authenticateToken,
  authorizeRole(["Founder", "WCM", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { userId } = req.params;

      console.log(`🔍 Getting pickup requests for user ID: ${userId}`);

      const userIdNum = parseInt(userId, 10);

      // Get user's pickup requests with full details (same as /all endpoint)
      console.log(`🔎 Executing SQL query for user_id = ${userIdNum}`);

      const [requests] = await pool.execute(
        `SELECT 
         pr.id,
         pr.user_id,
         pr.area_id,
         pr.pickup_location,
         pr.status,
         pr.contact_number,
         pr.special_instructions,
         pr.days,
         pr.prayers,
         pr.created_at,
         pr.updated_at,
         pr.assigned_driver_id,
         pr.assigned_driver_name,
         pr.approved_at,
         pr.rejected_at,
         a.area_name,
         u.username as member_username,
         u.phone as member_phone,
         u.full_name as member_name,
         u.email as member_email,
         du.username as driver_username,
         du.phone as driver_phone,
         du.full_name as driver_name
         FROM pickup_requests pr
         LEFT JOIN areas a ON pr.area_id = a.area_id
         LEFT JOIN users u ON pr.user_id = u.id
         LEFT JOIN users du ON pr.assigned_driver_id = du.id
         WHERE pr.user_id = ? OR pr.assigned_driver_id = ?
         ORDER BY pr.created_at DESC`,
        [userIdNum, userIdNum]
      );

      console.log(`📊 Raw query returned ${requests.length} rows`);

      // Calculate active requests count
      const activeRequests = requests.filter(
        (req) => req.status === "pending" || req.status === "approved"
      );

      // Determine user's role based on requests
      let userRole = null;
      const hasMemberRequests = requests.some(
        (req) => req.user_id === userIdNum
      );
      const hasDriverRequests = requests.some(
        (req) => req.assigned_driver_id === userIdNum
      );

      if (hasMemberRequests && hasDriverRequests) {
        userRole = "both";
      } else if (hasDriverRequests) {
        userRole = "driver";
      } else if (hasMemberRequests) {
        userRole = "member";
      }

      // Add role indicator for each request
      const requestsWithRole = requests.map((request) => {
        let requestUserRole = null;

        // Only set role if status is approved
        if (request.status === "approved") {
          if (request.user_id === userIdNum) {
            requestUserRole = "member";
          } else if (request.assigned_driver_id === userIdNum) {
            requestUserRole = "driver";
          }
        }

        return {
          ...request,
          user_role: requestUserRole,
        };
      });

      const response = {
        success: true,
        user_role: userRole,
        userId: userIdNum,
        pickupRequests: requestsWithRole,
      };

      res.json(response);
    } catch (error) {
      console.error("❌ Error checking user pickup requests:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check user pickup requests",
        error: error.message,
      });
    }
  }
);

module.exports = router;
