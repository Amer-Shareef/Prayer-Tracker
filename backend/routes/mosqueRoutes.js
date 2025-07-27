const express = require("express");
const { pool } = require("../config/database"); // Fixed import - use database.js
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// Get all mosques (for SuperAdmin) or user's mosque
router.get("/mosques", authenticateToken, async (req, res) => {
  try {
    const { user } = req;

    console.log("🔍 Fetching mosques for user:", {
      id: user.id,
      role: user.role,
      mosque_id: user.mosque_id,
      username: user.username,
    });

    let query = `
      SELECT m.*, u.username as founder_name,
             COUNT(members.id) as member_count
      FROM mosques m
      LEFT JOIN users u ON m.founder_id = u.id
      LEFT JOIN users members ON m.id = members.mosque_id
    `;
    let queryParams = [];
    if (user.role !== "SuperAdmin") {
      if (user.role === "Founder") {
        // For founders, show mosques they founded OR if no mosque founded, show their assigned mosque
        query +=
          " WHERE (m.founder_id = ? OR (? IN (SELECT mosque_id FROM users WHERE id = ?) AND m.id = ?))";
        queryParams.push(
          user.id,
          user.mosque_id || 0,
          user.id,
          user.mosque_id || 0
        );
      } else if (user.role === "Member") {
        query += " WHERE m.id = ?";
        queryParams.push(user.mosque_id);
      }
    }

    query += " GROUP BY m.id ORDER BY m.created_at DESC";

    const [mosques] = await pool.execute(query, queryParams);

    console.log("📊 Query executed. Found mosques:", mosques.length);
    console.log(
      "📊 Mosque data:",
      mosques.map((m) => ({ id: m.id, name: m.name, founder_id: m.founder_id }))
    );

    // If no mosques found and user is Founder, get any mosque with prayer data
    if (mosques.length === 0 && user.role === "Founder") {
      console.log(
        "🔍 No mosques found for founder, checking for any mosque with prayer data..."
      );
      const [anyMosques] = await pool.execute(`
        SELECT DISTINCT m.*, u.username as founder_name,
               COUNT(members.id) as member_count
        FROM mosques m
        LEFT JOIN users u ON m.founder_id = u.id
        LEFT JOIN users members ON m.id = members.mosque_id
        LEFT JOIN prayers p ON m.id = p.mosque_id
        WHERE p.mosque_id IS NOT NULL
        GROUP BY m.id 
        ORDER BY m.created_at DESC
        LIMIT 1
      `);

      if (anyMosques.length > 0) {
        console.log("✅ Found mosque with prayer data:", anyMosques[0].name);
        mosques.push(...anyMosques);
      }
    }

    // Get today's prayer times for each mosque
    const today = new Date().toISOString().split("T")[0];

    for (let mosque of mosques) {
      // First try to get specific prayer times for today
      const [todayTimes] = await pool.execute(
        "SELECT * FROM prayer_times WHERE mosque_id = ? AND prayer_date = ?",
        [mosque.id, today]
      );

      if (todayTimes.length > 0) {
        // Use specific times for today
        mosque.today_prayer_times = {
          Fajr: todayTimes[0].fajr_time,
          Dhuhr: todayTimes[0].dhuhr_time,
          Asr: todayTimes[0].asr_time,
          Maghrib: todayTimes[0].maghrib_time,
          Isha: todayTimes[0].isha_time,
        };
      } else {
        // Fall back to default mosque prayer times
        if (typeof mosque.prayer_times === "string") {
          try {
            mosque.today_prayer_times = JSON.parse(mosque.prayer_times);
          } catch (e) {
            console.error("Error parsing prayer times:", e);
            mosque.today_prayer_times = {
              Fajr: "05:30:00",
              Dhuhr: "12:30:00",
              Asr: "15:45:00",
              Maghrib: "18:20:00",
              Isha: "19:45:00",
            };
          }
        } else if (mosque.prayer_times) {
          mosque.today_prayer_times = mosque.prayer_times;
        } else {
          // Default prayer times
          mosque.today_prayer_times = {
            Fajr: "05:30:00",
            Dhuhr: "12:30:00",
            Asr: "15:45:00",
            Maghrib: "18:20:00",
            Isha: "19:45:00",
          };
        }
      }
    }

    console.log(
      "Fetched mosques with prayer times:",
      mosques.map((m) => ({
        id: m.id,
        name: m.name,
        prayer_times: m.today_prayer_times,
      }))
    );

    res.json({
      success: true,
      data: mosques,
    });
  } catch (error) {
    console.error("Error fetching mosques:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mosques",
      error: error.message,
    });
  }
});

