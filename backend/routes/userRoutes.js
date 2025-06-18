const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user profile - ENHANCED with more details
router.get('/users/profile', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    
    const [userRows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.phone, u.role, u.status, 
              u.joined_date, u.last_login, u.created_at, u.updated_at,
              u.otp_verified, u.login_attempts, u.account_locked_until,
              m.name as mosque_name
       FROM users u
       LEFT JOIN mosques m ON u.mosque_id = m.id
       WHERE u.id = ?`,
      [user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive information
    const userData = userRows[0];
    delete userData.password;
    delete userData.reset_token;
    delete userData.otp_code;

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/users/profile', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { phone } = req.body; // Only allow phone updates for now

    const [result] = await pool.execute(
      'UPDATE users SET phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [phone, user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

module.exports = router;
