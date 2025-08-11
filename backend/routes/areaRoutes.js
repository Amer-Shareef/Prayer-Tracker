const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// TEST ROUTE - GET /api/areas/test - Get all areas without authentication (for testing)
router.get("/areas/test", async (req, res) => {
  try {
    console.log("🧪 TEST: Fetching areas without authentication");

    const [areas] = await pool.execute(
      "SELECT area_id, area_name, address, coordinates, description FROM areas ORDER BY area_name ASC"
    );

    console.log(`✅ TEST: Found ${areas.length} areas`);

    res.json({
      success: true,
      message: "Test endpoint - areas fetched successfully",
      data: areas,
      total: areas.length,
    });
  } catch (error) {
    console.error("❌ TEST: Error fetching areas:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch areas",
      error: error.message,
    });
  }
});

// GET /api/areas - Get all areas (for dropdown in member creation)
router.get("/areas", authenticateToken, async (req, res) => {
  try {
    console.log("📋 Fetching areas for dropdown");

    const [areas] = await pool.execute(
      "SELECT area_id, area_name, address, coordinates, description FROM areas ORDER BY area_name ASC"
    );

    console.log(`✅ Found ${areas.length} active areas`);

    res.json({
      success: true,
      data: areas,
    });
  } catch (error) {
    console.error("❌ Error fetching areas:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch areas",
      error: error.message,
    });
  }
});

// POST /api/areas - Create new area (SuperAdmin only)
router.post(
  "/areas",
  authenticateToken,
  authorizeRole(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { area_name, address, coordinates, description } = req.body;

      console.log("➕ Creating new area:", {
        area_name,
        address,
        coordinates,
        description,
      });

      // Validation
      if (!area_name) {
        return res.status(400).json({
          success: false,
          message: "Area name is required",
        });
      }

      if (!address) {
        return res.status(400).json({
          success: false,
          message: "Address is required",
        });
      }

      // Check if area with same name already exists
      const [existing] = await pool.execute(
        "SELECT area_id FROM areas WHERE area_name = ?",
        [area_name]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Area with this name already exists",
        });
      }

      // Insert new area
      const [result] = await pool.execute(
        "INSERT INTO areas (area_name, address, coordinates, description) VALUES (?, ?, ?, ?)",
        [area_name, address, coordinates || null, description || null]
      );

      // Fetch the created area
      const [newArea] = await pool.execute(
        "SELECT area_id, area_name, address, coordinates, description FROM areas WHERE area_id = ?",
        [result.insertId]
      );

      console.log(`✅ Area created successfully with ID: ${result.insertId}`);

      res.status(201).json({
        success: true,
        message: "Area created successfully",
        data: newArea[0],
      });
    } catch (error) {
      console.error("❌ Error creating area:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create area",
        error: error.message,
      });
    }
  }
);

// PUT /api/areas/:id - Update existing area (SuperAdmin only)
router.put(
  "/areas/:id",
  authenticateToken,
  authorizeRole(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { area_name, address, coordinates, description } = req.body;

      console.log(`✏️ Updating area ID: ${id}`, {
        area_name,
        address,
        coordinates,
        description,
      });

      // Validation
      if (!area_name) {
        return res.status(400).json({
          success: false,
          message: "Area name is required",
        });
      }

      if (!address) {
        return res.status(400).json({
          success: false,
          message: "Address is required",
        });
      }

      // Check if area exists
      const [existing] = await pool.execute(
        "SELECT area_id FROM areas WHERE area_id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Area not found",
        });
      }

      // Check if another area with same name already exists (excluding current area)
      const [duplicateCheck] = await pool.execute(
        "SELECT area_id FROM areas WHERE area_name = ? AND area_id != ?",
        [area_name, id]
      );

      if (duplicateCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Area with this name already exists",
        });
      }

      // Update area
      await pool.execute(
        "UPDATE areas SET area_name = ?, address = ?, coordinates = ?, description = ? WHERE area_id = ?",
        [area_name, address, coordinates || null, description || null, id]
      );

      // Fetch the updated area
      const [updatedArea] = await pool.execute(
        "SELECT area_id, area_name, address, coordinates, description FROM areas WHERE area_id = ?",
        [id]
      );

      console.log(`✅ Area updated successfully: ID ${id}`);

      res.json({
        success: true,
        message: "Area updated successfully",
        data: updatedArea[0],
      });
    } catch (error) {
      console.error("❌ Error updating area:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update area",
        error: error.message,
      });
    }
  }
);