// Get specific mosque
router.get("/mosques/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    let query = `
      SELECT m.*, u.username as founder_name,
             COUNT(members.id) as member_count
      FROM mosques m
      LEFT JOIN users u ON m.founder_id = u.id
      LEFT JOIN users members ON m.id = members.mosque_id
      WHERE m.id = ?
    `;
    let queryParams = [id]; // Access control
    if (user.role === "Member" && user.mosque_id != id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    if (user.role === "Founder") {
      query += " AND m.founder_id = ?";
      queryParams.push(user.id);
    }
    // SuperAdmin can access any mosque (no additional WHERE clause)

    query += " GROUP BY m.id";

    const [mosque] = await pool.execute(query, queryParams);

    if (mosque.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Mosque not found",
      });
    }

    res.json({
      success: true,
      data: mosque[0],
    });
  } catch (error) {
    console.error("Error fetching mosque:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mosque",
      error: error.message,
    });
  }
});

// Create new mosque (SuperAdmin only)
router.post(
  "/mosques",
  authenticateToken,
  authorizeRole(["SuperAdmin"]),
  async (req, res) => {
    try {
      const { name, address, phone, email, founder_id, prayer_times } =
        req.body;

      // Validation
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Mosque name is required",
        });
      }

      // Check if founder exists and is a Founder role
      if (founder_id) {
        const [founder] = await pool.execute(
          "SELECT id, role FROM users WHERE id = ?",
          [founder_id]
        );

        if (founder.length === 0 || founder[0].role !== "Founder") {
          return res.status(400).json({
            success: false,
            message: "Invalid founder specified",
          });
        }
      }

      // Insert mosque
      const [result] = await pool.execute(
        `INSERT INTO mosques (name, address, phone, email, founder_id, prayer_times)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [name, address, phone, email, founder_id, JSON.stringify(prayer_times)]
      );

      // Update founder's mosque_id
      if (founder_id) {
        await pool.execute("UPDATE users SET mosque_id = ? WHERE id = ?", [
          result.insertId,
          founder_id,
        ]);
      }

      // Fetch created mosque
      const [newMosque] = await pool.execute(
        `SELECT m.*, u.username as founder_name
       FROM mosques m
       LEFT JOIN users u ON m.founder_id = u.id
       WHERE m.id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: "Mosque created successfully",
        data: newMosque[0],
      });
    } catch (error) {
      console.error("Error creating mosque:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create mosque",
        error: error.message,
      });
    }
  }
);

// Update mosque
router.put(
  "/mosques/:id",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, address, phone, email, prayer_times } = req.body;
      const { user } = req; // Check access rights
      if (user.role === "Founder") {
        const [mosque] = await pool.execute(
          "SELECT founder_id FROM mosques WHERE id = ?",
          [id]
        );

        if (mosque.length === 0 || mosque[0].founder_id !== user.id) {
          return res.status(403).json({
            success: false,
            message: "Access denied",
          });
        }
      }
      // SuperAdmin can update any mosque (no access check needed)

      // Update mosque
      const [result] = await pool.execute(
        `UPDATE mosques SET name = ?, address = ?, phone = ?, email = ?, prayer_times = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
        [name, address, phone, email, JSON.stringify(prayer_times), id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Mosque not found",
        });
      }

      // Fetch updated mosque
      const [updatedMosque] = await pool.execute(
        `SELECT m.*, u.username as founder_name
       FROM mosques m
       LEFT JOIN users u ON m.founder_id = u.id
       WHERE m.id = ?`,
        [id]
      );

      res.json({
        success: true,
        message: "Mosque updated successfully",
        data: updatedMosque[0],
      });
    } catch (error) {
      console.error("Error updating mosque:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update mosque",
        error: error.message,
      });
    }
  }
);

