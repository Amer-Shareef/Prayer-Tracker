// filepath: routes/attendance.js
const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const { dbHealthCheck } = require("../middleware/dbHealthCheck");

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

      if (!role || !["Founder", "SuperAdmin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Valid role (Founder or SuperAdmin) is required",
        });
      }

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
      const dates = getDateRanges();

      let overviewData = {};

      // Get area info for Founder
      if (areaFilter) {
        const [areaInfo] = await pool.execute(
          'SELECT area_id, area_name FROM areas WHERE area_id = ?',
          [areaFilter]
        );
        if (areaInfo.length > 0) {
          overviewData.areaInfo = {
            name: areaInfo[0].area_name,
            id: areaInfo[0].area_id
          };
        }
      }

      // Get total active members count
      const memberCountQuery = `
        SELECT COUNT(*) as total_members
        FROM users
        WHERE status = 'active'
        ${areaFilter ? 'AND area_id = ?' : ''}
      `;
      const [memberCount] = await pool.execute(
        memberCountQuery,
        areaFilter ? [areaFilter] : []
      );
      const totalMembers = memberCount[0].total_members;

      // Yesterday's attendance
      const yesterdayQuery = `
        SELECT 
          COUNT(DISTINCT user_id) as active_members,
          SUM(fajr + dhuhr + asr + maghrib + isha) as total_prayers
        FROM prayers
        WHERE prayer_date = ?
        ${areaFilter ? 'AND area_id = ?' : ''}
      `;
      const [yesterdayResult] = await pool.execute(
        yesterdayQuery,
        areaFilter ? [dates.yesterday, areaFilter] : [dates.yesterday]
      );

      const totalPossibleYesterday = totalMembers * 5;
      overviewData.yesterday = {
        percentage: totalPossibleYesterday > 0
          ? Math.round((yesterdayResult[0].total_prayers / totalPossibleYesterday) * 100)
          : 0,
        count: yesterdayResult[0].total_prayers || 0,
        total: totalPossibleYesterday,
      };

      // New members in last 30 days
      const newMembersQuery = `
        SELECT COUNT(*) as new_count
        FROM users
        WHERE joined_date >= ?
        AND status = 'active'
        ${areaFilter ? 'AND area_id = ?' : ''}
      `;
      const [newMembersResult] = await pool.execute(
        newMembersQuery,
        areaFilter ? [dates.last30Days, areaFilter] : [dates.last30Days]
      );

      overviewData.newMembers = {
        count: newMembersResult[0].new_count || 0,
        total: totalMembers,
      };

      if (role === "SuperAdmin") {
        // Top performing area (last 7 days)
        const topAreaQuery = `
          SELECT 
            a.area_id,
            a.area_name,
            COUNT(DISTINCT u.id) as total_members,
            COALESCE(SUM(p.fajr + p.dhuhr + p.asr + p.maghrib + p.isha), 0) as total_prayers
          FROM areas a
          INNER JOIN users u ON u.area_id = a.area_id AND u.status = 'active'
          LEFT JOIN prayers p ON p.user_id = u.id AND p.prayer_date >= ? AND p.prayer_date < ?
          GROUP BY a.area_id, a.area_name
          HAVING total_members > 0
          ORDER BY (total_prayers / (total_members * 7 * 5)) DESC
          LIMIT 1
        `;
        const [topAreaResult] = await pool.execute(topAreaQuery, [dates.last7Days, dates.today]);

        if (topAreaResult.length > 0) {
          const topArea = topAreaResult[0];
          const weekPossible = topArea.total_members * 7 * 5;
          overviewData.topArea = {
            name: topArea.area_name,
            percentage: weekPossible > 0 
              ? Math.round((topArea.total_prayers / weekPossible) * 100)
              : 0,
            area_id: topArea.area_id,
          };
        }

        // Average rate across all areas (last 7 days)
        const avgRateQuery = `
          SELECT 
            SUM(fajr + dhuhr + asr + maghrib + isha) as total_prayers
          FROM prayers
          WHERE prayer_date >= ? AND prayer_date < ?
        `;
        const [avgRateResult] = await pool.execute(avgRateQuery, [dates.last7Days, dates.today]);
        const weekTotalPossible = totalMembers * 7 * 5;

        overviewData.avgRate7d = {
          percentage: weekTotalPossible > 0
            ? Math.round((avgRateResult[0].total_prayers / weekTotalPossible) * 100)
            : 0,
        };
      } else {
        // Founder: Get area stats and rank
        const areaStatsQuery = `
          SELECT 
            a.area_id,
            a.area_name,
            COUNT(DISTINCT u.id) as total_members,
            COALESCE(SUM(p.fajr + p.dhuhr + p.asr + p.maghrib + p.isha), 0) as total_prayers
          FROM areas a
          INNER JOIN users u ON u.area_id = a.area_id AND u.status = 'active'
          LEFT JOIN prayers p ON p.user_id = u.id AND p.prayer_date >= ? AND p.prayer_date < ?
          GROUP BY a.area_id, a.area_name
          HAVING total_members > 0
          ORDER BY (total_prayers / (total_members * 7 * 5)) DESC
        `;
        const [areaStats] = await pool.execute(areaStatsQuery, [dates.last7Days, dates.today]);

        const userAreaIndex = areaStats.findIndex(area => area.area_id === areaFilter);

        if (userAreaIndex !== -1) {
          const userAreaStats = areaStats[userAreaIndex];
          const weekPossible = userAreaStats.total_members * 7 * 5;
          const percentage = weekPossible > 0
            ? Math.round((userAreaStats.total_prayers / weekPossible) * 100)
            : 0;

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
      const dates = getDateRanges();

      // Get total active members
      const memberCountQuery = `
        SELECT COUNT(*) as total
        FROM users
        WHERE status = 'active'
        ${areaFilter ? 'AND area_id = ?' : ''}
      `;
      const [membersResult] = await pool.execute(
        memberCountQuery,
        areaFilter ? [areaFilter] : []
      );
      const totalMembers = membersResult[0].total;

      // Yesterday's prayer data
      const yesterdayQuery = `
        SELECT 
          SUM(fajr) as fajr_count,
          SUM(dhuhr) as dhuhr_count,
          SUM(asr) as asr_count,
          SUM(maghrib) as maghrib_count,
          SUM(isha) as isha_count
        FROM prayers
        WHERE prayer_date = ?
        ${areaFilter ? 'AND area_id = ?' : ''}
      `;
      const [yesterdayData] = await pool.execute(
        yesterdayQuery,
        areaFilter ? [dates.yesterday, areaFilter] : [dates.yesterday]
      );

      // Last 7 days prayer data
      const weekQuery = `
        SELECT 
          SUM(fajr) as fajr_count,
          SUM(dhuhr) as dhuhr_count,
          SUM(asr) as asr_count,
          SUM(maghrib) as maghrib_count,
          SUM(isha) as isha_count,
          COUNT(DISTINCT prayer_date) as actual_days
        FROM prayers
        WHERE prayer_date >= ? AND prayer_date < ?
        ${areaFilter ? 'AND area_id = ?' : ''}
      `;
      const [weekData] = await pool.execute(
        weekQuery,
        areaFilter ? [dates.last7Days, dates.today, areaFilter] : [dates.last7Days, dates.today]
      );

      // Last 30 days prayer data
      const monthQuery = `
        SELECT 
          SUM(fajr) as fajr_count,
          SUM(dhuhr) as dhuhr_count,
          SUM(asr) as asr_count,
          SUM(maghrib) as maghrib_count,
          SUM(isha) as isha_count,
          COUNT(DISTINCT prayer_date) as actual_days
        FROM prayers
        WHERE prayer_date >= ? AND prayer_date < ?
        ${areaFilter ? 'AND area_id = ?' : ''}
      `;
      const [monthData] = await pool.execute(
        monthQuery,
        areaFilter ? [dates.last30Days, dates.today, areaFilter] : [dates.last30Days, dates.today]
      );

      const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
      const breakdown = {};

      // Use actual days from data or default to expected days
      const weekActualDays = weekData[0].actual_days || 7;
      const monthActualDays = monthData[0].actual_days || 30;

      prayers.forEach((prayer) => {
        breakdown[prayer] = {
          yesterdayCount: yesterdayData[0][`${prayer}_count`] || 0,
          yesterdayPercent: totalMembers > 0
            ? Math.round(((yesterdayData[0][`${prayer}_count`] || 0) / totalMembers) * 100)
            : 0,
          weekPercent: totalMembers > 0
            ? Math.round(((weekData[0][`${prayer}_count`] || 0) / (totalMembers * weekActualDays)) * 100)
            : 0,
          monthPercent: totalMembers > 0
            ? Math.round(((monthData[0][`${prayer}_count`] || 0) / (totalMembers * monthActualDays)) * 100)
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

      if (user.role !== "SuperAdmin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. SuperAdmin role required.",
        });
      }

      const dates = getDateRanges();

      // Single optimized query with all calculations
      const areasQuery = `
        SELECT 
          a.area_id,
          a.area_name,
          COUNT(DISTINCT u.id) as members,
          
          COALESCE(SUM(CASE WHEN p.prayer_date = ? THEN p.fajr + p.dhuhr + p.asr + p.maghrib + p.isha ELSE 0 END), 0) as yesterday_prayers,
          
          COALESCE(SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date < ? THEN p.fajr + p.dhuhr + p.asr + p.maghrib + p.isha ELSE 0 END), 0) as week_prayers,
          
          COALESCE(SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date < ? THEN p.fajr + p.dhuhr + p.asr + p.maghrib + p.isha ELSE 0 END), 0) as month_prayers,
          
          COALESCE(SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date < ? THEN p.fajr ELSE 0 END), 0) as fajr_week
          
        FROM areas a
        INNER JOIN users u ON u.area_id = a.area_id AND u.status = 'active'
        LEFT JOIN prayers p ON p.user_id = u.id
        GROUP BY a.area_id, a.area_name
        ORDER BY a.area_name
      `;

      const [areasData] = await pool.execute(areasQuery, [
        dates.yesterday,
        dates.last7Days, dates.today,
        dates.last30Days, dates.today,
        dates.last7Days, dates.today
      ]);

      const areasWithStats = areasData.map((area) => {
        const members = area.members || 0;

        const yesterdayPercent = members > 0
          ? Math.round(((area.yesterday_prayers || 0) / (members * 5)) * 100)
          : 0;
          
        const weekPercent = members > 0
          ? Math.round(((area.week_prayers || 0) / (members * 7 * 5)) * 100)
          : 0;
          
        const monthPercent = members > 0
          ? Math.round(((area.month_prayers || 0) / (members * 30 * 5)) * 100)
          : 0;
          
        const fajrPercent = members > 0
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

// 4. GET /api/attendance/members - Member attendance list
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

      if (!role || !["Founder", "SuperAdmin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Valid role (Founder or SuperAdmin) is required",
        });
      }

      const isFounder = role === "Founder";

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

      const dates = getDateRanges();
      
      // Calculate period start date based on period parameter
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - periodDays);
      const formattedPeriodStart = periodStart.toISOString().split('T')[0];

      let whereConditions = ["u.status = ?"];
      let params = ["active"];

      if (areaFilter) {
        whereConditions.push("u.area_id = ?");
        params.push(areaFilter);
      }

      if (search) {
        whereConditions.push("u.full_name LIKE ?");
        params.push(`%${search}%`);
      }

      const whereClause = whereConditions.join(" AND ");

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM users u WHERE ${whereClause}`;
      const [countResult] = await pool.execute(countQuery, params);
      const totalItems = countResult[0].total;
      const totalPages = Math.ceil(totalItems / limitNum);

      // Get users with their attendance data in one query
      const usersQuery = `
        SELECT 
          u.id,
          u.full_name as name,
          u.phone,
          u.area_id,
          
          COALESCE(SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date < ? 
            THEN p.fajr + p.dhuhr + p.asr + p.maghrib + p.isha ELSE 0 END), 0) as period_prayers,
          
          COALESCE(SUM(CASE WHEN p.prayer_date >= ? AND p.prayer_date < ? 
            THEN p.fajr ELSE 0 END), 0) as period_fajr,
          
          MAX(CASE WHEN p.prayer_date = ? THEN p.fajr ELSE 0 END) as yesterday_fajr,
          MAX(CASE WHEN p.prayer_date = ? THEN p.dhuhr ELSE 0 END) as yesterday_dhuhr,
          MAX(CASE WHEN p.prayer_date = ? THEN p.asr ELSE 0 END) as yesterday_asr,
          MAX(CASE WHEN p.prayer_date = ? THEN p.maghrib ELSE 0 END) as yesterday_maghrib,
          MAX(CASE WHEN p.prayer_date = ? THEN p.isha ELSE 0 END) as yesterday_isha
          
        FROM users u
        LEFT JOIN prayers p ON p.user_id = u.id
        WHERE ${whereClause}
        GROUP BY u.id, u.full_name, u.phone, u.area_id
        ORDER BY period_prayers DESC
        LIMIT ${limitNum} OFFSET ${offset}
      `;

      const queryParams = [
        ...params.slice(0, params.length),
        formattedPeriodStart, dates.today,
        formattedPeriodStart, dates.today,
        dates.yesterday,
        dates.yesterday,
        dates.yesterday,
        dates.yesterday,
        dates.yesterday
      ];

      // Remove the duplicate params at the beginning
      const finalParams = [
        ...params,
        formattedPeriodStart, dates.today,
        formattedPeriodStart, dates.today,
        dates.yesterday,
        dates.yesterday,
        dates.yesterday,
        dates.yesterday,
        dates.yesterday
      ];

      const [membersData] = await pool.execute(usersQuery, finalParams);

      const formattedMembers = membersData.map((member) => {
        const totalPossible = periodDays * 5;
        const periodPercentage = totalPossible > 0
          ? Math.round((member.period_prayers / totalPossible) * 100)
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
            isha: Boolean(member.yesterday_isha)
          },
          fajrCount: member.period_fajr || 0,
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
