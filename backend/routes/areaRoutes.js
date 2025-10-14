const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();



// Helper function to get date strings for queries
const getDateRanges = () => {
  const today = new Date();
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);
  
  return {
    today: today.toISOString().split('T')[0],
    yesterday: yesterday.toISOString().split('T')[0],
    last7Days: last7Days.toISOString().split('T')[0],
    last30Days: last30Days.toISOString().split('T')[0]
  };
};

// Helper function to safely calculate percentage
const safePercentage = (count, total) => {
  if (total === 0) return 0;
  return Math.min(Math.round((count / total) * 100), 100);
};

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


// GET /api/areas - Get all areas (no authentication required for members to see areas)
router.get("/areas", async (req, res) => {
  try {
    console.log("📋 Fetching areas for dropdown");

    const [areas] = await pool.execute(
      "SELECT * FROM areas ORDER BY area_name ASC"
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

// GET /api/areas/subareas - Get all sub-areas for a specific area (all authenticated users, area_id in query)
router.get("/areas/subareas", authenticateToken, async (req, res) => {
  try {
    const { area_id } = req.query;

    console.log(`📋 Fetching sub-areas for area ID: ${area_id}`);

    // Validation
    if (!area_id) {
      return res.status(400).json({
        success: false,
        message: "Area ID is required as query parameter",
      });
    }

    // Check if area exists
    const [areaExists] = await pool.execute(
      "SELECT area_id, area_name FROM areas WHERE area_id = ?",
      [area_id]
    );

    if (areaExists.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }

    // Get all sub-areas for this area
    const [subAreas] = await pool.execute(
      "SELECT * FROM sub_areas WHERE area_id = ? ORDER BY created_at ASC",
      [area_id]
    );

    console.log(`✅ Found ${subAreas.length} sub-areas for area: ${areaExists[0].area_name}`);

    res.json({
      success: true,
      data: {
        area: areaExists[0],
        subAreas: subAreas,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching sub-areas:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sub-areas",
      error: error.message,
    });
  }
});

// POST /api/areas/subareas - Create new sub-area (SuperAdmin only, area_id in body)
router.post(
  "/areas/subareas",
  authenticateToken,
  authorizeRole(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { area_id, address } = req.body;

      console.log(`➕ Creating new sub-area for area ID: ${area_id}`, {
        address,
      });

      // Validation
      if (!area_id) {
        return res.status(400).json({
          success: false,
          message: "Area ID is required",
        });
      }

      if (!address || !address.trim()) {
        return res.status(400).json({
          success: false,
          message: "Address is required",
        });
      }

      // Check if area exists
      const [areaExists] = await pool.execute(
        "SELECT area_id, area_name FROM areas WHERE area_id = ?",
        [area_id]
      );

      if (areaExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Area not found",
        });
      }

      // Check if sub-area with same address already exists in this area
      const [existing] = await pool.execute(
        "SELECT id FROM sub_areas WHERE area_id = ? AND address = ?",
        [area_id, address.trim()]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Sub-area with this address already exists in this area",
        });
      }

      // Insert new sub-area
      const [result] = await pool.execute(
        "INSERT INTO sub_areas (area_id, address, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
        [area_id, address.trim()]
      );

      // Fetch the created sub-area
      const [newSubArea] = await pool.execute(
        "SELECT * FROM sub_areas WHERE id = ?",
        [result.insertId]
      );

      console.log(`✅ Sub-area created successfully with ID: ${result.insertId} for area: ${areaExists[0].area_name}`);

      res.status(201).json({
        success: true,
        message: "Sub-area created successfully",
        data: {
          area: areaExists[0],
          subArea: newSubArea[0],
        },
      });
    } catch (error) {
      console.error("❌ Error creating sub-area:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create sub-area",
        error: error.message,
      });
    }
  }
);

