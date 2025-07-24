const { pool } = require("../config/database");

/**
 * Prayer Controller for optimized table structure
 * Each record represents one day with boolean flags for 5 prayers
 */

// Get user's prayer records
const getPrayers = async (req, res) => {
  let connection = null;

  try {
    const { user } = req;
    const { date, month, year } = req.query;

    console.log("📥 Prayer API Request:", {
      user_id: user.id,
      query_params: { date, month, year },
    });

    connection = await pool.getConnection();

    let query = `
      SELECT p.*, m.name as mosque_name,
             DATE_FORMAT(p.prayer_date, '%Y-%m-%d') as formatted_date
      FROM prayers p
      LEFT JOIN mosques m ON p.mosque_id = m.id
      WHERE p.user_id = ?
    `;
    let queryParams = [user.id];

    if (date) {
      query += " AND DATE(p.prayer_date) = ?";
      queryParams.push(date);
      console.log("🗓️ Filtering by specific date:", date);
    } else if (month && year) {
      query += " AND YEAR(p.prayer_date) = ? AND MONTH(p.prayer_date) = ?";
      queryParams.push(year, month);
      console.log("📅 Filtering by month/year:", { month, year });
    } else {
      query +=
        " AND YEAR(p.prayer_date) = YEAR(CURDATE()) AND MONTH(p.prayer_date) = MONTH(CURDATE())";
      console.log("📅 Filtering by current month (default)");
    }

    query += " ORDER BY p.prayer_date DESC";

    console.log("🔍 Executing query:", query);
    console.log("🔍 Query params:", queryParams);

    const [prayers] = await connection.execute(query, queryParams);

    // Normalize the prayer_date format for frontend
    const normalizedPrayers = prayers.map((prayer) => ({
      ...prayer,
      prayer_date: prayer.formatted_date,
    }));

    console.log("📤 Prayer API Response:", {
      found_prayers: normalizedPrayers.length,
      sample_prayer: normalizedPrayers[0] || null,
    });

    res.json({
      success: true,
      data: normalizedPrayers,
    });
  } catch (error) {
    console.error("❌ Error fetching prayers:", error);

    if (
      error.code === "PROTOCOL_CONNECTION_LOST" ||
      error.code === "ECONNRESET"
    ) {
      return res.status(503).json({
        success: false,
        message: "Database connection lost. Please refresh and try again.",
        error: "CONNECTION_LOST",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch prayers",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Record daily prayers (supports partial updates)
const recordDailyPrayers = async (req, res) => {
  let connection = null;

  try {
    const { user } = req;
    const {
      prayer_date,
      fajr,
      dhuhr,
      asr,
      maghrib,
      isha,
      notes,
      zikr_count,
      quran_minutes,
    } = req.body;

    console.log("Recording daily prayers:", {
      prayer_date,
      prayers: { fajr, dhuhr, asr, maghrib, isha },
      user_id: user.id,
    });

    // Validation
    if (!prayer_date) {
      return res.status(400).json({
        success: false,
        message: "Prayer date is required",
      });
    }

    connection = await pool.getConnection();

    // Get user's mosque
    const [userData] = await connection.execute(
      "SELECT mosque_id FROM users WHERE id = ?",
      [user.id]
    );

    const mosqueId = userData[0]?.mosque_id;

    // Check if record already exists for this date
    const [existingRecord] = await connection.execute(
      "SELECT * FROM prayers WHERE user_id = ? AND DATE(prayer_date) = ?",
      [user.id, prayer_date]
    );

    // Convert boolean values to 1/0 (handle undefined/null as 0)
    const fajrVal = fajr ? 1 : 0;
    const dhuhrVal = dhuhr ? 1 : 0;
    const asrVal = asr ? 1 : 0;
    const maghribVal = maghrib ? 1 : 0;
    const ishaVal = isha ? 1 : 0;

    // Calculate completion rate
    const totalPrayers = fajrVal + dhuhrVal + asrVal + maghribVal + ishaVal;
    const completionRate = (totalPrayers / 5) * 100;

    let prayerId;

    if (existingRecord.length > 0) {
      // Update existing record - only update provided fields
      prayerId = existingRecord[0].id;

      let updateFields = [];
      let updateValues = [];

      if (fajr !== undefined) {
        updateFields.push("fajr = ?");
        updateValues.push(fajrVal);
      }
      if (dhuhr !== undefined) {
        updateFields.push("dhuhr = ?");
        updateValues.push(dhuhrVal);
      }
      if (asr !== undefined) {
        updateFields.push("asr = ?");
        updateValues.push(asrVal);
      }
      if (maghrib !== undefined) {
        updateFields.push("maghrib = ?");
        updateValues.push(maghribVal);
      }
      if (isha !== undefined) {
        updateFields.push("isha = ?");
        updateValues.push(ishaVal);
      }
      if (notes !== undefined) {
        updateFields.push("notes = ?");
        updateValues.push(notes);
      }
      if (zikr_count !== undefined) {
        updateFields.push("zikr_count = ?");
        updateValues.push(zikr_count || 0);
      }
      if (quran_minutes !== undefined) {
        updateFields.push("quran_minutes = ?");
        updateValues.push(quran_minutes || 0);
      }

      // Always update completion rate and timestamp
      updateFields.push(
        "daily_completion_rate = ?",
        "updated_at = CURRENT_TIMESTAMP"
      );
      updateValues.push(completionRate.toFixed(2));
      updateValues.push(prayerId); // for WHERE clause

      const updateQuery = `UPDATE prayers SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;

      await connection.execute(updateQuery, updateValues);
      console.log("Updated existing prayer record:", prayerId);
    } else {
      // Insert new record
      const [result] = await connection.execute(
        `INSERT INTO prayers (
          user_id, mosque_id, prayer_date, fajr, dhuhr, asr, maghrib, isha,
          daily_completion_rate, notes, zikr_count, quran_minutes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          mosqueId,
          prayer_date,
          fajrVal,
          dhuhrVal,
          asrVal,
          maghribVal,
          ishaVal,
          completionRate.toFixed(2),
          notes || null,
          zikr_count || 0,
          quran_minutes || 0,
        ]
      );
      prayerId = result.insertId;
      console.log("Created new prayer record:", prayerId);
    }

    // Fetch the updated/created prayer record
    const [prayer] = await connection.execute(
      `SELECT p.*, m.name as mosque_name,
              DATE_FORMAT(p.prayer_date, '%Y-%m-%d') as formatted_date
       FROM prayers p
       LEFT JOIN mosques m ON p.mosque_id = m.id
       WHERE p.id = ?`,
      [prayerId]
    );

    if (prayer.length === 0) {
      throw new Error("Failed to retrieve prayer record");
    }

    const normalizedPrayer = {
      ...prayer[0],
      prayer_date: prayer[0].formatted_date,
    };

    res.status(200).json({
      success: true,
      message: "Prayers recorded successfully",
      data: normalizedPrayer,
    });
  } catch (error) {
    console.error("Error recording prayers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record prayers",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Update individual prayer (for partial updates)
const updateIndividualPrayer = async (req, res) => {
  let connection = null;

  try {
    const { user } = req;
    const { prayer_date, prayer_type, prayed } = req.body;

    console.log("Updating individual prayer:", {
      prayer_date,
      prayer_type,
      prayed: Boolean(prayed),
      user_id: user.id,
    });

    // Validation
    if (!prayer_date || !prayer_type) {
      return res.status(400).json({
        success: false,
        message: "Prayer date and type are required",
      });
    }

    const validPrayerTypes = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    if (!validPrayerTypes.includes(prayer_type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid prayer type",
      });
    }

    connection = await pool.getConnection();

    // Get user's mosque
    const [userData] = await connection.execute(
      "SELECT mosque_id FROM users WHERE id = ?",
      [user.id]
    );

    const mosqueId = userData[0]?.mosque_id;
    const prayerColumn = prayer_type.toLowerCase();
    const prayedValue = prayed ? 1 : 0;

    // Check if record exists for this date
    const [existingRecord] = await connection.execute(
      "SELECT * FROM prayers WHERE user_id = ? AND DATE(prayer_date) = ?",
      [user.id, prayer_date]
    );

    let prayerId;

    if (existingRecord.length > 0) {
      // Update existing record
      prayerId = existingRecord[0].id;

      await connection.execute(
        `UPDATE prayers SET ${prayerColumn} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [prayedValue, prayerId]
      );

      console.log(
        `Updated ${prayer_type} prayer for existing record:`,
        prayerId
      );
    } else {
      // Create new record with only this prayer marked
      const [result] = await connection.execute(
        `INSERT INTO prayers (
          user_id, mosque_id, prayer_date, ${prayerColumn}, daily_completion_rate
        ) VALUES (?, ?, ?, ?, ?)`,
        [user.id, mosqueId, prayer_date, prayedValue, prayedValue * 20] // 20% for one prayer
      );

      prayerId = result.insertId;
      console.log(`Created new record with ${prayer_type} prayer:`, prayerId);
    }

    // Recalculate completion rate
    const [updatedRecord] = await connection.execute(
      "SELECT fajr, dhuhr, asr, maghrib, isha FROM prayers WHERE id = ?",
      [prayerId]
    );

    if (updatedRecord.length > 0) {
      const record = updatedRecord[0];
      const totalPrayers =
        record.fajr + record.dhuhr + record.asr + record.maghrib + record.isha;
      const completionRate = (totalPrayers / 5) * 100;

      await connection.execute(
        "UPDATE prayers SET daily_completion_rate = ? WHERE id = ?",
        [completionRate.toFixed(2), prayerId]
      );
    }

    // Fetch the updated prayer record
    const [prayer] = await connection.execute(
      `SELECT p.*, m.name as mosque_name,
              DATE_FORMAT(p.prayer_date, '%Y-%m-%d') as formatted_date
       FROM prayers p
       LEFT JOIN mosques m ON p.mosque_id = m.id
       WHERE p.id = ?`,
      [prayerId]
    );

    const normalizedPrayer = {
      ...prayer[0],
      prayer_date: prayer[0].formatted_date,
    };

    res.status(200).json({
      success: true,
      message: `${prayer_type} prayer updated successfully`,
      data: normalizedPrayer,
    });
  } catch (error) {
    console.error("Error updating prayer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update prayer",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Get prayer statistics
const getPrayerStats = async (req, res) => {
  let connection = null;

  try {
    const { user } = req;
    const { period = "30" } = req.query; // days

    connection = await pool.getConnection();

    // Overall stats for the period
    const [overallStats] = await connection.execute(
      `SELECT 
        COUNT(*) as total_days,
        AVG(daily_completion_rate) as avg_completion_rate,
        SUM(fajr + dhuhr + asr + maghrib + isha) as total_prayers_prayed,
        SUM(fajr) as fajr_count,
        SUM(dhuhr) as dhuhr_count,
        SUM(asr) as asr_count,
        SUM(maghrib) as maghrib_count,
        SUM(isha) as isha_count,
        AVG(zikr_count) as avg_zikr,
        AVG(quran_minutes) as avg_quran_minutes
       FROM prayers 
       WHERE user_id = ? AND prayer_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [user.id, period]
    );

    // Prayer type breakdown with rates
    const stats = overallStats[0];
    const totalPossiblePrayers = stats.total_days * 5;

    const prayerTypeStats = [
      {
        prayer_type: "Fajr",
        prayed: stats.fajr_count,
        total_possible: stats.total_days,
        rate:
          stats.total_days > 0
            ? ((stats.fajr_count / stats.total_days) * 100).toFixed(2)
            : 0,
      },
      {
        prayer_type: "Dhuhr",
        prayed: stats.dhuhr_count,
        total_possible: stats.total_days,
        rate:
          stats.total_days > 0
            ? ((stats.dhuhr_count / stats.total_days) * 100).toFixed(2)
            : 0,
      },
      {
        prayer_type: "Asr",
        prayed: stats.asr_count,
        total_possible: stats.total_days,
        rate:
          stats.total_days > 0
            ? ((stats.asr_count / stats.total_days) * 100).toFixed(2)
            : 0,
      },
      {
        prayer_type: "Maghrib",
        prayed: stats.maghrib_count,
        total_possible: stats.total_days,
        rate:
          stats.total_days > 0
            ? ((stats.maghrib_count / stats.total_days) * 100).toFixed(2)
            : 0,
      },
      {
        prayer_type: "Isha",
        prayed: stats.isha_count,
        total_possible: stats.total_days,
        rate:
          stats.total_days > 0
            ? ((stats.isha_count / stats.total_days) * 100).toFixed(2)
            : 0,
      },
    ];

    // Current streak calculation (consecutive days with 100% completion)
    const [streakData] = await connection.execute(
      `SELECT prayer_date, daily_completion_rate
       FROM prayers 
       WHERE user_id = ? AND prayer_date <= CURDATE()
       ORDER BY prayer_date DESC
       LIMIT 30`,
      [user.id]
    );

    let currentStreak = 0;
    for (const day of streakData) {
      if (day.daily_completion_rate >= 100) {
        currentStreak++;
      } else {
        break;
      }
    }

    const responseData = {
      period_days: parseInt(period),
      total_days_tracked: stats.total_days,
      overall_completion_rate: parseFloat(
        stats.avg_completion_rate || 0
      ).toFixed(2),
      total_prayers_prayed: stats.total_prayers_prayed,
      total_possible_prayers: totalPossiblePrayers,
      current_streak: currentStreak,
      prayer_breakdown: prayerTypeStats,
      spiritual_activities: {
        avg_zikr_count: parseFloat(stats.avg_zikr || 0).toFixed(1),
        avg_quran_minutes: parseFloat(stats.avg_quran_minutes || 0).toFixed(1),
      },
    };

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Error fetching prayer stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch prayer statistics",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  getPrayers,
  recordDailyPrayers,
  updateIndividualPrayer,
  getPrayerStats,
};
