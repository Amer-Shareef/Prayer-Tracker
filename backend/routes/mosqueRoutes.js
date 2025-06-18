const express = require('express');
const { pool } = require('../config/database'); // Fixed import - use database.js
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all mosques (for SuperAdmin) or user's mosque
router.get('/mosques', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    let query = `
      SELECT m.*, u.username as founder_name,
             COUNT(members.id) as member_count
      FROM mosques m
      LEFT JOIN users u ON m.founder_id = u.id
      LEFT JOIN users members ON m.id = members.mosque_id
    `;
    let queryParams = [];

    if (user.role !== 'SuperAdmin') {
      if (user.role === 'Founder') {
        query += ' WHERE m.founder_id = ?';
        queryParams.push(user.id);
      } else {
        query += ' WHERE m.id = ?';
        queryParams.push(user.mosque_id);
      }
    }

    query += ' GROUP BY m.id ORDER BY m.created_at DESC';

    const [mosques] = await pool.execute(query, queryParams);

    // Get today's prayer times for each mosque
    const today = new Date().toISOString().split('T')[0];
    
    for (let mosque of mosques) {
      // First try to get specific prayer times for today
      const [todayTimes] = await pool.execute(
        'SELECT * FROM prayer_times WHERE mosque_id = ? AND prayer_date = ?',
        [mosque.id, today]
      );

      if (todayTimes.length > 0) {
        // Use specific times for today
        mosque.today_prayer_times = {
          Fajr: todayTimes[0].fajr_time,
          Dhuhr: todayTimes[0].dhuhr_time,
          Asr: todayTimes[0].asr_time,
          Maghrib: todayTimes[0].maghrib_time,
          Isha: todayTimes[0].isha_time
        };
      } else {
        // Fall back to default mosque prayer times
        if (typeof mosque.prayer_times === 'string') {
          try {
            mosque.today_prayer_times = JSON.parse(mosque.prayer_times);
          } catch (e) {
            console.error('Error parsing prayer times:', e);
            mosque.today_prayer_times = {
              Fajr: '05:30:00',
              Dhuhr: '12:30:00',
              Asr: '15:45:00',
              Maghrib: '18:20:00',
              Isha: '19:45:00'
            };
          }
        } else if (mosque.prayer_times) {
          mosque.today_prayer_times = mosque.prayer_times;
        } else {
          // Default prayer times
          mosque.today_prayer_times = {
            Fajr: '05:30:00',
            Dhuhr: '12:30:00',
            Asr: '15:45:00',
            Maghrib: '18:20:00',
            Isha: '19:45:00'
          };
        }
      }
    }

    console.log('Fetched mosques with prayer times:', mosques.map(m => ({ 
      id: m.id, 
      name: m.name, 
      prayer_times: m.today_prayer_times 
    })));

    res.json({
      success: true,
      data: mosques
    });
  } catch (error) {
    console.error('Error fetching mosques:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mosques',
      error: error.message
    });
  }
});

// Get specific mosque
router.get('/mosques/:id', authenticateToken, async (req, res) => {
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
    let queryParams = [id];

    // Access control
    if (user.role === 'Member' && user.mosque_id != id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (user.role === 'Founder') {
      query += ' AND m.founder_id = ?';
      queryParams.push(user.id);
    }

    query += ' GROUP BY m.id';

    const [mosque] = await pool.execute(query, queryParams);

    if (mosque.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mosque not found'
      });
    }

    res.json({
      success: true,
      data: mosque[0]
    });
  } catch (error) {
    console.error('Error fetching mosque:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mosque',
      error: error.message
    });
  }
});

// Create new mosque (SuperAdmin only)
router.post('/mosques', authenticateToken, authorizeRole(['SuperAdmin']), async (req, res) => {
  try {
    const { name, address, phone, email, founder_id, prayer_times } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Mosque name is required'
      });
    }

    // Check if founder exists and is a Founder role
    if (founder_id) {
      const [founder] = await pool.execute(
        'SELECT id, role FROM users WHERE id = ?',
        [founder_id]
      );

      if (founder.length === 0 || founder[0].role !== 'Founder') {
        return res.status(400).json({
          success: false,
          message: 'Invalid founder specified'
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
      await pool.execute(
        'UPDATE users SET mosque_id = ? WHERE id = ?',
        [result.insertId, founder_id]
      );
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
      message: 'Mosque created successfully',
      data: newMosque[0]
    });
  } catch (error) {
    console.error('Error creating mosque:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mosque',
      error: error.message
    });
  }
});

// Update mosque
router.put('/mosques/:id', authenticateToken, authorizeRole(['Founder', 'SuperAdmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, prayer_times } = req.body;
    const { user } = req;

    // Check access rights
    if (user.role === 'Founder') {
      const [mosque] = await pool.execute(
        'SELECT founder_id FROM mosques WHERE id = ?',
        [id]
      );

      if (mosque.length === 0 || mosque[0].founder_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    // Update mosque
    const [result] = await pool.execute(
      `UPDATE mosques SET name = ?, address = ?, phone = ?, email = ?, prayer_times = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, address, phone, email, JSON.stringify(prayer_times), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mosque not found'
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
      message: 'Mosque updated successfully',
      data: updatedMosque[0]
    });
  } catch (error) {
    console.error('Error updating mosque:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mosque',
      error: error.message
    });
  }
});

module.exports = router;
