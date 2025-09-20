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
              u.address, u.area_id, u.mobility, 
              u.living_on_rent as onRent, 
              u.zakath_eligible as zakathEligible, 
              u.differently_abled as differentlyAbled, 
              u.muallafathil_quloob as MuallafathilQuloob,
              u.place_of_birth as placeOfBirth, u.nic_no as nicNo, u.occupation, 
              u.workplace_address as workplaceAddress, u.family_status as familyStatus, 
              u.widow_assistance as widowAssistance,
              u.joined_date, u.last_login, u.created_at, u.updated_at,
              u.otp_verified, u.login_attempts,
              a.area_name, a.address as area_address,
              CONCAT(UPPER(LEFT(COALESCE(a.area_name, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId
       FROM users u
       LEFT JOIN areas a ON u.area_id = a.area_id
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

// Update profile - only updates provided fields (PATCH behavior)
router.put("/users/profile", authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const updateData = req.body;

    console.log("📝 Updating user profile:", updateData);

    // Build dynamic SQL query to only update provided fields
    const fieldMappings = {
      fullName: "full_name",
      phone: "phone",
      dateOfBirth: "date_of_birth",
      address: "address",
      area_id: "area_id",
      sub_areas_id: "sub_areas_id",
      sub_area_id: "sub_areas_id", // Support both naming conventions
      mobility: "mobility",
      onRent: "living_on_rent",
      zakathEligible: "zakath_eligible",
      differentlyAbled: "differently_abled",
      MuallafathilQuloob: "muallafathil_quloob",
      placeOfBirth: "place_of_birth",
      nicNo: "nic_no",
      occupation: "occupation",
      workplaceAddress: "workplace_address",
      familyStatus: "family_status",
      widowAssistance: "widow_assistance",
    };

    const updateFields = [];
    const updateValues = [];

    // Only include fields that are provided in the request body
    Object.keys(updateData).forEach((key) => {
      console.log(
        `🔍 Checking field: ${key}, value: ${updateData[key]}, mapping: ${fieldMappings[key]}`
      );
      if (
        fieldMappings[key] &&
        updateData[key] !== undefined &&
        updateData[key] !== null
      ) {
        updateFields.push(`${fieldMappings[key]} = ?`);
        updateValues.push(updateData[key]);
        console.log(
          `✅ Added field: ${fieldMappings[key]} = ${updateData[key]}`
        );
      } else {
        console.log(
          `❌ Skipped field: ${key} - mapping exists: ${!!fieldMappings[
            key
          ]}, value: ${updateData[key]}`
        );
      }
    });

    console.log(
      `📊 Total fields to update: ${updateFields.length}`,
      updateFields
    );

    // If no valid fields to update, return error
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Add updated_at timestamp
    updateFields.push("updated_at = CURRENT_TIMESTAMP");

    // Build and execute dynamic query
    const sql = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    updateValues.push(user.id);

    const [result] = await pool.execute(sql, updateValues);

    // Fetch updated user data with proper field mappings
    const [updatedUser] = await pool.execute(
      `SELECT 
        id, username, email, phone, role, status, 
        full_name as fullName,
        date_of_birth as dateOfBirth,
        address, area_id, sub_areas_id, mobility,
        living_on_rent as onRent,
        zakath_eligible as zakathEligible,
        differently_abled as differentlyAbled,
        muallafathil_quloob as MuallafathilQuloob,
        place_of_birth as placeOfBirth, nic_no as nicNo, occupation,
        workplace_address as workplaceAddress, family_status as familyStatus,
        widow_assistance as widowAssistance,
        joined_date, last_login, updated_at,
        CONCAT(UPPER(LEFT(COALESCE(area_id, 'GEN'), 2)), LPAD(id, 4, '0')) as memberId
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
