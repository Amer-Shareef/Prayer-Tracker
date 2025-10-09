// filepath: routes/attendance.js
const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const { dbHealthCheck } = require("../middleware/dbHealthCheck");

const router = express.Router();

// Helper function to calculate weighted score
const calculateWeightedScore = (weekPercent, yesterdayPercent, fajrPercent) => {
  const consistencyBonus = (yesterdayPercent + fajrPercent) / 2;
  return Math.round(weekPercent * 0.7 + consistencyBonus * 0.3);
};

// 1. GET /api/attendance/overview - Overview statistics
router.get(
  "/attendance/overview",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const { role } = req.query;

      // Validate role
      if (!role || !["Founder", "SuperAdmin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Valid role (Founder or SuperAdmin) is required",
        });
      }

      // Verify user has permission
      if (role === "Founder" && user.role !== "Founder") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Founder role required.",
        });
      }

      if (role === "SuperAdmin" && user.role !== "SuperAdmin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. SuperAdmin role required.",
        });
      }

      const isFounder = role === "Founder";
      const areaFilter = isFounder ? user.area_id : null;

      // Date ranges
      const yesterday = "CURDATE() - INTERVAL 1 DAY";
      const weekStart = "CURDATE() - INTERVAL 7 DAY";
      const monthStart = "CURDATE() - INTERVAL 30 DAY";

      let overviewData = {};

      // Yesterday's attendance
      const yesterdayQuery = `
      SELECT 
        COUNT(DISTINCT p.user_id) as active_members,
        SUM(p.fajr + p.dhuhr + p.asr + p.maghrib + p.isha) as total_prayers,
        (SELECT COUNT(*) FROM users WHERE status = 'active' ${
          areaFilter ? "AND area_id = ?" : ""
        }) as total_members
      FROM prayers p
      WHERE p.prayer_date = ${yesterday}
      ${areaFilter ? "AND p.area_id = ?" : ""}
    `;

      const [yesterdayResult] = await pool.execute(
        yesterdayQuery,
        areaFilter ? [areaFilter, areaFilter] : []
      );

      const totalPossible = yesterdayResult[0].total_members * 5;
      overviewData.yesterday = {
        percentage:
          totalPossible > 0
            ? Math.round(
                (yesterdayResult[0].total_prayers / totalPossible) * 100
              )
            : 0,
        count: yesterdayResult[0].total_prayers || 0,
        total: totalPossible,
      };

      // New members in last 30 days
      const newMembersQuery = `
      SELECT 
        COUNT(*) as new_count,
        (SELECT COUNT(*) FROM users WHERE status = 'active' ${
          areaFilter ? "AND area_id = ?" : ""
        }) as total
      FROM users
      WHERE joined_date >= ${monthStart}
      AND status = 'active'
      ${areaFilter ? "AND area_id = ?" : ""}
    `;

      const [newMembersResult] = await pool.execute(
        newMembersQuery,
        areaFilter ? [areaFilter, areaFilter] : []
      );

      overviewData.newMembers = {
        count: newMembersResult[0].new_count || 0,
        total: newMembersResult[0].total || 0,
      };

      if (role === "SuperAdmin") {
        // Top performing area
        const topAreaQuery = `
        SELECT 
          a.area_id,
          a.area_name,
          COUNT(DISTINCT p.user_id) as active_members,
          SUM(p.fajr + p.dhuhr + p.asr + p.maghrib + p.isha) as total_prayers,
          (SELECT COUNT(*) FROM users WHERE status = 'active' AND area_id = a.area_id) as total_members
        FROM areas a
        LEFT JOIN prayers p ON p.area_id = a.area_id 
          AND p.prayer_date >= ${weekStart}
        GROUP BY a.area_id, a.area_name
        HAVING total_members > 0
        ORDER BY (total_prayers / (total_members * 7 * 5)) DESC
        LIMIT 1
      `;

        const [topAreaResult] = await pool.execute(topAreaQuery);

        if (topAreaResult.length > 0) {
          const topArea = topAreaResult[0];
          const weekPossible = topArea.total_members * 7 * 5;
          overviewData.topArea = {
            name: topArea.area_name,
            percentage: Math.round(
              (topArea.total_prayers / weekPossible) * 100
            ),
            area_id: topArea.area_id,
          };
        }

        // Average rate across all areas
        const avgRateQuery = `
        SELECT 
          SUM(p.fajr + p.dhuhr + p.asr + p.maghrib + p.isha) as total_prayers,
          (SELECT COUNT(*) FROM users WHERE status = 'active') as total_members
        FROM prayers p
        WHERE p.prayer_date >= ${weekStart}
      `;

        const [avgRateResult] = await pool.execute(avgRateQuery);
        const weekTotalPossible = avgRateResult[0].total_members * 7 * 5;

        overviewData.avgRate7d = {
          percentage:
            weekTotalPossible > 0
              ? Math.round(
                  (avgRateResult[0].total_prayers / weekTotalPossible) * 100
                )
              : 0,
        };
      } else {
        // Founder-specific: Area rank and weekly average
        const areaStatsQuery = `
        SELECT 
          a.area_id,
          a.area_name,
          SUM(p.fajr + p.dhuhr + p.asr + p.maghrib + p.isha) as total_prayers,
          (SELECT COUNT(*) FROM users WHERE status = 'active' AND area_id = a.area_id) as total_members
        FROM areas a
        LEFT JOIN prayers p ON p.area_id = a.area_id 
          AND p.prayer_date >= ${weekStart}
        GROUP BY a.area_id, a.area_name
        HAVING total_members > 0
        ORDER BY (total_prayers / (total_members * 7 * 5)) DESC
      `;

        const [areaStats] = await pool.execute(areaStatsQuery);

        const userAreaIndex = areaStats.findIndex(
          (area) => area.area_id === areaFilter
        );

        if (userAreaIndex !== -1) {
          const userAreaStats = areaStats[userAreaIndex];
          const weekPossible = userAreaStats.total_members * 7 * 5;
          const percentage = Math.round(
            (userAreaStats.total_prayers / weekPossible) * 100
          );

          overviewData.areaRank = {
            position: userAreaIndex + 1,
            totalAreas: areaStats.length,
            percentage: percentage,
          };

          overviewData.weeklyAvg = {
            percentage: percentage,
          };
        }
      }

      res.json({
        success: true,
        data: overviewData,
      });
    } catch (error) {
      console.error("Error fetching overview:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch overview statistics",
        error: error.message,
      });
    }
  }
);