// PUT /api/areas/subareas - Update existing sub-area (SuperAdmin only, area_id and subarea_id in body)
router.put(
  "/areas/subareas",
  authenticateToken,
  authorizeRole(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { area_id, subarea_id, address } = req.body;

      console.log(`✏️ Updating sub-area ID: ${subarea_id} in area ID: ${area_id}`, {
        address,
      });

      // Validation
      if (!area_id) {
        return res.status(400).json({
          success: false,
          message: "Area ID is required",
        });
      }

      if (!subarea_id) {
        return res.status(400).json({
          success: false,
          message: "Sub-area ID is required",
        });
      }

      if (!address || !address.trim()) {
        return res.status(400).json({
          success: false,
          message: "Address is required",
        });
      }

      // Check if area exists
      const [areaExists] = await pool.execute(
        "SELECT area_id, area_name FROM areas WHERE area_id = ?",
        [area_id]
      );

      if (areaExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Area not found",
        });
      }

      // Check if sub-area exists and belongs to the specified area
      const [existing] = await pool.execute(
        "SELECT id FROM sub_areas WHERE id = ? AND area_id = ?",
        [subarea_id, area_id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Sub-area not found in this area",
        });
      }

      // Check if another sub-area with same address already exists in this area (excluding current sub-area)
      const [duplicateCheck] = await pool.execute(
        "SELECT id FROM sub_areas WHERE area_id = ? AND address = ? AND id != ?",
        [area_id, address.trim(), subarea_id]
      );

      if (duplicateCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Sub-area with this address already exists in this area",
        });
      }

      // Update sub-area
      await pool.execute(
        "UPDATE sub_areas SET address = ?, updated_at = NOW() WHERE id = ? AND area_id = ?",
        [address.trim(), subarea_id, area_id]
      );

      // Fetch the updated sub-area
      const [updatedSubArea] = await pool.execute(
        "SELECT * FROM sub_areas WHERE id = ?",
        [subarea_id]
      );

      console.log(`✅ Sub-area updated successfully: ID ${subarea_id} in area: ${areaExists[0].area_name}`);

      res.json({
        success: true,
        message: "Sub-area updated successfully",
        data: {
          area: areaExists[0],
          subArea: updatedSubArea[0],
        },
      });
    } catch (error) {
      console.error("❌ Error updating sub-area:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update sub-area",
        error: error.message,
      });
    }
  }
);

