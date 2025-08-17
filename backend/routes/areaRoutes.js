const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/areas - Get all areas (no authentication required for members to see areas)
router.get("/areas", async (req, res) => {
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

// GET /api/areas/global/stats - Get global statistics for SuperAdmin (all areas combined)
router.get("/areas/global/stats", async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 31; // Default to 31 days (30 + today)

    console.log(`🌍 Fetching global stats for all areas, period: ${period} days`);

    // Get today's date in local timezone
    const today = new Date().toISOString().split('T')[0];
    
    // Get total members across all areas
    const [totalMembersResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM users WHERE role = 'Member'"
    );
    const totalMembers = totalMembersResult[0].total;

    // Get today's prayer counts for all areas
    const [todayPrayerCounts] = await pool.execute(`
      SELECT 
        SUM(COALESCE(p.fajr, 0)) AS total_fajr,
        SUM(COALESCE(p.dhuhr, 0)) AS total_dhuhr,
        SUM(COALESCE(p.asr, 0)) AS total_asr,
        SUM(COALESCE(p.maghrib, 0)) AS total_maghrib,
        SUM(COALESCE(p.isha, 0)) AS total_isha
      FROM prayers p
      JOIN users u ON p.user_id = u.id
      WHERE p.prayer_date = ?
    `, [today]);

    const todayStats = todayPrayerCounts[0] || {
      total_fajr: 0, total_dhuhr: 0, total_asr: 0, total_maghrib: 0, total_isha: 0
    };

    // Calculate today's prayer breakdown with percentages
    const prayerBreakdown = {
      fajr: { 
        count: todayStats.total_fajr, 
        percentage: totalMembers > 0 ? Math.round((todayStats.total_fajr / totalMembers) * 100) : 0 
      },
      dhuhr: { 
        count: todayStats.total_dhuhr, 
        percentage: totalMembers > 0 ? Math.round((todayStats.total_dhuhr / totalMembers) * 100) : 0 
      },
      asr: { 
        count: todayStats.total_asr, 
        percentage: totalMembers > 0 ? Math.round((todayStats.total_asr / totalMembers) * 100) : 0 
      },
      maghrib: { 
        count: todayStats.total_maghrib, 
        percentage: totalMembers > 0 ? Math.round((todayStats.total_maghrib / totalMembers) * 100) : 0 
      },
      isha: { 
        count: todayStats.total_isha, 
        percentage: totalMembers > 0 ? Math.round((todayStats.total_isha / totalMembers) * 100) : 0 
      }
    };

    // Calculate today's overall stats
    const todayTotalPrayers = todayStats.total_fajr + todayStats.total_dhuhr + todayStats.total_asr + todayStats.total_maghrib + todayStats.total_isha;
    const todayMaxPossible = totalMembers * 5; // 5 prayers per day
    const todayPercentage = todayMaxPossible > 0 ? Math.round((todayTotalPrayers / todayMaxPossible) * 100) : 0;

    // --- Period helpers ---
    const periodStart = (days) => {
      const d = new Date(); 
      d.setDate(d.getDate() - days); 
      return d.toISOString().split("T")[0];
    };

    // Get weekly attendance (last 7 days) - global
    const weekStartStr = periodStart(6); // 7 days including today = go back 6 days

    // weekly totals, global
    const [weeklyTotalsRows] = await pool.execute(`
      SELECT 
        SUM(COALESCE(p.fajr, 0))    AS total_fajr,
        SUM(COALESCE(p.dhuhr, 0))   AS total_dhuhr,
        SUM(COALESCE(p.asr, 0))     AS total_asr,
        SUM(COALESCE(p.maghrib, 0)) AS total_maghrib,
        SUM(COALESCE(p.isha, 0))    AS total_isha
      FROM prayers p
      JOIN users u ON p.user_id = u.id
      WHERE p.prayer_date BETWEEN ? AND ?
    `, [weekStartStr, today]);

    const weeklyTotals = weeklyTotalsRows[0] || {};
    const weeklyTotalPrayers = (weeklyTotals.total_fajr || 0) + (weeklyTotals.total_dhuhr || 0) + (weeklyTotals.total_asr || 0) + (weeklyTotals.total_maghrib || 0) + (weeklyTotals.total_isha || 0);
    const weeklyMaxPossible = totalMembers * 5 * 7; // 5 prayers × 7 days
    const weeklyPercentage = weeklyMaxPossible > 0 ? Math.round((weeklyTotalPrayers / weeklyMaxPossible) * 100) : 0;

    const weekly = {
      totals: {
        fajr: weeklyTotals.total_fajr || 0,
        dhuhr: weeklyTotals.total_dhuhr || 0,
        asr: weeklyTotals.total_asr || 0,
        maghrib: weeklyTotals.total_maghrib || 0,
        isha: weeklyTotals.total_isha || 0,
      },
      percentages: {
        fajr:     totalMembers > 0 ? Math.round(((weeklyTotals.total_fajr || 0) / (totalMembers * 7)) * 100) : 0,
        dhuhr:    totalMembers > 0 ? Math.round(((weeklyTotals.total_dhuhr || 0) / (totalMembers * 7)) * 100) : 0,
        asr:      totalMembers > 0 ? Math.round(((weeklyTotals.total_asr || 0) / (totalMembers * 7)) * 100) : 0,
        maghrib:  totalMembers > 0 ? Math.round(((weeklyTotals.total_maghrib || 0) / (totalMembers * 7)) * 100) : 0,
        isha:     totalMembers > 0 ? Math.round(((weeklyTotals.total_isha || 0) / (totalMembers * 7)) * 100) : 0,
      },
      // Overall weekly stats for frontend compatibility
      total: weeklyTotalPrayers,
      percentage: weeklyPercentage
    };

    // Get monthly attendance (last 30 days + today = 31 days) - global
    const monthStartStr = periodStart(30); // 31 days including today = go back 30 days

    // monthly totals, global
    const [monthlyTotalsRows] = await pool.execute(`
      SELECT 
        SUM(COALESCE(p.fajr, 0))    AS total_fajr,
        SUM(COALESCE(p.dhuhr, 0))   AS total_dhuhr,
        SUM(COALESCE(p.asr, 0))     AS total_asr,
        SUM(COALESCE(p.maghrib, 0)) AS total_maghrib,
        SUM(COALESCE(p.isha, 0))    AS total_isha
      FROM prayers p
      JOIN users u ON p.user_id = u.id
      WHERE p.prayer_date BETWEEN ? AND ?
    `, [monthStartStr, today]);

    const monthlyTotals = monthlyTotalsRows[0] || {};
    const monthlyTotalPrayers = (monthlyTotals.total_fajr || 0) + (monthlyTotals.total_dhuhr || 0) + (monthlyTotals.total_asr || 0) + (monthlyTotals.total_maghrib || 0) + (monthlyTotals.total_isha || 0);
    const monthlyMaxPossible = totalMembers * 5 * 31; // 5 prayers × 31 days
    const monthlyPercentage = monthlyMaxPossible > 0 ? Math.round((monthlyTotalPrayers / monthlyMaxPossible) * 100) : 0;

    const monthly = {
      totals: {
        fajr: monthlyTotals.total_fajr || 0,
        dhuhr: monthlyTotals.total_dhuhr || 0,
        asr: monthlyTotals.total_asr || 0,
        maghrib: monthlyTotals.total_maghrib || 0,
        isha: monthlyTotals.total_isha || 0,
      },
      percentages: {
        fajr:     totalMembers > 0 ? Math.round(((monthlyTotals.total_fajr || 0) / (totalMembers * 31)) * 100) : 0,
        dhuhr:    totalMembers > 0 ? Math.round(((monthlyTotals.total_dhuhr || 0) / (totalMembers * 31)) * 100) : 0,
        asr:      totalMembers > 0 ? Math.round(((monthlyTotals.total_asr || 0) / (totalMembers * 31)) * 100) : 0,
        maghrib:  totalMembers > 0 ? Math.round(((monthlyTotals.total_maghrib || 0) / (totalMembers * 31)) * 100) : 0,
        isha:     totalMembers > 0 ? Math.round(((monthlyTotals.total_isha || 0) / (totalMembers * 31)) * 100) : 0,
      },
      // Overall monthly stats for frontend compatibility
      total: monthlyTotalPrayers,
      percentage: monthlyPercentage
    };

    const stats = {
      global: {
        totalMembers: totalMembers,
        totalAreas: await getTotalAreas()
      },
      today: {
        total: todayTotalPrayers,
        percentage: todayPercentage,
        prayerBreakdown: prayerBreakdown
      },
      weekly,
      monthly
    };

    console.log(`✅ Global stats fetched successfully`);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error fetching global stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch global statistics",
      error: error.message,
    });
  }
});

