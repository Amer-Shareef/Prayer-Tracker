const express = require("express");
const bcrypt = require("bcrypt");
const { pool } = require("../config/database"); // Fixed import - use database.js
const { authenticateToken, authorizeRole } = require("../middleware/auth");

const router = express.Router();

// Get all members for a founder's mosque
router.get(
  "/members",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { user } = req;

      let query = `
      SELECT u.id, u.full_name as fullName, u.username, u.email, u.phone, u.role, u.status, 
             u.joined_date, u.last_login, u.created_at, u.date_of_birth as dateOfBirth, 
             u.address, u.area, u.mobility, u.living_on_rent as onRent, u.zakath_eligible as zakathEligible, 
             u.differently_abled as differentlyAbled, u.muallafathil_quloob as MuallafathilQuloob, 
             m.name as mosque_name,
             CONCAT(UPPER(LEFT(COALESCE(u.area, 'GEN'), 2)), LPAD(u.id, 4, '0')) as memberId,
             COUNT(p.id) as total_prayers,
             COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) as prayed_count,
             CASE 
               WHEN COUNT(p.id) > 0 THEN ROUND((COALESCE(SUM(COALESCE(p.fajr, 0) + COALESCE(p.dhuhr, 0) + COALESCE(p.asr, 0) + COALESCE(p.maghrib, 0) + COALESCE(p.isha, 0)), 0) / (COUNT(p.id) * 5)) * 100, 2)
               ELSE 0 
             END as attendance_rate
      FROM users u
      LEFT JOIN mosques m ON u.mosque_id = m.id
      LEFT JOIN prayers p ON u.id = p.user_id AND p.prayer_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `;
      let queryParams = [];

      // If founder, only show members from their mosque
      // If superadmin, show all members
      if (user.role === "Founder") {
        query += ` WHERE u.mosque_id = (SELECT mosque_id FROM users WHERE id = ?)`;
        queryParams.push(user.id);
      } else if (user.role === "Member") {
        // Members should only see their own data (if this route is accessible to them)
        query += ` WHERE u.id = ?`;
        queryParams.push(user.id);
      }
      // SuperAdmin sees all members (no WHERE clause added)

      query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

      const [members] = await pool.execute(query, queryParams);

      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch members",
        error: error.message,
      });
    }
  }
);

// Add new member - ENHANCED for comprehensive data
router.post(
  "/members",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const {
        fullName,
        username,
        email,
        phone,
        password,
        confirmPassword,
        role = "Member",
        dateOfBirth,
        address,
        area,
        mobility,
        onRent = false,
        zakathEligible = false,
        differentlyAbled = false,
        MuallafathilQuloob = false,
      } = req.body;

      console.log("📝 Received member data:", {
        fullName,
        username,
        email,
        phone,
        role,
        dateOfBirth,
        address,
        area,
        mobility,
        onRent,
        zakathEligible,
        differentlyAbled,
        MuallafathilQuloob,
      });

      const { user } = req;

      // Enhanced validation
      if (!fullName || !username || !email || !password || !phone) {
        return res.status(400).json({
          success: false,
          message:
            "Full name, username, email, phone number, and password are required",
        });
      }

      // Remove confirmPassword validation since it's frontend-only
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address",
        });
      }

      // Phone number validation - must be in format +94XXXXXXXXX (exactly 9 digits after +94)
      const phoneRegex = /^\+94\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number must be in format +94XXXXXXXXX (exactly 9 digits after +94)",
        });
      }

      // Check if username, email, or phone already exists
      const [existingUsers] = await pool.execute(
        "SELECT id, username, email, phone FROM users WHERE username = ? OR email = ? OR phone = ?",
        [username, email, phone]
      );

      if (existingUsers.length > 0) {
        const existing = existingUsers[0];
        if (existing.username === username) {
          return res.status(400).json({
            success: false,
            message: "Username already exists",
          });
        }
        if (existing.email === email) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }
        if (existing.phone === phone) {
          return res.status(400).json({
            success: false,
            message: "Phone number already exists",
          });
        }
      }

      // Get mosque ID for new member
      let mosqueId = null;
      if (user.role === "Founder") {
        // Founders add members to their own mosque
        const [userData] = await pool.execute(
          "SELECT mosque_id FROM users WHERE id = ?",
          [user.id]
        );
        mosqueId = userData[0]?.mosque_id;
      } else if (user.role === "SuperAdmin") {
        // SuperAdmins can specify mosque_id in request body, or use their own if available
        if (req.body.mosque_id) {
          mosqueId = req.body.mosque_id;
        } else {
          const [userData] = await pool.execute(
            "SELECT mosque_id FROM users WHERE id = ?",
            [user.id]
          );
          mosqueId = userData[0]?.mosque_id;
        }
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert comprehensive member data with correct column names
      const [result] = await pool.execute(
        `INSERT INTO users (
        full_name, username, email, phone, password, role, mosque_id, 
        date_of_birth, address, area, mobility, living_on_rent, 
        zakath_eligible, differently_abled, muallafathil_quloob,
        status, joined_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURDATE())`,
        [
          fullName,
          username,
          email,
          phone || null,
          hashedPassword,
          role,
          mosqueId,
          dateOfBirth || null,
          address || null,
          area || null,
          mobility || null,
          onRent,
          zakathEligible,
          differentlyAbled,
          MuallafathilQuloob,
        ]
      );

      console.log("✅ Member inserted with ID:", result.insertId);

      // Fetch the created member with mosque info and proper field mapping
      const [newMember] = await pool.execute(
        `SELECT u.id, u.full_name as fullName, u.username, u.email, u.phone, u.role, u.status, 
              u.joined_date, u.created_at, u.date_of_birth as dateOfBirth, u.address, u.area, 
              u.mobility, u.living_on_rent as onRent, u.zakath_eligible as zakathEligible, 
              u.differently_abled as differentlyAbled, u.muallafathil_quloob as MuallafathilQuloob, 
              m.name as mosque_name
       FROM users u
       LEFT JOIN mosques m ON u.mosque_id = m.id
       WHERE u.id = ?`,
        [result.insertId]
      );

      console.log("✅ Member created successfully:", newMember[0]);

      res.status(201).json({
        success: true,
        message: "Member added successfully",
        data: newMember[0],
      });
    } catch (error) {
      console.error("❌ Error adding member:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add member",
        error: error.message,
      });
    }
  }
);

