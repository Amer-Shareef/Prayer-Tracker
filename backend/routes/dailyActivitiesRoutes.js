const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { dbHealthCheck } = require('../middleware/dbHealthCheck');

const router = express.Router();

// Get daily activities for user
router.get('/', authenticateToken, dbHealthCheck, async (req, res) => {
  try {
    const { user } = req;
    const { date, start_date, end_date, activity_type } = req.query;

    let query = `
      SELECT * FROM daily_activities 
      WHERE user_id = ?
    `;
    const queryParams = [user.id];

    // Add date filters
    if (date) {
      query += ' AND activity_date = ?';
      queryParams.push(date);
    } else if (start_date && end_date) {
      query += ' AND activity_date BETWEEN ? AND ?';
      queryParams.push(start_date, end_date);
    } else if (start_date) {
      query += ' AND activity_date >= ?';
      queryParams.push(start_date);
    } else if (end_date) {
      query += ' AND activity_date <= ?';
      queryParams.push(end_date);
    }

    // Add activity type filter
    if (activity_type) {
      query += ' AND activity_type = ?';
      queryParams.push(activity_type);
    }

    query += ' ORDER BY activity_date DESC, activity_type';

    const [activities] = await pool.execute(query, queryParams);

    res.json({
      success: true,
      data: activities,
      count: activities.length
    });

  } catch (error) {
    console.error('Error fetching daily activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily activities',
      error: error.message
    });
  }
});

// Record or update daily activity - UPDATED (removed notes handling)
router.post('/', authenticateToken, dbHealthCheck, async (req, res) => {
  try {
    const { user } = req;
    const { activity_date, activity_type, count_value = 0, minutes_value = 0 } = req.body;

    if (!activity_date || !activity_type) {
      return res.status(400).json({
        success: false,
        message: 'Activity date and type are required'
      });
    }

    if (!['zikr', 'quran'].includes(activity_type)) {
      return res.status(400).json({
        success: false,
        message: 'Activity type must be either "zikr" or "quran"'
      });
    }

    // Use INSERT ... ON DUPLICATE KEY UPDATE to handle both insert and update - UPDATED
    const [result] = await pool.execute(
      `INSERT INTO daily_activities (user_id, activity_date, activity_type, count_value, minutes_value)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       count_value = VALUES(count_value),
       minutes_value = VALUES(minutes_value),
       updated_at = CURRENT_TIMESTAMP`,
      [user.id, activity_date, activity_type, count_value, minutes_value]
    );

    // Get the updated/inserted record
    const [activities] = await pool.execute(
      'SELECT * FROM daily_activities WHERE user_id = ? AND activity_date = ? AND activity_type = ?',
      [user.id, activity_date, activity_type]
    );

    res.json({
      success: true,
      message: result.insertId ? 'Activity recorded successfully' : 'Activity updated successfully',
      data: activities[0]
    });

  } catch (error) {
    console.error('Error recording daily activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record daily activity',
      error: error.message
    });
  }
});

// Get activity statistics
router.get('/stats', authenticateToken, dbHealthCheck, async (req, res) => {
  try {
    const { user } = req;
    const { days = 7 } = req.query;

    // Get statistics for the specified number of days
    const [stats] = await pool.execute(
      `SELECT 
        activity_type,
        COUNT(*) as total_days,
        SUM(count_value) as total_count,
        SUM(minutes_value) as total_minutes,
        AVG(count_value) as average_daily_count,
        AVG(minutes_value) as average_daily_minutes,
        MAX(count_value) as max_count,
        MAX(minutes_value) as max_minutes
       FROM daily_activities 
       WHERE user_id = ? 
       AND activity_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY activity_type`,
      [user.id, parseInt(days)]
    );

    // Format the response
    const formattedStats = {
      zikr: {
        total_days: 0,
        total_count: 0,
        average_daily: 0,
        max_daily: 0
      },
      quran: {
        total_days: 0,
        total_minutes: 0,
        average_daily: 0,
        max_daily: 0
      }
    };

    stats.forEach(stat => {
      if (stat.activity_type === 'zikr') {
        formattedStats.zikr = {
          total_days: stat.total_days,
          total_count: stat.total_count || 0,
          average_daily: Math.round(stat.average_daily_count || 0),
          max_daily: stat.max_count || 0
        };
      } else if (stat.activity_type === 'quran') {
        formattedStats.quran = {
          total_days: stat.total_days,
          total_minutes: stat.total_minutes || 0,
          average_daily: Math.round(stat.average_daily_minutes || 0),
          max_daily: stat.max_minutes || 0
        };
      }
    });

    res.json({
      success: true,
      data: formattedStats,
      period_days: parseInt(days)
    });

  } catch (error) {
    console.error('Error fetching activity statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
});

// Update specific activity - UPDATED (removed notes handling)
router.put('/:id', authenticateToken, dbHealthCheck, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { count_value, minutes_value } = req.body;

    // Verify the activity belongs to the user
    const [existing] = await pool.execute(
      'SELECT * FROM daily_activities WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Update the activity - UPDATED
    await pool.execute(
      `UPDATE daily_activities 
       SET count_value = ?, minutes_value = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [count_value || 0, minutes_value || 0, id, user.id]
    );

    // Get the updated record
    const [updated] = await pool.execute(
      'SELECT * FROM daily_activities WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: updated[0]
    });

  } catch (error) {
    console.error('Error updating daily activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update daily activity',
      error: error.message
    });
  }
});

// Delete activity
router.delete('/:id', authenticateToken, dbHealthCheck, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    // Verify the activity belongs to the user
    const [existing] = await pool.execute(
      'SELECT * FROM daily_activities WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Delete the activity
    await pool.execute(
      'DELETE FROM daily_activities WHERE id = ? AND user_id = ?',
      [id, user.id]
    );

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting daily activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete daily activity',
      error: error.message
    });
  }
});

module.exports = router;