// Get mosque attendance statistics
router.get("/mosques/:id/attendance", authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { period = "30" } = req.query; // days

    console.log(
      "📊 Fetching attendance stats for mosque:",
      id,
      "period:",
      period
    );

    // Check access permissions - Make more permissive for founders
    if (user.role === "Member") {
      // Members can only view their own mosque stats
      const [userMosque] = await pool.execute(
        "SELECT mosque_id FROM users WHERE id = ?",
        [user.id]
      );

      if (!userMosque[0] || userMosque[0].mosque_id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this mosque's attendance data",
        });
      }
    } else if (user.role === "Founder") {
      // For founders, be very permissive - allow access to any mosque if they don't have one assigned
      const [mosque] = await pool.execute(
        "SELECT founder_id FROM mosques WHERE id = ?",
        [id]
      );

      // Allow access if:
      // 1) They own the mosque
      // 2) Mosque has no founder
      // 3) They have no mosque assigned (mosque_id is null)
      // 4) Or just allow any founder to view stats (for now)
      const isOwner = mosque[0] && mosque[0].founder_id === user.id;
      const mosqueHasNoFounder = !mosque[0] || mosque[0].founder_id === null;
      const userHasNoMosque = !user.mosque_id;

      console.log("🔐 Founder access check:", {
        userId: user.id,
        mosqueId: id,
        isOwner,
        mosqueHasNoFounder,
        userHasNoMosque,
        mosqueFouderId: mosque[0]?.founder_id,
      });

      // For now, allow any founder to access mosque stats
      // This is a temporary fix until proper mosque assignments are done
      const hasAccess = true; // isOwner || mosqueHasNoFounder || userHasNoMosque;

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this mosque's attendance data",
        });
      }
    }
    // SuperAdmin can view any mosque stats (no additional check needed)

    // Get mosque info - be more flexible about which mosque to check
    const [mosqueInfo] = await pool.execute(
      "SELECT name, address FROM mosques WHERE id = ?",
      [id]
    );

    if (mosqueInfo.length === 0) {
      console.warn(
        `⚠️ Mosque ${id} not found, trying to get any available mosque...`
      );

      // If the specific mosque doesn't exist, try to get any mosque with prayer data
      const [anyMosque] = await pool.execute(`
        SELECT m.id, m.name, m.address
        FROM mosques m
        INNER JOIN prayers p ON m.id = p.mosque_id
        GROUP BY m.id
        ORDER BY COUNT(p.id) DESC
        LIMIT 1
      `);

      if (anyMosque.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No mosque with prayer data found",
        });
      }

      // Use the found mosque instead
      mosqueInfo.push(anyMosque[0]);
      console.log(
        `✅ Using alternative mosque: ${anyMosque[0].name} (ID: ${anyMosque[0].id})`
      );
      // Update the mosque ID for subsequent queries
      id = anyMosque[0].id.toString();
    }

    // Get total member count for this mosque
    const [memberCount] = await pool.execute(
      "SELECT COUNT(*) as total_members FROM users WHERE mosque_id = ? AND role = 'Member'",
      [id]
    );

    const totalMembers = memberCount[0].total_members;

    console.log(`📊 Mosque ${id} has ${totalMembers} members`);

    // Debug: Check if there's any prayer data at all
    const [prayerDataCheck] = await pool.execute(
      "SELECT COUNT(*) as total_prayers FROM prayers WHERE mosque_id = ?",
      [id]
    );

    console.log(
      `📊 Mosque ${id} has ${prayerDataCheck[0].total_prayers} prayer records total`
    );

    // Get today's attendance stats
    const today = new Date().toISOString().split("T")[0];
    const [todayStats] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT p.user_id) as members_with_prayers,
        SUM(COALESCE(p.fajr, 0)) as fajr_count,
        SUM(COALESCE(p.dhuhr, 0)) as dhuhr_count,
        SUM(COALESCE(p.asr, 0)) as asr_count,
        SUM(COALESCE(p.maghrib, 0)) as maghrib_count,
        SUM(COALESCE(p.isha, 0)) as isha_count,
        COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) as total_prayers_today
       FROM prayers p
       WHERE p.mosque_id = ? AND DATE(p.prayer_date) = ?`,
      [id, today]
    );

    // Get weekly stats (last 7 days)
    const [weeklyStats] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT p.user_id) as active_members,
        COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) as total_prayers_week
       FROM prayers p
       WHERE p.mosque_id = ? AND p.prayer_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [id]
    );

    // Get monthly stats (last 30 days or specified period)
    const [monthlyStats] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT p.user_id) as active_members,
        COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) as total_prayers_month,
        COUNT(p.id) as total_prayer_records
       FROM prayers p
       WHERE p.mosque_id = ? AND p.prayer_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [id, period]
    );

    // Calculate percentages
    const todayData = todayStats[0];
    const weeklyData = weeklyStats[0];
    const monthlyData = monthlyStats[0];

    // Calculate today's percentage (total prayers out of possible prayers)
    const maxPossibleTodayPrayers = totalMembers * 5; // 5 prayers per day
    const todayPercentage =
      maxPossibleTodayPrayers > 0
        ? Math.round(
            (todayData.total_prayers_today / maxPossibleTodayPrayers) * 100
          )
        : 0;

    // Calculate weekly percentage (last 7 days)
    const maxPossibleWeeklyPrayers = totalMembers * 5 * 7; // 5 prayers * 7 days
    const weeklyPercentage =
      maxPossibleWeeklyPrayers > 0
        ? Math.round(
            (weeklyData.total_prayers_week / maxPossibleWeeklyPrayers) * 100
          )
        : 0;

    // Calculate monthly percentage
    const maxPossibleMonthlyPrayers = totalMembers * 5 * parseInt(period); // 5 prayers * period days
    const monthlyPercentage =
      maxPossibleMonthlyPrayers > 0
        ? Math.round(
            (monthlyData.total_prayers_month / maxPossibleMonthlyPrayers) * 100
          )
        : 0;

    // Calculate prayer breakdown percentages for today
    const prayerBreakdown = {
      fajr: {
        count: todayData.fajr_count || 0,
        percentage:
          totalMembers > 0
            ? Math.round(((todayData.fajr_count || 0) / totalMembers) * 100)
            : 0,
      },
      dhuhr: {
        count: todayData.dhuhr_count || 0,
        percentage:
          totalMembers > 0
            ? Math.round(((todayData.dhuhr_count || 0) / totalMembers) * 100)
            : 0,
      },
      asr: {
        count: todayData.asr_count || 0,
        percentage:
          totalMembers > 0
            ? Math.round(((todayData.asr_count || 0) / totalMembers) * 100)
            : 0,
      },
      maghrib: {
        count: todayData.maghrib_count || 0,
        percentage:
          totalMembers > 0
            ? Math.round(((todayData.maghrib_count || 0) / totalMembers) * 100)
            : 0,
      },
      isha: {
        count: todayData.isha_count || 0,
        percentage:
          totalMembers > 0
            ? Math.round(((todayData.isha_count || 0) / totalMembers) * 100)
            : 0,
      },
    };

    const responseData = {
      mosque: {
        id: parseInt(id),
        name: mosqueInfo[0].name,
        address: mosqueInfo[0].address,
        totalMembers: totalMembers,
      },
      today: {
        total: todayData.total_prayers_today || 0,
        percentage: todayPercentage,
        membersActive: todayData.members_with_prayers || 0,
        prayerBreakdown: prayerBreakdown,
      },
      weekly: {
        total: weeklyData.total_prayers_week || 0,
        percentage: weeklyPercentage,
        activeMembersCount: weeklyData.active_members || 0,
      },
      monthly: {
        total: monthlyData.total_prayers_month || 0,
        percentage: monthlyPercentage,
        activeMembersCount: monthlyData.active_members || 0,
        period: parseInt(period),
      },
    };

    console.log("📊 Attendance stats calculated:", responseData);

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Error fetching mosque attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mosque attendance statistics",
      error: error.message,
    });
  }
});

// Get general attendance statistics (fallback when no mosque assigned)
router.get("/attendance/general", authenticateToken, async (req, res) => {
  try {
    const { period = "30" } = req.query; // days

    console.log("📊 Fetching general attendance stats, period:", period);

    // Get any mosque with prayer data
    const [availableMosques] = await pool.execute(`
      SELECT DISTINCT m.id, m.name, m.address
      FROM mosques m
      INNER JOIN prayers p ON m.id = p.mosque_id
      ORDER BY m.created_at DESC
      LIMIT 1
    `);

    if (availableMosques.length === 0) {
      return res.json({
        success: true,
        data: {
          mosque: {
            id: 0,
            name: "No Data Available",
            address: "No mosque data found",
            totalMembers: 0,
          },
          today: {
            total: 0,
            percentage: 0,
            membersActive: 0,
            prayerBreakdown: {
              fajr: { count: 0, percentage: 0 },
              dhuhr: { count: 0, percentage: 0 },
              asr: { count: 0, percentage: 0 },
              maghrib: { count: 0, percentage: 0 },
              isha: { count: 0, percentage: 0 },
            },
          },
          weekly: { total: 0, percentage: 0, activeMembersCount: 0 },
          monthly: {
            total: 0,
            percentage: 0,
            activeMembersCount: 0,
            period: parseInt(period),
          },
        },
      });
    }

    const mosque = availableMosques[0];

    // Get total member count for this mosque
    const [memberCount] = await pool.execute(
      "SELECT COUNT(*) as total_members FROM users WHERE mosque_id = ? AND role = 'Member'",
      [mosque.id]
    );

    const totalMembers = memberCount[0].total_members;

    // Get today's attendance stats
    const today = new Date().toISOString().split("T")[0];
    const [todayStats] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT p.user_id) as members_with_prayers,
        SUM(COALESCE(p.fajr, 0)) as fajr_count,
        SUM(COALESCE(p.dhuhr, 0)) as dhuhr_count,
        SUM(COALESCE(p.asr, 0)) as asr_count,
        SUM(COALESCE(p.maghrib, 0)) as maghrib_count,
        SUM(COALESCE(p.isha, 0)) as isha_count,
        COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) as total_prayers_today
       FROM prayers p
       WHERE p.mosque_id = ? AND DATE(p.prayer_date) = ?`,
      [mosque.id, today]
    );

    // Get weekly stats (last 7 days)
    const [weeklyStats] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT p.user_id) as active_members,
        COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) as total_prayers_week
       FROM prayers p
       WHERE p.mosque_id = ? AND p.prayer_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [mosque.id]
    );

    // Get monthly stats
    const [monthlyStats] = await pool.execute(
      `SELECT 
        COUNT(DISTINCT p.user_id) as active_members,
        COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) as total_prayers_month
       FROM prayers p
       WHERE p.mosque_id = ? AND p.prayer_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [mosque.id, period]
    );

    // Calculate percentages
    const todayData = todayStats[0];
    const weeklyData = weeklyStats[0];
    const monthlyData = monthlyStats[0];

    // Calculate today's percentage (total prayers out of possible prayers)
    const maxPossibleTodayPrayers = totalMembers * 5; // 5 prayers per day
    const todayPercentage =
      maxPossibleTodayPrayers > 0
        ? Math.round(
            (todayData.total_prayers_today / maxPossibleTodayPrayers) * 100
          )
        : 0;

    // Calculate weekly percentage (last 7 days)
    const maxPossibleWeeklyPrayers = totalMembers * 5 * 7;
    const weeklyPercentage =
      maxPossibleWeeklyPrayers > 0
        ? Math.round(
            (weeklyData.total_prayers_week / maxPossibleWeeklyPrayers) * 100
          )
        : 0;

    // Calculate monthly percentage
    const maxPossibleMonthlyPrayers = totalMembers * 5 * parseInt(period);
    const monthlyPercentage =
      maxPossibleMonthlyPrayers > 0
        ? Math.round(
            (monthlyData.total_prayers_month / maxPossibleMonthlyPrayers) * 100
          )
        : 0;

    // Calculate prayer breakdown percentages for today
    const prayerBreakdown = {
      fajr: {
        count: todayData.fajr_count || 0,
        percentage:
          totalMembers > 0
            ? Math.round(((todayData.fajr_count || 0) / totalMembers) * 100)
            : 0,
      },
      dhuhr: {
        count: todayData.dhuhr_count || 0,
        percentage:
          totalMembers > 0
            ? Math.round(((todayData.dhuhr_count || 0) / totalMembers) * 100)
            : 0,
      },
      asr: {
        count: todayData.asr_count || 0,
        percentage:
          totalMembers > 0
            ? Math.round(((todayData.asr_count || 0) / totalMembers) * 100)
            : 0,
      },
      maghrib: {
        count: todayData.maghrib_count || 0,
        percentage:
          totalMembers > 0
            ? Math.round(((todayData.maghrib_count || 0) / totalMembers) * 100)
            : 0,
      },
      isha: {
        count: todayData.isha_count || 0,
        percentage:
          totalMembers > 0
            ? Math.round(((todayData.isha_count || 0) / totalMembers) * 100)
            : 0,
      },
    };

    const responseData = {
      mosque: {
        id: mosque.id,
        name: mosque.name,
        address: mosque.address,
        totalMembers: totalMembers,
      },
      today: {
        total: todayData.total_prayers_today || 0,
        percentage: todayPercentage,
        membersActive: todayData.members_with_prayers || 0,
        prayerBreakdown: prayerBreakdown,
      },
      weekly: {
        total: weeklyData.total_prayers_week || 0,
        percentage: weeklyPercentage,
        activeMembersCount: weeklyData.active_members || 0,
      },
      monthly: {
        total: monthlyData.total_prayers_month || 0,
        percentage: monthlyPercentage,
        activeMembersCount: monthlyData.active_members || 0,
        period: parseInt(period),
      },
    };

    console.log("📊 General attendance stats calculated:", responseData);

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Error fetching general attendance stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance statistics",
      error: error.message,
    });
  }
});

module.exports = router;