// DELETE /api/areas/subareas - Delete sub-area (SuperAdmin only, area_id and subarea_id in body)
router.delete(
  "/areas/subareas",
  authenticateToken,
  authorizeRole(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { area_id, subarea_id } = req.body;

      console.log(`🗑️ Deleting sub-area ID: ${subarea_id} from area ID: ${area_id}`);

      // Validation
      if (!area_id) {
        return res.status(400).json({
          success: false,
          message: "Area ID is required",
        });
      }

      if (!subarea_id) {
        return res.status(400).json({
          success: false,
          message: "Sub-area ID is required",
        });
      }

      // Check if area exists
      const [areaExists] = await pool.execute(
        "SELECT area_id, area_name FROM areas WHERE area_id = ?",
        [area_id]
      );

      if (areaExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Area not found",
        });
      }

      // Check if sub-area exists and belongs to the specified area
      const [existing] = await pool.execute(
        "SELECT id, address FROM sub_areas WHERE id = ? AND area_id = ?",
        [subarea_id, area_id]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Sub-area not found in this area",
        });
      }

      // Delete the sub-area
      await pool.execute("DELETE FROM sub_areas WHERE id = ? AND area_id = ?", [subarea_id, area_id]);

      console.log(
        `✅ Sub-area deleted successfully: ID ${subarea_id} (${existing[0].address}) from area: ${areaExists[0].area_name}`
      );

      res.json({
        success: true,
        message: "Sub-area deleted successfully",
        data: { 
          area: areaExists[0],
          deletedSubArea: {
            id: parseInt(subarea_id),
            address: existing[0].address
          }
        },
      });
    } catch (error) {
      console.error("❌ Error deleting sub-area:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete sub-area",
        error: error.message,
      });
    }
  }
);

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
        "SELECT COUNT(*) as count FROM users WHERE area_id = ?",
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
    console.log(`🌍 Fetching global stats for all areas`);

    const dates = getDateRanges();
    
    // Get total members across all areas (only Members role)
    const [totalMembersResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM users WHERE role = 'Member' AND status = 'active'"
    );
    const totalMembers = totalMembersResult[0].total;

    console.log(`👥 Total active members globally: ${totalMembers}`);

    // Single optimized query for all time periods
    const [prayerStats] = await pool.execute(`
      SELECT 
        -- Today's prayers
        SUM(CASE WHEN p.prayer_date = ? THEN p.fajr ELSE 0 END) as today_fajr,
        SUM(CASE WHEN p.prayer_date = ? THEN p.dhuhr ELSE 0 END) as today_dhuhr,
        SUM(CASE WHEN p.prayer_date = ? THEN p.asr ELSE 0 END) as today_asr,
        SUM(CASE WHEN p.prayer_date = ? THEN p.maghrib ELSE 0 END) as today_maghrib,
        SUM(CASE WHEN p.prayer_date = ? THEN p.isha ELSE 0 END) as today_isha,
        
        -- Last 7 days prayers
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.fajr ELSE 0 END) as week_fajr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.dhuhr ELSE 0 END) as week_dhuhr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.asr ELSE 0 END) as week_asr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.maghrib ELSE 0 END) as week_maghrib,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.isha ELSE 0 END) as week_isha,
        
        -- Last 30 days prayers
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.fajr ELSE 0 END) as month_fajr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.dhuhr ELSE 0 END) as month_dhuhr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.asr ELSE 0 END) as month_asr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.maghrib ELSE 0 END) as month_maghrib,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.isha ELSE 0 END) as month_isha
        
      FROM prayers p
      INNER JOIN users u ON p.user_id = u.id
      WHERE u.role = 'Member' AND u.status = 'active'
    `, [
      // Today (5 params)
      dates.today, dates.today, dates.today, dates.today, dates.today,
      // Week (10 params)
      dates.last7Days, dates.today,
      dates.last7Days, dates.today,
      dates.last7Days, dates.today,
      dates.last7Days, dates.today,
      dates.last7Days, dates.today,
      // Month (10 params)
      dates.last30Days, dates.today,
      dates.last30Days, dates.today,
      dates.last30Days, dates.today,
      dates.last30Days, dates.today,
      dates.last30Days, dates.today
    ]);

    const stats = prayerStats[0];

    // Calculate today's statistics
    const todayTotalPrayers = (stats.today_fajr || 0) + (stats.today_dhuhr || 0) + 
                              (stats.today_asr || 0) + (stats.today_maghrib || 0) + 
                              (stats.today_isha || 0);
    const todayMaxPossible = totalMembers * 5;

    const prayerBreakdown = {
      fajr: {
        count: stats.today_fajr || 0,
        percentage: safePercentage(stats.today_fajr || 0, totalMembers)
      },
      dhuhr: {
        count: stats.today_dhuhr || 0,
        percentage: safePercentage(stats.today_dhuhr || 0, totalMembers)
      },
      asr: {
        count: stats.today_asr || 0,
        percentage: safePercentage(stats.today_asr || 0, totalMembers)
      },
      maghrib: {
        count: stats.today_maghrib || 0,
        percentage: safePercentage(stats.today_maghrib || 0, totalMembers)
      },
      isha: {
        count: stats.today_isha || 0,
        percentage: safePercentage(stats.today_isha || 0, totalMembers)
      }
    };

    // Calculate weekly statistics (7 days)
    const weeklyTotalPrayers = (stats.week_fajr || 0) + (stats.week_dhuhr || 0) + 
                               (stats.week_asr || 0) + (stats.week_maghrib || 0) + 
                               (stats.week_isha || 0);
    const weeklyMaxPossible = totalMembers * 5 * 7;

    const weekly = {
      totals: {
        fajr: stats.week_fajr || 0,
        dhuhr: stats.week_dhuhr || 0,
        asr: stats.week_asr || 0,
        maghrib: stats.week_maghrib || 0,
        isha: stats.week_isha || 0,
      },
      percentages: {
        fajr: safePercentage(stats.week_fajr || 0, totalMembers * 7),
        dhuhr: safePercentage(stats.week_dhuhr || 0, totalMembers * 7),
        asr: safePercentage(stats.week_asr || 0, totalMembers * 7),
        maghrib: safePercentage(stats.week_maghrib || 0, totalMembers * 7),
        isha: safePercentage(stats.week_isha || 0, totalMembers * 7),
      },
      total: weeklyTotalPrayers,
      percentage: safePercentage(weeklyTotalPrayers, weeklyMaxPossible)
    };

    // Calculate monthly statistics (30 days)
    const monthlyTotalPrayers = (stats.month_fajr || 0) + (stats.month_dhuhr || 0) + 
                                (stats.month_asr || 0) + (stats.month_maghrib || 0) + 
                                (stats.month_isha || 0);
    const monthlyMaxPossible = totalMembers * 5 * 30;

    const monthly = {
      totals: {
        fajr: stats.month_fajr || 0,
        dhuhr: stats.month_dhuhr || 0,
        asr: stats.month_asr || 0,
        maghrib: stats.month_maghrib || 0,
        isha: stats.month_isha || 0,
      },
      percentages: {
        fajr: safePercentage(stats.month_fajr || 0, totalMembers * 30),
        dhuhr: safePercentage(stats.month_dhuhr || 0, totalMembers * 30),
        asr: safePercentage(stats.month_asr || 0, totalMembers * 30),
        maghrib: safePercentage(stats.month_maghrib || 0, totalMembers * 30),
        isha: safePercentage(stats.month_isha || 0, totalMembers * 30),
      },
      total: monthlyTotalPrayers,
      percentage: safePercentage(monthlyTotalPrayers, monthlyMaxPossible)
    };

    const responseData = {
      global: {
        totalMembers: totalMembers,
        totalAreas: await getTotalAreas()
      },
      today: {
        total: todayTotalPrayers,
        percentage: safePercentage(todayTotalPrayers, todayMaxPossible),
        prayerBreakdown: prayerBreakdown
      },
      weekly,
      monthly
    };

    console.log(`✅ Global stats fetched successfully`);
    console.log(`📊 Today: ${todayTotalPrayers}/${todayMaxPossible} (${responseData.today.percentage}%)`);
    console.log(`📊 Week: ${weeklyTotalPrayers}/${weeklyMaxPossible} (${weekly.percentage}%)`);
    console.log(`📊 Month: ${monthlyTotalPrayers}/${monthlyMaxPossible} (${monthly.percentage}%)`);

    res.json({
      success: true,
      data: responseData,
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

// GET /api/areas/:id/stats - Get area statistics (attendance, members, etc.)
router.get("/areas/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`📊 Fetching area stats for area ID: ${id}`);

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

    const dates = getDateRanges();
    console.log(`📅 Date ranges - Today: ${dates.today}, Last 7: ${dates.last7Days}, Last 30: ${dates.last30Days}`);
    
    // Get total members in this area (only Members role)
    const [totalMembersResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM users WHERE area_id = ? AND role = 'Member' AND status = 'active'",
      [id]
    );
    const totalMembers = totalMembersResult[0].total;
    console.log(`👥 Total active members in area ${id}: ${totalMembers}`);

    // Single optimized query for all time periods
    const [prayerStats] = await pool.execute(`
      SELECT 
        -- Today's prayers
        SUM(CASE WHEN p.prayer_date = ? THEN p.fajr ELSE 0 END) as today_fajr,
        SUM(CASE WHEN p.prayer_date = ? THEN p.dhuhr ELSE 0 END) as today_dhuhr,
        SUM(CASE WHEN p.prayer_date = ? THEN p.asr ELSE 0 END) as today_asr,
        SUM(CASE WHEN p.prayer_date = ? THEN p.maghrib ELSE 0 END) as today_maghrib,
        SUM(CASE WHEN p.prayer_date = ? THEN p.isha ELSE 0 END) as today_isha,
        
        -- Last 7 days prayers
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.fajr ELSE 0 END) as week_fajr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.dhuhr ELSE 0 END) as week_dhuhr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.asr ELSE 0 END) as week_asr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.maghrib ELSE 0 END) as week_maghrib,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.isha ELSE 0 END) as week_isha,
        
        -- Last 30 days prayers
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.fajr ELSE 0 END) as month_fajr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.dhuhr ELSE 0 END) as month_dhuhr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.asr ELSE 0 END) as month_asr,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.maghrib ELSE 0 END) as month_maghrib,
        SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date <= ? THEN p.isha ELSE 0 END) as month_isha
        
      FROM prayers p
      INNER JOIN users u ON p.user_id = u.id
      WHERE u.area_id = ? AND u.role = 'Member' AND u.status = 'active'
    `, [
      // Today (5 params)
      dates.today, dates.today, dates.today, dates.today, dates.today,
      // Week (10 params)
      dates.last7Days, dates.today,
      dates.last7Days, dates.today,
      dates.last7Days, dates.today,
      dates.last7Days, dates.today,
      dates.last7Days, dates.today,
      // Month (10 params)
      dates.last30Days, dates.today,
      dates.last30Days, dates.today,
      dates.last30Days, dates.today,
      dates.last30Days, dates.today,
      dates.last30Days, dates.today,
      // Area filter
      id
    ]);

    const stats = prayerStats[0];

    // Calculate today's statistics
    const todayTotalPrayers = (stats.today_fajr || 0) + (stats.today_dhuhr || 0) + 
                              (stats.today_asr || 0) + (stats.today_maghrib || 0) + 
                              (stats.today_isha || 0);
    const todayMaxPossible = totalMembers * 5;

    const prayerBreakdown = {
      fajr: {
        count: stats.today_fajr || 0,
        percentage: safePercentage(stats.today_fajr || 0, totalMembers)
      },
      dhuhr: {
        count: stats.today_dhuhr || 0,
        percentage: safePercentage(stats.today_dhuhr || 0, totalMembers)
      },
      asr: {
        count: stats.today_asr || 0,
        percentage: safePercentage(stats.today_asr || 0, totalMembers)
      },
      maghrib: {
        count: stats.today_maghrib || 0,
        percentage: safePercentage(stats.today_maghrib || 0, totalMembers)
      },
      isha: {
        count: stats.today_isha || 0,
        percentage: safePercentage(stats.today_isha || 0, totalMembers)
      }
    };

    // Calculate weekly statistics (7 days)
    const weeklyTotalPrayers = (stats.week_fajr || 0) + (stats.week_dhuhr || 0) + 
                               (stats.week_asr || 0) + (stats.week_maghrib || 0) + 
                               (stats.week_isha || 0);
    const weeklyMaxPossible = totalMembers * 5 * 7;

    const weekly = {
      totals: {
        fajr: stats.week_fajr || 0,
        dhuhr: stats.week_dhuhr || 0,
        asr: stats.week_asr || 0,
        maghrib: stats.week_maghrib || 0,
        isha: stats.week_isha || 0,
      },
      percentages: {
        fajr: safePercentage(stats.week_fajr || 0, totalMembers * 7),
        dhuhr: safePercentage(stats.week_dhuhr || 0, totalMembers * 7),
        asr: safePercentage(stats.week_asr || 0, totalMembers * 7),
        maghrib: safePercentage(stats.week_maghrib || 0, totalMembers * 7),
        isha: safePercentage(stats.week_isha || 0, totalMembers * 7),
      },
      total: weeklyTotalPrayers,
      percentage: safePercentage(weeklyTotalPrayers, weeklyMaxPossible)
    };

    // Calculate monthly statistics (30 days)
    const monthlyTotalPrayers = (stats.month_fajr || 0) + (stats.month_dhuhr || 0) + 
                                (stats.month_asr || 0) + (stats.month_maghrib || 0) + 
                                (stats.month_isha || 0);
    const monthlyMaxPossible = totalMembers * 5 * 30;

    const monthly = {
      totals: {
        fajr: stats.month_fajr || 0,
        dhuhr: stats.month_dhuhr || 0,
        asr: stats.month_asr || 0,
        maghrib: stats.month_maghrib || 0,
        isha: stats.month_isha || 0,
      },
      percentages: {
        fajr: safePercentage(stats.month_fajr || 0, totalMembers * 30),
        dhuhr: safePercentage(stats.month_dhuhr || 0, totalMembers * 30),
        asr: safePercentage(stats.month_asr || 0, totalMembers * 30),
        maghrib: safePercentage(stats.month_maghrib || 0, totalMembers * 30),
        isha: safePercentage(stats.month_isha || 0, totalMembers * 30),
      },
      total: monthlyTotalPrayers,
      percentage: safePercentage(monthlyTotalPrayers, monthlyMaxPossible)
    };

    const responseData = {
      area: {
        id: parseInt(id, 10),
        name: areaExists[0].area_name,
        totalMembers
      },
      today: {
        total: todayTotalPrayers,
        percentage: safePercentage(todayTotalPrayers, todayMaxPossible),
        prayerBreakdown
      },
      weekly,
      monthly
    };

    console.log(`✅ Area stats fetched for: ${areaExists[0].area_name}`);
    console.log(`📊 Today: ${todayTotalPrayers}/${todayMaxPossible} (${responseData.today.percentage}%)`);
    console.log(`📊 Week: ${weeklyTotalPrayers}/${weeklyMaxPossible} (${weekly.percentage}%)`);
    console.log(`📊 Month: ${monthlyTotalPrayers}/${monthlyMaxPossible} (${monthly.percentage}%)`);

    res.json({
      success: true,
      data: responseData,
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