// DELETE /api/areas/:id - Delete area (SuperAdmin only)
router.delete(
  "/areas/:id",
  authenticateToken,
  authorizeRole(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log(`🗑️ Deleting area ID: ${id}`);

      // Check if area exists
      const [existing] = await pool.execute(
        "SELECT area_id, area_name FROM areas WHERE area_id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Area not found",
        });
      }

      // Check if any members are assigned to this area
      const [members] = await pool.execute(
        "SELECT COUNT(*) as count FROM members WHERE area_id = ?",
        [id]
      );

      if (members[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete area. ${members[0].count} member(s) are assigned to this area.`,
        });
      }

      // Delete the area
      await pool.execute("DELETE FROM areas WHERE area_id = ?", [id]);

      console.log(
        `✅ Area deleted successfully: ID ${id} (${
          existing[0].area_name || "N/A"
        })`
      );

      res.json({
        success: true,
        message: "Area deleted successfully",
        data: { area_id: parseInt(id) },
      });
    } catch (error) {
      console.error("❌ Error deleting area:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete area",
        error: error.message,
      });
    }
  }
);

// GET /api/areas/:id/stats - Get area statistics (attendance, members, etc.)
router.get("/areas/:id/stats", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const period = parseInt(req.query.period) || 30;

    console.log(`📊 Fetching area stats for area ID: ${id}, period: ${period} days`);

    // Check if area exists
    const [areaExists] = await pool.execute(
      "SELECT area_id, area_name FROM areas WHERE area_id = ?",
      [id]
    );

    if (areaExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }

    // Get today's date in local timezone
    const today = new Date().toISOString().split('T')[0];
    
    // Get total members in this area
    const [totalMembersResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM users WHERE area_id = ? AND role = 'Member'",
      [id]
    );
    const totalMembers = totalMembersResult[0].total;

    // Get today's prayer attendance
    const [todayAttendance] = await pool.execute(`
      SELECT 
        prayer_type,
        COUNT(*) as count,
        ROUND((COUNT(*) / ?) * 100, 1) as percentage
      FROM prayers 
      WHERE prayer_date = ? 
        AND status = 'prayed' 
        AND user_id IN (SELECT id FROM users WHERE area_id = ? AND role = 'Member')
      GROUP BY prayer_type
    `, [totalMembers, today, id]);

    // Calculate today's overall stats
    const todayTotalPrayers = todayAttendance.reduce((sum, prayer) => sum + prayer.count, 0);
    const todayMaxPossible = totalMembers * 5; // 5 prayers per day
    const todayPercentage = todayMaxPossible > 0 ? Math.round((todayTotalPrayers / todayMaxPossible) * 100) : 0;

    // Get weekly attendance
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const [weeklyAttendance] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM prayers 
      WHERE prayer_date >= ? AND prayer_date <= ?
        AND status = 'prayed' 
        AND user_id IN (SELECT id FROM users WHERE area_id = ? AND role = 'Member')
    `, [weekStartStr, today, id]);

    const weeklyTotal = weeklyAttendance[0].total;
    const weeklyMaxPossible = totalMembers * 5 * 7; // 5 prayers * 7 days
    const weeklyPercentage = weeklyMaxPossible > 0 ? Math.round((weeklyTotal / weeklyMaxPossible) * 100) : 0;

    // Get monthly attendance
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - period);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const [monthlyAttendance] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM prayers 
      WHERE prayer_date >= ? AND prayer_date <= ?
        AND status = 'prayed' 
        AND user_id IN (SELECT id FROM users WHERE area_id = ? AND role = 'Member')
    `, [monthStartStr, today, id]);

    const monthlyTotal = monthlyAttendance[0].total;
    const monthlyMaxPossible = totalMembers * 5 * period; // 5 prayers * period days
    const monthlyPercentage = monthlyMaxPossible > 0 ? Math.round((monthlyTotal / monthlyMaxPossible) * 100) : 0;

    // Build prayer breakdown for today
    const prayerBreakdown = {
      fajr: { count: 0, percentage: 0 },
      dhuhr: { count: 0, percentage: 0 },
      asr: { count: 0, percentage: 0 },
      maghrib: { count: 0, percentage: 0 },
      isha: { count: 0, percentage: 0 }
    };

    todayAttendance.forEach(prayer => {
      const prayerType = prayer.prayer_type.toLowerCase();
      if (prayerBreakdown[prayerType]) {
        prayerBreakdown[prayerType] = {
          count: prayer.count,
          percentage: Math.round(prayer.percentage)
        };
      }
    });

    const stats = {
      area: {
        id: parseInt(id),
        name: areaExists[0].area_name,
        totalMembers: totalMembers
      },
      today: {
        total: todayTotalPrayers,
        percentage: todayPercentage,
        prayerBreakdown: prayerBreakdown
      },
      weekly: {
        total: weeklyTotal,
        percentage: weeklyPercentage
      },
      monthly: {
        total: monthlyTotal,
        percentage: monthlyPercentage
      }
    };

    console.log(`✅ Area stats fetched successfully for area: ${areaExists[0].area_name}`);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error fetching area stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch area statistics",
      error: error.message,
    });
  }
});

module.exports = router;
