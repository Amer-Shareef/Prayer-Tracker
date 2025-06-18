const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../config/database'); // Fixed import - use database.js
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get all members for a founder's mosque
router.get('/members', authenticateToken, authorizeRole(['Founder', 'SuperAdmin']), async (req, res) => {
  try {
    const { user } = req;
    
    let query = `
      SELECT u.id, u.username, u.email, u.phone, u.role, u.status, u.joined_date, 
             u.last_login, u.created_at, m.name as mosque_name,
             COUNT(p.id) as total_prayers,
             COUNT(CASE WHEN p.status = 'prayed' THEN 1 END) as prayed_count,
             ROUND((COUNT(CASE WHEN p.status = 'prayed' THEN 1 END) / COUNT(p.id)) * 100, 2) as attendance_rate
      FROM users u
      LEFT JOIN mosques m ON u.mosque_id = m.id
      LEFT JOIN prayers p ON u.id = p.user_id AND p.prayer_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;
    let queryParams = [];

    // If founder, only show members from their mosque
    if (user.role === 'Founder') {
      query += ` WHERE u.mosque_id = (SELECT mosque_id FROM users WHERE id = ?)`;
      queryParams.push(user.id);
    }
    
    query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const [members] = await pool.execute(query, queryParams);
    
    res.json({
      success: true,
      data: members
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message
    });
  }
});

// Add new member
router.post('/members', authenticateToken, authorizeRole(['Founder', 'SuperAdmin']), async (req, res) => {
  try {
    const { username, email, phone, password, role = 'Member' } = req.body;
    const { user } = req;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Check if username or email already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Get founder's mosque ID
    let mosqueId = null;
    if (user.role === 'Founder') {
      const [founderData] = await pool.execute(
        'SELECT mosque_id FROM users WHERE id = ?',
        [user.id]
      );
      mosqueId = founderData[0]?.mosque_id;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new member
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, phone, password, role, mosque_id, status, joined_date) 
       VALUES (?, ?, ?, ?, ?, ?, 'active', CURDATE())`,
      [username, email, phone || null, hashedPassword, role, mosqueId]
    );

    // Fetch the created member with mosque info
    const [newMember] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.phone, u.role, u.status, u.joined_date, u.created_at,
              m.name as mosque_name
       FROM users u
       LEFT JOIN mosques m ON u.mosque_id = m.id
       WHERE u.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: newMember[0]
    });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add member',
      error: error.message
    });
  }
});

// Update member
router.put('/members/:id', authenticateToken, authorizeRole(['Founder', 'SuperAdmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, phone, role, status } = req.body;
    const { user } = req;

    // Check if member exists and belongs to founder's mosque (if founder)
    let checkQuery = 'SELECT * FROM users WHERE id = ?';
    let checkParams = [id];
    
    if (user.role === 'Founder') {
      checkQuery += ' AND mosque_id = (SELECT mosque_id FROM users WHERE id = ?)';
      checkParams.push(user.id);
    }

    const [existingMember] = await pool.execute(checkQuery, checkParams);
    
    if (existingMember.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found or access denied'
      });
    }

    // Update member
    const [result] = await pool.execute(
      `UPDATE users SET username = ?, email = ?, phone = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [username, email, phone, role, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Fetch updated member
    const [updatedMember] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.phone, u.role, u.status, u.joined_date, u.created_at,
              m.name as mosque_name
       FROM users u
       LEFT JOIN mosques m ON u.mosque_id = m.id
       WHERE u.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Member updated successfully',
      data: updatedMember[0]
    });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member',
      error: error.message
    });
  }
});

// Delete member
router.delete('/members/:id', authenticateToken, authorizeRole(['Founder', 'SuperAdmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // Check if member exists and belongs to founder's mosque (if founder)
    let checkQuery = 'SELECT * FROM users WHERE id = ?';
    let checkParams = [id];
    
    if (user.role === 'Founder') {
      checkQuery += ' AND mosque_id = (SELECT mosque_id FROM users WHERE id = ?)';
      checkParams.push(user.id);
    }

    const [existingMember] = await pool.execute(checkQuery, checkParams);
    
    if (existingMember.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found or access denied'
      });
    }

    // Delete member
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete member',
      error: error.message
    });
  }
});

module.exports = router;