// Update member
router.put(
  "/members/:id",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, phone, role, status } = req.body;
      const { user } = req;

      // Check if member exists and access permissions
      let checkQuery = "SELECT * FROM users WHERE id = ?";
      let checkParams = [id];

      if (user.role === "Founder") {
        // Founders can only edit members from their mosque
        checkQuery +=
          " AND mosque_id = (SELECT mosque_id FROM users WHERE id = ?)";
        checkParams.push(user.id);
      }
      // SuperAdmin can edit any member (no additional WHERE clause)

      const [existingMember] = await pool.execute(checkQuery, checkParams);

      if (existingMember.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Member not found or access denied",
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
          message: "Member not found",
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
        message: "Member updated successfully",
        data: updatedMember[0],
      });
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update member",
        error: error.message,
      });
    }
  }
);

// Delete member
router.delete(
  "/members/:id",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { user } = req;

      // Check if member exists and access permissions
      let checkQuery = "SELECT * FROM users WHERE id = ?";
      let checkParams = [id];

      if (user.role === "Founder") {
        // Founders can only delete members from their mosque
        checkQuery +=
          " AND mosque_id = (SELECT mosque_id FROM users WHERE id = ?)";
        checkParams.push(user.id);
      }
      // SuperAdmin can delete any member (no additional WHERE clause)

      const [existingMember] = await pool.execute(checkQuery, checkParams);

      if (existingMember.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Member not found or access denied",
        });
      }

      // Delete member
      const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Member not found",
        });
      }

      res.json({
        success: true,
        message: "Member deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting member:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete member",
        error: error.message,
      });
    }
  }
);

// Get founders from the same mosque (for mentor selection)
router.get(
  "/founders",
  authenticateToken,
  authorizeRole(["Founder", "SuperAdmin"]),
  async (req, res) => {
    try {
      const { user } = req;

      let query = `
      SELECT u.id, u.full_name as fullName, u.username, u.email, u.phone, u.role, u.status, 
             u.joined_date, u.last_login, u.created_at, u.mosque_id,
             m.name as mosque_name
      FROM users u
      LEFT JOIN mosques m ON u.mosque_id = m.id
      WHERE u.role = 'Founder' AND u.status = 'active'
    `;
      let queryParams = [];

      // If founder, only show founders from their mosque (excluding themselves)
      if (user.role === "Founder") {
        query += ` AND u.mosque_id = (SELECT mosque_id FROM users WHERE id = ?) AND u.id != ?`;
        queryParams.push(user.id, user.id);
      }
      // SuperAdmin can see all founders (no additional WHERE clause needed)

      query += ` ORDER BY u.full_name, u.username`;

      const [founders] = await pool.execute(query, queryParams);

      console.log(`✅ Found ${founders.length} founders for mentor selection`);
      res.json({
        success: true,
        data: founders,
      });
    } catch (error) {
      console.error("❌ Error fetching founders:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch founders",
        details: error.message,
      });
    }
  }
);

module.exports = router;
