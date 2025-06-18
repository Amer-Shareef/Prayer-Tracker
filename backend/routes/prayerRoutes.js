const express = require('express');
const { pool } = require('../config/database'); // Fixed import - use database.js
const { authenticateToken } = require('../middleware/auth');
const { dbHealthCheck } = require('../middleware/dbHealthCheck');

const router = express.Router();

// Add health check middleware to critical routes
router.use(dbHealthCheck);

// Get user's prayers
router.get('/prayers', authenticateToken, async (req, res) => {
  let connection = null;

  try {
    const { user } = req;
    const { date, month, year } = req.query;

    console.log('📥 Prayer API Request:', {
      user_id: user.id,
      query_params: { date, month, year }
    });

    // Get connection with timeout
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
      query += ' AND DATE(p.prayer_date) = ?';
      queryParams.push(date);
      console.log('🗓️ Filtering by specific date:', date);
    } else if (month && year) {
      query += ' AND YEAR(p.prayer_date) = ? AND MONTH(p.prayer_date) = ?';
      queryParams.push(year, month);
      console.log('📅 Filtering by month/year:', { month, year });
    } else {
      query += ' AND YEAR(p.prayer_date) = YEAR(CURDATE()) AND MONTH(p.prayer_date) = MONTH(CURDATE())';
      console.log('📅 Filtering by current month (default)');
    }

    query += ' ORDER BY p.prayer_date DESC, FIELD(p.prayer_type, "Fajr", "Dhuhr", "Asr", "Maghrib", "Isha")';

    console.log('🔍 Executing query:', query);
    console.log('🔍 Query params:', queryParams);

    const [prayers] = await connection.execute(query, queryParams);

    // Normalize the prayer_date format for frontend
    const normalizedPrayers = prayers.map(prayer => ({
      ...prayer,
      prayer_date: prayer.formatted_date
    }));

    console.log('📤 Prayer API Response:', {
      found_prayers: normalizedPrayers.length,
      sample_prayer: normalizedPrayers[0] || null
    });

    res.json({
      success: true,
      data: normalizedPrayers
    });
  } catch (error) {
    console.error('❌ Error fetching prayers:', error);

    // Check if it's a connection error
    if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNRESET') {
      return res.status(503).json({
        success: false,
        message: 'Database connection lost. Please refresh and try again.',
        error: 'CONNECTION_LOST'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch prayers',
      error: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Record a prayer
router.post('/prayers', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { prayer_type, prayer_date, status, location, notes } = req.body;

    console.log('Recording prayer:', { prayer_type, prayer_date, status, location, user_id: user.id });

    // Validation
    if (!prayer_type || !prayer_date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Prayer type, date, and status are required'
      });
    }

    // Validate prayer type
    const validPrayerTypes = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    if (!validPrayerTypes.includes(prayer_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid prayer type'
      });
    }

    // Validate status
    const validStatuses = ['prayed', 'missed', 'upcoming'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get user's mosque
    const [userData] = await pool.execute(
      'SELECT mosque_id FROM users WHERE id = ?',
      [user.id]
    );

    const mosqueId = userData[0]?.mosque_id;

    // Check if prayer record already exists - use DATE() function for comparison
    const [existingPrayer] = await pool.execute(
      'SELECT id FROM prayers WHERE user_id = ? AND prayer_type = ? AND DATE(prayer_date) = ?',
      [user.id, prayer_type, prayer_date]
    );

    let result;
    let prayerId;

    if (existingPrayer.length > 0) {
      // Update existing prayer
      prayerId = existingPrayer[0].id;
      await pool.execute(
        `UPDATE prayers SET 
         status = ?, 
         location = ?, 
         notes = ?, 
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, location || 'mosque', notes || null, prayerId]
      );
      console.log('Updated existing prayer:', prayerId);
    } else {
      // Insert new prayer with proper date format
      [result] = await pool.execute(
        `INSERT INTO prayers (user_id, mosque_id, prayer_type, prayer_date, status, location, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.id, mosqueId, prayer_type, prayer_date, status, location || 'mosque', notes || null]
      );
      prayerId = result.insertId;
      console.log('Created new prayer:', prayerId);
    }

    // Fetch the updated/created prayer record with formatted date
    const [prayer] = await pool.execute(
      `SELECT p.*, m.name as mosque_name,
              DATE_FORMAT(p.prayer_date, '%Y-%m-%d') as formatted_date
       FROM prayers p
       LEFT JOIN mosques m ON p.mosque_id = m.id
       WHERE p.id = ?`,
      [prayerId]
    );

    if (prayer.length === 0) {
      throw new Error('Failed to retrieve prayer record');
    }

    // Normalize the response
    const normalizedPrayer = {
      ...prayer[0],
      prayer_date: prayer[0].formatted_date
    };

    res.status(200).json({
      success: true,
      message: 'Prayer recorded successfully',
      data: normalizedPrayer
    });
  } catch (error) {
    console.error('Error recording prayer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record prayer',
      error: error.message
    });
  }
});

// Get prayer statistics
router.get('/prayers/stats', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { period = '30' } = req.query; // days

    // Overall stats for the period
    const [overallStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_prayers,
        COUNT(CASE WHEN status = 'prayed' THEN 1 END) as prayed_count,
        COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed_count,
        ROUND(
          CASE 
            WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN status = 'prayed' THEN 1 END) / COUNT(*)) * 100
            ELSE 0
          END, 2
        ) as attendance_rate
       FROM prayers 
       WHERE user_id = ? AND prayer_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [user.id, period]
    );

    // Prayer type breakdown
    const [prayerTypeStats] = await pool.execute(
      `SELECT 
        prayer_type,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'prayed' THEN 1 END) as prayed,
        ROUND(
          CASE 
            WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN status = 'prayed' THEN 1 END) / COUNT(*)) * 100
            ELSE 0
          END, 2
        ) as rate
       FROM prayers 
       WHERE user_id = ? AND prayer_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY prayer_type
       ORDER BY FIELD(prayer_type, 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha')`,
      [user.id, period]
    );

    // FIXED Current streak calculation - simple approach
    let currentStreak = 0;
    
    try {
      // Simple streak calculation - count consecutive days with all prayers completed
      const [streakResult] = await pool.execute(
        `SELECT COUNT(DISTINCT p1.prayer_date) as streak_count
         FROM prayers p1
         WHERE p1.user_id = ?
         AND p1.prayer_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         AND p1.prayer_date <= CURDATE()
         AND NOT EXISTS (
           SELECT 1 FROM prayers p2 
           WHERE p2.user_id = p1.user_id 
           AND p2.prayer_date = p1.prayer_date 
           AND p2.status = 'missed'
         )
         AND (
           SELECT COUNT(*) FROM prayers p3 
           WHERE p3.user_id = p1.user_id 
           AND p3.prayer_date = p1.prayer_date
         ) >= 5`,
        [user.id]
      );
      
      currentStreak = streakResult[0]?.streak_count || 0;
      console.log('🔍 Calculated current streak:', currentStreak);
      
    } catch (streakError) {
      console.error('❌ Error calculating streak:', streakError.message);
      currentStreak = 0;
    }

    res.json({
      success: true,
      data: {
        overall: overallStats[0],
        byPrayerType: prayerTypeStats,
        currentStreak: currentStreak
      }
    });
  } catch (error) {
    console.error('Error fetching prayer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prayer statistics',
      error: error.message
    });
  }
});

module.exports = router;
