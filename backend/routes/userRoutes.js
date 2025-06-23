const express = require("express");
const { pool } = require("../config/database");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get comprehensive user profile
router.get("/users/profile", authenticateToken, async (req, res) => {
  try {
    const { user } = req;

    const [userRows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.phone, u.role, u.status, 
              u.full_name as fullName, u.date_of_birth as dateOfBirth, 
              u.address, u.area, u.mobility, 
              u.living_on_rent as onRent, 
              u.zakath_eligible as zakathEligible, 
              u.differently_abled as differentlyAbled, 
              u.muallafathil_quloob as MuallafathilQuloob,
              u.joined_date, u.last_login, u.created_at, u.updated_at,
              u.otp_verified, u.login_attempts,
              m.name as mosque_name,
              CONCAT(UPPER(LEFT(COALESCE(u.area, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId
       FROM users u
       LEFT JOIN mosques m ON u.mosque_id = m.id
       WHERE u.id = ?`,
      [user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove sensitive information
    const userData = userRows[0];
    delete userData.password;
    delete userData.reset_token;
    delete userData.otp_code;
    delete userData.account_locked_until;

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
});

// Update profile with comprehensive information
router.put("/users/profile", authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const {
      fullName,
      phone,
      dateOfBirth,
      address,
      area,
      mobility,
      onRent,
      zakathEligible,
      differentlyAbled,
      MuallafathilQuloob,
    } = req.body;

    console.log("📝 Updating user profile:", req.body);

    // Update user in database with comprehensive data
    const [result] = await pool.execute(
      `UPDATE users SET
        full_name = ?,
        phone = ?,
        date_of_birth = ?,
        address = ?,
        area = ?,
        mobility = ?,
        living_on_rent = ?,
        zakath_eligible = ?,
        differently_abled = ?,
        muallafathil_quloob = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        fullName || null,
        phone || null,
        dateOfBirth || null,
        address || null,
        area || null,
        mobility || null,
        onRent || false,
        zakathEligible || false,
        differentlyAbled || false,
        MuallafathilQuloob || false,
        user.id,
      ]
    );

    // Fetch updated user data with proper field mappings
    const [updatedUser] = await pool.execute(
      `SELECT 
        id, username, email, phone, role, status, 
        full_name as fullName,
        date_of_birth as dateOfBirth,
        address, area, mobility,
        living_on_rent as onRent,
        zakath_eligible as zakathEligible,
        differently_abled as differentlyAbled,
        muallafathil_quloob as MuallafathilQuloob,
        joined_date, last_login, updated_at,
        CONCAT(UPPER(LEFT(COALESCE(area, 'GEN'), 2)), LPAD(id, 4, '0')) as memberId
      FROM users 
      WHERE id = ?`,
      [user.id]
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

module.exports = router;