// Helper function to get total areas count
async function getTotalAreas() {
  try {
    const [result] = await pool.execute("SELECT COUNT(*) as total FROM areas");
    return result[0].total;
  } catch (error) {
    console.error("Error getting total areas:", error);
    return 0;
  }
}

// GET /api/areas/:id/stats - Get area statistics (attendance, members, etc.)
router.get("/areas/:id/stats",  async (req, res) => {
  try {
    const { id } = req.params;
    const period = parseInt(req.query.period) || 31; // Default to 31 days (30 + today)

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
    console.log(`📅 Today's date: ${today}`);
    
    // Get total members in this area
    const [totalMembersResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM users WHERE area_id = ? AND role = 'Member'",
      [id]
    );
    const totalMembers = totalMembersResult[0].total;
    console.log(`👥 Total members in area ${id}: ${totalMembers}`);

    // Get today's prayer attendance using the new prayer structure
    const [todayPrayerCounts] = await pool.execute(`
      SELECT 
        SUM(p.fajr) AS total_fajr,
        SUM(p.dhuhr) AS total_dhuhr,
        SUM(p.asr) AS total_asr,
        SUM(p.maghrib) AS total_maghrib,
        SUM(p.isha) AS total_isha
      FROM prayers p
      JOIN users u ON p.user_id = u.id
      WHERE u.area_id = ? AND p.prayer_date = ?
    `, [id, today]);

    const todayStats = todayPrayerCounts[0] || {
      total_fajr: 0, total_dhuhr: 0, total_asr: 0, total_maghrib: 0, total_isha: 0
    };
    console.log(`📊 Today's prayer counts:`, todayStats);

    // Cap today's values to prevent astronomical numbers
    const safeFajrT = Math.min(parseInt(todayStats.total_fajr) || 0, totalMembers);
    const safeDhuhrT = Math.min(parseInt(todayStats.total_dhuhr) || 0, totalMembers);
    const safeAsrT = Math.min(parseInt(todayStats.total_asr) || 0, totalMembers);
    const safeMaghribT = Math.min(parseInt(todayStats.total_maghrib) || 0, totalMembers);
    const safeIshaT = Math.min(parseInt(todayStats.total_isha) || 0, totalMembers);

    // Calculate today's overall stats
    const todayTotalPrayers = safeFajrT + safeDhuhrT + safeAsrT + safeMaghribT + safeIshaT;
    const todayMaxPossible = totalMembers * 5; // 5 prayers per day
    const todayPercentage = todayMaxPossible > 0 ? Math.min(Math.round((todayTotalPrayers / todayMaxPossible) * 100), 100) : 0;

    // --- Period helpers ---
    const periodStart = (days) => {
      const d = new Date(); 
      d.setDate(d.getDate() - days); 
      return d.toISOString().split("T")[0];
    };

    // Weekly (7 days) – total attendance instances calculation
    const weekStartStr = periodStart(6); // 7 days including today = go back 6 days

    // totals (raw counts of attended flags over the 7-day period)
    const [weeklyTotalsRows] = await pool.execute(`
      SELECT 
        SUM(COALESCE(p.fajr, 0))    AS total_fajr,
        SUM(COALESCE(p.dhuhr, 0))   AS total_dhuhr,
        SUM(COALESCE(p.asr, 0))     AS total_asr,
        SUM(COALESCE(p.maghrib, 0)) AS total_maghrib,
        SUM(COALESCE(p.isha, 0))    AS total_isha
      FROM prayers p
      JOIN users u ON p.user_id = u.id
      WHERE u.area_id = ? AND p.prayer_date BETWEEN ? AND ?
    `, [id, weekStartStr, today]);

    const weeklyTotals = weeklyTotalsRows[0] || {};
    
    // Validate and cap the numbers - prayer values should be 0 or 1, so cap individual prayers
    const safeFajr = Math.min(parseInt(weeklyTotals.total_fajr) || 0, totalMembers * 7);
    const safeDhuhr = Math.min(parseInt(weeklyTotals.total_dhuhr) || 0, totalMembers * 7);
    const safeAsr = Math.min(parseInt(weeklyTotals.total_asr) || 0, totalMembers * 7);
    const safeMaghrib = Math.min(parseInt(weeklyTotals.total_maghrib) || 0, totalMembers * 7);
    const safeIsha = Math.min(parseInt(weeklyTotals.total_isha) || 0, totalMembers * 7);
    
    const weeklyTotalPrayers = safeFajr + safeDhuhr + safeAsr + safeMaghrib + safeIsha;
    const weeklyMaxPossible = totalMembers * 5 * 7; // 5 prayers × 7 days
    const weeklyPercentage = weeklyMaxPossible > 0 ? Math.min(Math.round((weeklyTotalPrayers / weeklyMaxPossible) * 100), 100) : 0;

    const weekly = {
      totals: {
        fajr: safeFajr,
        dhuhr: safeDhuhr,
        asr: safeAsr,
        maghrib: safeMaghrib,
        isha: safeIsha,
      },
      percentages: {
        fajr:     totalMembers > 0 ? Math.min(Math.round((safeFajr / (totalMembers * 7)) * 100), 100) : 0,
        dhuhr:    totalMembers > 0 ? Math.min(Math.round((safeDhuhr / (totalMembers * 7)) * 100), 100) : 0,
        asr:      totalMembers > 0 ? Math.min(Math.round((safeAsr / (totalMembers * 7)) * 100), 100) : 0,
        maghrib:  totalMembers > 0 ? Math.min(Math.round((safeMaghrib / (totalMembers * 7)) * 100), 100) : 0,
        isha:     totalMembers > 0 ? Math.min(Math.round((safeIsha / (totalMembers * 7)) * 100), 100) : 0,
      },
      // Overall weekly stats for frontend compatibility
      total: weeklyTotalPrayers,
      percentage: weeklyPercentage
    };

    // Monthly (last 30 days + today = 31 days total)
    const monthStartStr = periodStart(30); // 31 days including today = go back 30 days
    console.log(`📅 Monthly date range: ${monthStartStr} to ${today} (31 days total)`);

    const [monthlyTotalsRows] = await pool.execute(`
      SELECT 
        SUM(COALESCE(p.fajr, 0))    AS total_fajr,
        SUM(COALESCE(p.dhuhr, 0))   AS total_dhuhr,
        SUM(COALESCE(p.asr, 0))     AS total_asr,
        SUM(COALESCE(p.maghrib, 0)) AS total_maghrib,
        SUM(COALESCE(p.isha, 0))    AS total_isha
      FROM prayers p
      JOIN users u ON p.user_id = u.id
      WHERE u.area_id = ? AND p.prayer_date BETWEEN ? AND ?
    `, [id, monthStartStr, today]);

    const monthlyTotals = monthlyTotalsRows[0] || {};
    // Cap each prayer count to prevent corrupted data from causing astronomical numbers
    const safeFajrM = Math.min(parseInt(monthlyTotals.total_fajr) || 0, totalMembers * 31);
    const safeDhuhrM = Math.min(parseInt(monthlyTotals.total_dhuhr) || 0, totalMembers * 31);
    const safeAsrM = Math.min(parseInt(monthlyTotals.total_asr) || 0, totalMembers * 31);
    const safeMaghribM = Math.min(parseInt(monthlyTotals.total_maghrib) || 0, totalMembers * 31);
    const safeIshaM = Math.min(parseInt(monthlyTotals.total_isha) || 0, totalMembers * 31);
    
    const monthlyTotalPrayers = safeFajrM + safeDhuhrM + safeAsrM + safeMaghribM + safeIshaM;
    const monthlyMaxPossible = totalMembers * 5 * 31; // 5 prayers × 31 days
    const monthlyPercentage = monthlyMaxPossible > 0 ? Math.min(Math.round((monthlyTotalPrayers / monthlyMaxPossible) * 100), 100) : 0;

    const monthly = {
      totals: {
        fajr: safeFajrM,
        dhuhr: safeDhuhrM,
        asr: safeAsrM,
        maghrib: safeMaghribM,
        isha: safeIshaM,
      },
      percentages: {
        fajr:     totalMembers > 0 ? Math.min(Math.round((safeFajrM / (totalMembers * 31)) * 100), 100) : 0,
        dhuhr:    totalMembers > 0 ? Math.min(Math.round((safeDhuhrM / (totalMembers * 31)) * 100), 100) : 0,
        asr:      totalMembers > 0 ? Math.min(Math.round((safeAsrM / (totalMembers * 31)) * 100), 100) : 0,
        maghrib:  totalMembers > 0 ? Math.min(Math.round((safeMaghribM / (totalMembers * 31)) * 100), 100) : 0,
        isha:     totalMembers > 0 ? Math.min(Math.round((safeIshaM / (totalMembers * 31)) * 100), 100) : 0,
      },
      // Overall monthly stats for frontend compatibility
      total: monthlyTotalPrayers,
      percentage: monthlyPercentage
    };

    console.log(`📊 Monthly calculation: ${monthlyTotalPrayers} total prayers out of ${monthlyMaxPossible} possible (${monthlyPercentage}%)`);
    console.log(`📊 Weekly calculation: ${weeklyTotalPrayers} total prayers out of ${weeklyMaxPossible} possible (${weeklyPercentage}%)`);
    console.log(`📊 Today calculation: ${todayTotalPrayers} total prayers out of ${todayMaxPossible} possible (${todayPercentage}%)`);
    
    // Build prayer breakdown for today with correct counts and percentages
    const prayerBreakdown = {
      fajr: { 
        count: safeFajrT, 
        percentage: totalMembers > 0 ? Math.min(Math.round((safeFajrT / totalMembers) * 100), 100) : 0 
      },
      dhuhr: { 
        count: safeDhuhrT, 
        percentage: totalMembers > 0 ? Math.min(Math.round((safeDhuhrT / totalMembers) * 100), 100) : 0 
      },
      asr: { 
        count: safeAsrT, 
        percentage: totalMembers > 0 ? Math.min(Math.round((safeAsrT / totalMembers) * 100), 100) : 0 
      },
      maghrib: { 
        count: safeMaghribT, 
        percentage: totalMembers > 0 ? Math.min(Math.round((safeMaghribT / totalMembers) * 100), 100) : 0 
      },
      isha: { 
        count: safeIshaT, 
        percentage: totalMembers > 0 ? Math.min(Math.round((safeIshaT / totalMembers) * 100), 100) : 0 
      }
    };

    // include in your response payload:
    const stats = {
      area: { id: parseInt(id, 10), name: areaExists[0].area_name, totalMembers },
      today: { total: todayTotalPrayers, percentage: todayPercentage, prayerBreakdown },
      weekly,
      monthly,
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