// 2. GET /api/attendance/prayer-breakdown - Prayer-wise statistics
router.get(
  "/attendance/prayer-breakdown",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const { role } = req.query;

      if (!role || !["Founder", "SuperAdmin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Valid role (Founder or SuperAdmin) is required",
        });
      }

      const isFounder = role === "Founder";
      const areaFilter = isFounder ? user.area_id : null;

      // Get total members for percentage calculation
      const [membersResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM users WHERE status = 'active' ${
          areaFilter ? "AND area_id = ?" : ""
        }`,
        areaFilter ? [areaFilter] : []
      );
      const totalMembers = membersResult[0].total;

      // Yesterday's prayers
      const yesterdayQuery = `
      SELECT 
        SUM(fajr) as fajr_count,
        SUM(dhuhr) as dhuhr_count,
        SUM(asr) as asr_count,
        SUM(maghrib) as maghrib_count,
        SUM(isha) as isha_count
      FROM prayers
      WHERE prayer_date = CURDATE() - INTERVAL 1 DAY
      ${areaFilter ? "AND area_id = ?" : ""}
    `;

      const [yesterdayData] = await pool.execute(
        yesterdayQuery,
        areaFilter ? [areaFilter] : []
      );

      // Last 7 days
      const weekQuery = `
      SELECT 
        SUM(fajr) as fajr_count,
        SUM(dhuhr) as dhuhr_count,
        SUM(asr) as asr_count,
        SUM(maghrib) as maghrib_count,
        SUM(isha) as isha_count
      FROM prayers
      WHERE prayer_date >= CURDATE() - INTERVAL 7 DAY
      ${areaFilter ? "AND area_id = ?" : ""}
    `;

      const [weekData] = await pool.execute(
        weekQuery,
        areaFilter ? [areaFilter] : []
      );

      // Last 30 days
      const monthQuery = `
      SELECT 
        SUM(fajr) as fajr_count,
        SUM(dhuhr) as dhuhr_count,
        SUM(asr) as asr_count,
        SUM(maghrib) as maghrib_count,
        SUM(isha) as isha_count
      FROM prayers
      WHERE prayer_date >= CURDATE() - INTERVAL 30 DAY
      ${areaFilter ? "AND area_id = ?" : ""}
    `;

      const [monthData] = await pool.execute(
        monthQuery,
        areaFilter ? [areaFilter] : []
      );

      // Calculate percentages
      const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
      const breakdown = {};

      prayers.forEach((prayer) => {
        breakdown[prayer] = {
          yesterdayCount: yesterdayData[0][`${prayer}_count`] || 0,
          yesterdayPercent:
            totalMembers > 0
              ? Math.round(
                  ((yesterdayData[0][`${prayer}_count`] || 0) / totalMembers) *
                    100
                )
              : 0,
          weekPercent:
            totalMembers > 0
              ? Math.round(
                  ((weekData[0][`${prayer}_count`] || 0) / (totalMembers * 7)) *
                    100
                )
              : 0,
          monthPercent:
            totalMembers > 0
              ? Math.round(
                  ((monthData[0][`${prayer}_count`] || 0) /
                    (totalMembers * 30)) *
                    100
                )
              : 0,
        };
      });

      res.json({
        success: true,
        data: breakdown,
      });
    } catch (error) {
      console.error("Error fetching prayer breakdown:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch prayer breakdown",
        error: error.message,
      });
    }
  }
);

// 3. GET /api/attendance/areas - Area performance table (SuperAdmin only)
router.get(
  "/attendance/areas",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;

      // Verify SuperAdmin role
      if (user.role !== "SuperAdmin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. SuperAdmin role required.",
        });
      }

      const areasQuery = `
      SELECT 
        a.area_id,
        a.area_name,
        (SELECT COUNT(*) FROM users WHERE status = 'active' AND area_id = a.area_id) as members,
        
        -- Yesterday
        (SELECT SUM(fajr + dhuhr + asr + maghrib + isha) 
         FROM prayers 
         WHERE area_id = a.area_id AND prayer_date = CURDATE() - INTERVAL 1 DAY) as yesterday_prayers,
        
        -- Last 7 days
        (SELECT SUM(fajr + dhuhr + asr + maghrib + isha) 
         FROM prayers 
         WHERE area_id = a.area_id AND prayer_date >= CURDATE() - INTERVAL 7 DAY) as week_prayers,
        
        -- Last 30 days
        (SELECT SUM(fajr + dhuhr + asr + maghrib + isha) 
         FROM prayers 
         WHERE area_id = a.area_id AND prayer_date >= CURDATE() - INTERVAL 30 DAY) as month_prayers,
        
        -- Fajr last 7 days
        (SELECT SUM(fajr) 
         FROM prayers 
         WHERE area_id = a.area_id AND prayer_date >= CURDATE() - INTERVAL 7 DAY) as fajr_week
         
      FROM areas a
      ORDER BY a.area_name
    `;

      const [areasData] = await pool.execute(areasQuery);

      // Calculate percentages and weighted scores
      const areasWithStats = areasData.map((area) => {
        const members = area.members || 0;

        const yesterdayPercent =
          members > 0
            ? Math.round(((area.yesterday_prayers || 0) / (members * 5)) * 100)
            : 0;
        const weekPercent =
          members > 0
            ? Math.round(((area.week_prayers || 0) / (members * 7 * 5)) * 100)
            : 0;
        const monthPercent =
          members > 0
            ? Math.round(((area.month_prayers || 0) / (members * 30 * 5)) * 100)
            : 0;
        const fajrPercent =
          members > 0
            ? Math.round(((area.fajr_week || 0) / (members * 7)) * 100)
            : 0;

        const weightedScore = calculateWeightedScore(
          weekPercent,
          yesterdayPercent,
          fajrPercent
        );

        return {
          area_id: area.area_id,
          name: area.area_name,
          members: members,
          yesterdayPercent,
          weekPercent,
          monthPercent,
          fajrPercent,
          weightedScore,
        };
      });

      // Sort by weighted score
      areasWithStats.sort((a, b) => b.weightedScore - a.weightedScore);

      res.json({
        success: true,
        data: areasWithStats,
        count: areasWithStats.length,
      });
    } catch (error) {
      console.error("Error fetching areas:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch area performance data",
        error: error.message,
      });
    }
  }
);

// 4. GET /api/attendance/members - Member attendance list with pagination
router.get(
  "/attendance/members",
  authenticateToken,
  dbHealthCheck,
  async (req, res) => {
    try {
      const { user } = req;
      const {
        role,
        area_id,
        period = "7",
        search = "",
        page = "1",
        limit = "20",
      } = req.query;

      // Validate role
      if (!role || !["Founder", "SuperAdmin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Valid role (Founder or SuperAdmin) is required",
        });
      }

      const isFounder = role === "Founder";

      // Determine area filter
      let areaFilter = null;
      if (isFounder) {
        areaFilter = user.area_id;
      } else if (area_id && area_id !== "all") {
        areaFilter = parseInt(area_id);
      }

      const periodDays = parseInt(period);
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      // Build WHERE clause
      let whereConditions = ["u.status = 'active'"];
      let queryParams = [];

      if (areaFilter) {
        whereConditions.push("u.area_id = ?");
        queryParams.push(areaFilter);
      }

      if (search) {
        whereConditions.push("u.full_name LIKE ?");
        queryParams.push(`%${search}%`);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
      const [countResult] = await pool.execute(countQuery, queryParams);
      const totalItems = countResult[0].total;
      const totalPages = Math.ceil(totalItems / limitNum);

      // Main query with pagination
      const membersQuery = `
      SELECT 
        u.id,
        u.full_name as name,
        u.phone,
        u.area_id,
        
        -- Period attendance
        (SELECT SUM(fajr + dhuhr + asr + maghrib + isha) 
         FROM prayers 
         WHERE user_id = u.id 
         AND prayer_date >= CURDATE() - INTERVAL ? DAY) as period_prayers,
        
        -- Yesterday's prayers
        (SELECT fajr FROM prayers WHERE user_id = u.id AND prayer_date = CURDATE() - INTERVAL 1 DAY LIMIT 1) as yesterday_fajr,
        (SELECT dhuhr FROM prayers WHERE user_id = u.id AND prayer_date = CURDATE() - INTERVAL 1 DAY LIMIT 1) as yesterday_dhuhr,
        (SELECT asr FROM prayers WHERE user_id = u.id AND prayer_date = CURDATE() - INTERVAL 1 DAY LIMIT 1) as yesterday_asr,
        (SELECT maghrib FROM prayers WHERE user_id = u.id AND prayer_date = CURDATE() - INTERVAL 1 DAY LIMIT 1) as yesterday_maghrib,
        (SELECT isha FROM prayers WHERE user_id = u.id AND prayer_date = CURDATE() - INTERVAL 1 DAY LIMIT 1) as yesterday_isha,
        
        -- Fajr count in period
        (SELECT SUM(fajr) 
         FROM prayers 
         WHERE user_id = u.id 
         AND prayer_date >= CURDATE() - INTERVAL ? DAY) as fajr_count
        
      FROM users u
      ${whereClause}
      ORDER BY period_prayers DESC, u.full_name
      LIMIT ? OFFSET ?
    `;

      const memberQueryParams = [
        periodDays,
        periodDays,
        ...queryParams,
        limitNum,
        offset,
      ];
      const [membersData] = await pool.execute(membersQuery, memberQueryParams);

      // Format response
      const formattedMembers = membersData.map((member) => {
        const totalPossible = periodDays * 5;
        const periodPercentage =
          totalPossible > 0
            ? Math.round(((member.period_prayers || 0) / totalPossible) * 100)
            : 0;

        return {
          id: member.id,
          name: member.name,
          phone: member.phone || "",
          area_id: member.area_id,
          periodPercentage,
          yesterdayPrayers: {
            fajr: Boolean(member.yesterday_fajr),
            dhuhr: Boolean(member.yesterday_dhuhr),
            asr: Boolean(member.yesterday_asr),
            maghrib: Boolean(member.yesterday_maghrib),
            isha: Boolean(member.yesterday_isha),
          },
          fajrCount: member.fajr_count || 0,
          totalDays: periodDays,
        };
      });

      res.json({
        success: true,
        data: formattedMembers,
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalItems: totalItems,
          itemsPerPage: limitNum,
        },
      });
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch member attendance data",
        error: error.message,
      });
    }
  }
);

module.exports = router;
